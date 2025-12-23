<?php
/**
 * Meezan Bank EPG API Proxy (PHP Version)
 * Handles server-side API calls to avoid CORS issues
 * Converted from Python version for better PHP integration
 * 
 * @author Pakistan Medico International
 * @version 2.0.0
 */

// Set headers for CORS and JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Meezan Bank API Configuration
// IMPORTANT: Use API credentials, NOT portal credentials
// API credentials are for programmatic API calls
// Portal credentials are only for the merchant portal GUI
define('MEEZAN_API_URL', 'https://acquiring.meezanbank.com/payment/rest/');
define('MEEZAN_USERNAME', 'PAKISTANMEDICO_api');  // API username (not GUI)
define('MEEZAN_PASSWORD', 'P987658');  // API password (not GUI password)

/**
 * Make a request to Meezan Bank API
 * Equivalent to Python's call_meezan_api function
 * 
 * @param string $endpoint API endpoint (e.g., 'register.do', 'getOrderStatusExtended.do')
 * @param array $params Parameters to send to the API
 * @return array Response array with 'success', 'data', 'raw', and optionally 'error'
 */
function callMeezanAPI($endpoint, $params) {
    $url = MEEZAN_API_URL . $endpoint;
    
    // Add credentials to params (equivalent to Python version)
    $params['userName'] = MEEZAN_USERNAME;
    $params['password'] = MEEZAN_PASSWORD;
    
    // Initialize cURL (equivalent to Python's urllib.request)
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    
    // Set headers (equivalent to Python's add_header)
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    // Handle cURL errors (equivalent to Python's exception handling)
    if ($error) {
        return [
            'success' => false,
            'error' => 'CURL Error: ' . $error
        ];
    }
    
    // Handle HTTP errors (equivalent to Python's http_code check)
    if ($httpCode !== 200) {
        return [
            'success' => false,
            'error' => 'HTTP Error: ' . $httpCode
        ];
    }
    
    // Parse response - Meezan Bank can return either JSON or key=value format
    $data = [];
    
    // Try JSON format first (Meezan Bank sometimes returns JSON)
    $jsonData = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($jsonData)) {
        // Response is JSON format
        $data = $jsonData;
    } else {
        // Try key=value format (traditional format)
        $pairs = explode('&', $response);
        foreach ($pairs as $pair) {
            if (strpos($pair, '=') !== false) {
                list($key, $value) = explode('=', $pair, 2);
                // urldecode is equivalent to Python's urllib.parse.unquote
                $data[urldecode($key)] = urldecode($value);
            }
        }
    }
    
    return [
        'success' => true,
        'data' => $data,
        'raw' => $response,
        'format' => (json_last_error() === JSON_ERROR_NONE) ? 'json' : 'keyvalue'
    ];
}

/**
 * Send JSON response (equivalent to Python's send_json_response)
 * 
 * @param array $data Data to encode as JSON
 * @param int $statusCode HTTP status code
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

/**
 * Send error response (equivalent to Python's send_error_response)
 * 
 * @param string $errorMessage Error message
 * @param int $statusCode HTTP status code
 */
function sendErrorResponse($errorMessage, $statusCode = 400) {
    sendJsonResponse([
        'success' => false,
        'error' => $errorMessage
    ], $statusCode);
}

/**
 * Handle order registration (equivalent to Python's handle_register)
 */
function handleRegister($formData) {
    try {
        // Get required parameters (equivalent to Python's form_data.get())
        $orderNumber = $formData['orderNumber'] ?? '';
        $amount = $formData['amount'] ?? '0';
        $currency = $formData['currency'] ?? '586'; // 586 = Currency code for this account
        $returnUrl = $formData['returnUrl'] ?? '';
        $failUrl = $formData['failUrl'] ?? '';
        
        // Validate required parameters (equivalent to Python's validation)
        if (empty($orderNumber) || empty($amount) || empty($returnUrl)) {
            sendErrorResponse('Missing required parameters');
            return;
        }
        
        // Prepare parameters for Meezan Bank API (equivalent to Python's params dict)
        $params = [
            'orderNumber' => $orderNumber,
            'amount' => $amount,
            'currency' => $currency,
            'returnUrl' => $returnUrl,
            'failUrl' => $failUrl
        ];
        
        // Add optional parameters (equivalent to Python's optional param handling)
        if (!empty($formData['description'])) {
            $params['description'] = $formData['description'];
        }
        if (!empty($formData['email'])) {
            $params['email'] = $formData['email'];
        }
        if (!empty($formData['phone'])) {
            $params['phone'] = $formData['phone'];
        }
        if (!empty($formData['clientId'])) {
            $params['clientId'] = $formData['clientId'];
        }
        
        // Call Meezan Bank API (equivalent to Python's self.call_meezan_api)
        $result = callMeezanAPI('register.do', $params);
        
        if ($result['success']) {
            $data = $result['data'];
            
            // Log the raw response for debugging (remove in production)
            error_log('Meezan Bank API Response: ' . print_r($data, true));
            error_log('Raw Response: ' . ($result['raw'] ?? 'N/A'));
            
            // Check for errors (equivalent to Python's errorCode check)
            // Meezan Bank returns errorCode=0 for success, non-zero for errors
            // Handle both string and integer error codes
            $errorCode = $data['errorCode'] ?? null;
            $hasError = false;
            
            if ($errorCode !== null) {
                // Check if errorCode indicates an error (not 0 or "0")
                if (is_string($errorCode) && $errorCode !== '0') {
                    $hasError = true;
                } elseif (is_numeric($errorCode) && intval($errorCode) !== 0) {
                    $hasError = true;
                }
            }
            
            if ($hasError) {
                $errorMessage = $data['errorMessage'] ?? 'Unknown error from Meezan Bank';
                $errorCodeValue = is_numeric($errorCode) ? intval($errorCode) : $errorCode;
                
                sendJsonResponse([
                    'success' => false,
                    'error' => $errorMessage,
                    'errorCode' => $errorCodeValue,
                    'errorMessage' => $errorMessage,
                    'source' => 'meezan_bank_error',
                    'requires_action' => $errorCodeValue == 5 ? 'password_change_required' : null,
                    'user_message' => $errorCodeValue == 5 
                        ? 'Your Meezan Bank API account requires a password change. Please contact Meezan Bank support or change your password in the merchant portal.'
                        : $errorMessage
                ]);
                return;
            } 
            // Check for orderId and formUrl (Meezan Bank might use different field names)
            // Common variations: orderId/mdOrder, formUrl/redirectUrl
            elseif (isset($data['orderId']) && isset($data['formUrl'])) {
                // Standard response format
                sendJsonResponse([
                    'success' => true,
                    'orderId' => $data['orderId'],
                    'orderNumber' => $orderNumber,
                    'formUrl' => $data['formUrl']
                ]);
            } 
            // Try alternative field names (mdOrder is common in some payment gateways)
            elseif (isset($data['mdOrder']) && isset($data['formUrl'])) {
                sendJsonResponse([
                    'success' => true,
                    'orderId' => $data['mdOrder'],
                    'orderNumber' => $orderNumber,
                    'formUrl' => $data['formUrl']
                ]);
            }
            elseif (isset($data['orderId']) && isset($data['redirectUrl'])) {
                sendJsonResponse([
                    'success' => true,
                    'orderId' => $data['orderId'],
                    'orderNumber' => $orderNumber,
                    'formUrl' => $data['redirectUrl']
                ]);
            }
            else {
                // Log the actual response for debugging
                sendJsonResponse([
                    'success' => false,
                    'error' => 'Invalid response from payment gateway - missing required fields',
                    'debug' => [
                        'hasOrderId' => isset($data['orderId']),
                        'hasMdOrder' => isset($data['mdOrder']),
                        'hasFormUrl' => isset($data['formUrl']),
                        'hasRedirectUrl' => isset($data['redirectUrl']),
                        'errorCode' => $data['errorCode'] ?? 'not_set',
                        'errorMessage' => $data['errorMessage'] ?? 'not_set',
                        'responseKeys' => array_keys($data),
                        'allResponseData' => $data,
                        'rawResponse' => $result['raw'] ?? ''
                    ],
                    'response' => $data,
                    'source' => 'code_validation_failed'
                ]);
            }
        } else {
            // API call failed (network error, HTTP error, etc.)
            sendJsonResponse([
                'success' => false,
                'error' => $result['error'] ?? 'Failed to connect to payment gateway',
                'source' => 'api_connection_failed',
                'debug' => $result
            ]);
        }
    } catch (Exception $e) {
        sendErrorResponse($e->getMessage());
    }
}

/**
 * Handle order status check (equivalent to Python's handle_get_status)
 */
function handleGetStatus($formData, $queryParams) {
    try {
        // Get orderId or orderNumber (equivalent to Python's get logic)
        $orderId = $formData['orderId'] ?? $queryParams['orderId'] ?? '';
        $orderNumber = $formData['orderNumber'] ?? $queryParams['orderNumber'] ?? '';
        
        // Validate parameters
        if (empty($orderId) && empty($orderNumber)) {
            sendErrorResponse('Either orderId or orderNumber is required');
            return;
        }
        
        // Prepare parameters (equivalent to Python's params dict)
        $params = [];
        if (!empty($orderId)) {
            $params['orderId'] = $orderId;
        } else {
            $params['orderNumber'] = $orderNumber;
        }
        
        // Call Meezan Bank API
        $result = callMeezanAPI('getOrderStatusExtended.do', $params);
        
        if ($result['success']) {
            $data = $result['data'];
            
            // Check for errors (equivalent to Python's errorCode check)
            if (isset($data['errorCode']) && $data['errorCode'] !== '0') {
                sendJsonResponse([
                    'success' => false,
                    'error' => $data['errorMessage'] ?? 'Error: ' . ($data['errorCode'] ?? 'Unknown')
                ]);
            } else {
                // Check if payment was successful (orderStatus = 2)
                // Equivalent to Python's orderStatus check
                $isSuccess = isset($data['orderStatus']) && 
                            ($data['orderStatus'] == '2' || $data['orderStatus'] == 2);
                
                // Build response (equivalent to Python's response dict)
                $response = [
                    'success' => $isSuccess,
                    'orderId' => $data['orderId'] ?? $orderId,
                    'orderNumber' => $data['orderNumber'] ?? $orderNumber,
                    'orderStatus' => $data['orderStatus'] ?? '',
                    'amount' => isset($data['amount']) && is_numeric($data['amount']) 
                                ? ($data['amount'] / 100) : null,
                    'currency' => $data['currency'] ?? '',
                    'paymentAmount' => isset($data['paymentAmount']) && is_numeric($data['paymentAmount']) 
                                      ? ($data['paymentAmount'] / 100) : null,
                    'paymentCurrency' => $data['paymentCurrency'] ?? '',
                    'date' => $data['date'] ?? '',
                    'actionCode' => $data['actionCode'] ?? '',
                    'actionCodeDescription' => $data['actionCodeDescription'] ?? '',
                    'errorCode' => $data['errorCode'] ?? '',
                    'errorMessage' => $data['errorMessage'] ?? ''
                ];
                
                sendJsonResponse($response);
            }
        } else {
            sendJsonResponse($result);
        }
    } catch (Exception $e) {
        sendErrorResponse($e->getMessage());
    }
}

/**
 * Main request handler (equivalent to Python's handle_proxy_request)
 */
try {
    // Parse query string (equivalent to Python's urllib.parse.urlparse)
    $queryParams = [];
    if (isset($_SERVER['QUERY_STRING'])) {
        parse_str($_SERVER['QUERY_STRING'], $queryParams);
    }
    
    // Parse form data if POST (equivalent to Python's form_data parsing)
    // Handle both application/x-www-form-urlencoded and multipart/form-data (FormData)
    $formData = [];
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // First try $_POST (works for application/x-www-form-urlencoded)
        if (!empty($_POST)) {
            $formData = $_POST;
        } else {
            // For FormData (multipart/form-data), $_POST should work, but let's also check raw input
            // FormData should populate $_POST automatically, but if not, parse manually
            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            if (strpos($contentType, 'multipart/form-data') !== false) {
                // FormData - should be in $_POST
                $formData = $_POST;
            } else {
                // Try parsing raw input for JSON or other formats
                $rawInput = file_get_contents('php://input');
                if (!empty($rawInput)) {
                    parse_str($rawInput, $formData);
                }
            }
        }
    }
    
    // Get action from query or form data (equivalent to Python's action logic)
    $action = $formData['action'] ?? $queryParams['action'] ?? '';
    
    // Handle different actions (equivalent to Python's if/elif structure)
    if (empty($action)) {
        sendErrorResponse('Missing action parameter');
    } elseif ($action === 'register') {
        handleRegister($formData);
    } elseif ($action === 'getStatus') {
        handleGetStatus($formData, $queryParams);
    } else {
        sendErrorResponse('Invalid action: ' . $action);
    }
} catch (Exception $e) {
    sendErrorResponse($e->getMessage());
}
?>

