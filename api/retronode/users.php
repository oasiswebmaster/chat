<?php
/**
 * Retronode Portal - Fetch active profiles
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// Bootstrap UNA CMS
define('BX_DOL', 1);
require_once('/var/www/una/inc/header.inc.php');
check_logged();

if (!getLoggedId()) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Login required']);
    exit;
}

$currentUserId = getLoggedId();
$db = BxDolDb::getInstance();
$profiles = $db->getAll("SELECT id FROM sys_profiles WHERE status = 'active' AND type != 'system'");
$users = [];

foreach ($profiles as $p) {
    if ($p['id'] == $currentUserId) continue; // Skip current user
    $profile = BxDolProfile::getInstance($p['id']);
    if ($profile) {
        $users[] = [
            'id' => (int)$p['id'],
            'name' => $profile->getDisplayName()
        ];
    }
}

echo json_encode(['ok' => true, 'users' => $users]);
?>
