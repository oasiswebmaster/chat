<?php
/**
 * Oasis Resort - Config API Endpoint
 * Handles local read/write of configuration JSON files.
 * Avoids CORS and third-party dependencies.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$allowed_keys = ['cards', 'site', 'alert'];
$key = isset($_GET['key']) ? $_GET['key'] : '';

if (!in_array($key, $allowed_keys)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing key parameter.']);
    exit;
}

// Map keys to local file paths
$file_map = [
    'cards' => __DIR__ . '/../data/cards.json',
    'site'  => __DIR__ . '/../data/site-config.json',
    'alert' => __DIR__ . '/../data/alert.json'
];

$file_path = $file_map[$key];

// Handle GET (Read)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($file_path)) {
        // Create default empty structure if file doesn't exist
        if ($key === 'cards') {
            $default = ['sale' => [], 'rental' => []];
        } else if ($key === 'site') {
            $default = [
                'manager_name' => '',
                'manager_phone' => '',
                'manager_email' => '',
                'address_line1' => '2615 Lakeshore Dr',
                'address_line2' => 'Osoyoos, BC V0H 1V6'
            ];
        } else {
            $default = [
                'active' => false,
                'severity' => 'warning',
                'headline' => '',
                'message' => ''
            ];
        }
        file_put_contents($file_path, json_encode($default, JSON_PRETTY_PRINT));
    }
    echo file_get_contents($file_path);
    exit;
}

// Handle POST/PUT (Write)
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON payload.']);
        exit;
    }

    // Ensure the data directory exists
    $dir = dirname($file_path);
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }

    if (file_put_contents($file_path, json_encode($data, JSON_PRETTY_PRINT)) === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write configuration file.']);
        exit;
    }

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed.']);
