<?php
/**
 * Retronode Portal - Chat Proxy API
 * Proxies messages and conversations to/from GitHub Issues
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
$profile = BxDolProfile::getInstance($currentUserId);
$userDisplayName = $profile ? $profile->getDisplayName() : 'Member';

// Load configuration
$config_file = __DIR__ . '/chat_config.json';
if (!file_exists($config_file)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Chat configuration file not found']);
    exit;
}

$config = json_decode(file_get_contents($config_file), true);
$github_token = $config['github_token'] ?? '';
$repo_owner = $config['repo_owner'] ?? '';
$repo_name = $config['repo_name'] ?? '';

if (!$github_token || !$repo_owner || !$repo_name) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Chat configuration is incomplete']);
    exit;
}

function github_request($url, $method = 'GET', $data = null, $token = '') {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Oasis-Resort-Portal');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: token {$token}",
        "Accept: application/vnd.github+json",
        "Content-Type: application/json"
    ]);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ['code' => $http_code, 'body' => $response];
}

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // 1. List all talks
    if ($action === 'list_talks') {
        $url = "https://api.github.com/repos/{$repo_owner}/{$repo_name}/issues?state=all&per_page=100";
        $res = github_request($url, 'GET', null, $github_token);
        
        if ($res['code'] !== 200) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Failed to fetch conversations from GitHub']);
            exit;
        }
        
        $issues = json_decode($res['body'], true);
        $talks = [];
        
        if (is_array($issues)) {
            foreach ($issues as $issue) {
                $body = $issue['body'] ?? '';
                $talk = null;
                
                // Parse metadata comment from issue body
                if (preg_match('/<!--(.*?)-->/s', $body, $matches)) {
                    $metadata = json_decode(trim($matches[1]), true);
                    if ($metadata && isset($metadata['type'])) {
                        $talk = $metadata;
                    }
                }
                
                // Fallback for Issue #1 if no metadata
                if (!$talk && $issue['number'] === 1) {
                    $talk = [
                        'type' => 'public',
                        'name' => 'Community Chat'
                    ];
                }
                
                if ($talk) {
                    $talk['id'] = $issue['number'];
                    $talk['title'] = $issue['title'];
                    
                    // Filter talks based on access control
                    if ($talk['type'] === 'public') {
                        $talks[] = [
                            'id' => $talk['id'],
                            'title' => $talk['name'] ?? 'Community Chat',
                            'type' => 'public'
                        ];
                    } else if (isset($talk['participants']) && is_array($talk['participants'])) {
                        if (in_array($currentUserId, $talk['participants'])) {
                            // Format title for private DMs to show the other user's name
                            if ($talk['type'] === 'private') {
                                $other_name = 'Member';
                                $other_id = null;
                                foreach ($talk['participant_names'] as $p_id => $p_name) {
                                    if ($p_id != $currentUserId) {
                                        $other_name = $p_name;
                                        $other_id = $p_id;
                                    }
                                }
                                $talks[] = [
                                    'id' => $talk['id'],
                                    'title' => $other_name,
                                    'type' => 'private',
                                    'other_user_id' => $other_id
                                ];
                            } else {
                                // Group chats
                                $talks[] = [
                                    'id' => $talk['id'],
                                    'title' => $talk['name'] ?? $issue['title'],
                                    'type' => 'group'
                                ];
                            }
                        }
                    }
                }
            }
        }
        
        // If no public talk exists, add a placeholder or ensure Issue #1 is represented
        $has_public = false;
        foreach ($talks as $t) {
            if ($t['id'] === 1) { $has_public = true; break; }
        }
        if (!$has_public) {
            array_unshift($talks, [
                'id' => 1,
                'title' => 'Community Chat',
                'type' => 'public'
            ]);
        }
        
        echo json_encode(['ok' => true, 'talks' => $talks]);
        exit;
    }
    
    // 2. Fetch messages for a talk
    if ($action === 'get_messages') {
        $talk_id = (int)($_GET['talk_id'] ?? 0);
        if (!$talk_id) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Talk ID required']);
            exit;
        }
        
        $url = "https://api.github.com/repos/{$repo_owner}/{$repo_name}/issues/{$talk_id}/comments?per_page=100";
        $res = github_request($url, 'GET', null, $github_token);
        
        if ($res['code'] !== 200) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Failed to fetch messages']);
            exit;
        }
        
        $comments = json_decode($res['body'], true);
        $messages = [];
        
        if (is_array($comments)) {
            foreach ($comments as $comment) {
                $body = $comment['body'];
                $author = $comment['user']['login'];
                
                if (preg_match('/<!--\{"author":\s*"(.*?)"\}-->/', $body, $matches)) {
                    $author = $matches[1];
                    $body = preg_replace('/<!--\{"author":\s*"(.*?)"\}-->/', '', $body);
                }
                
                $messages[] = [
                    'id' => $comment['id'],
                    'author' => $author,
                    'body' => trim($body),
                    'created_at' => date('Y-m-d H:i', strtotime($comment['created_at']))
                ];
            }
        }
        
        echo json_encode(['ok' => true, 'messages' => $messages]);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // 1. Send message to a talk
    if ($action === 'send_message') {
        $talk_id = (int)($_GET['talk_id'] ?? 0);
        $message = isset($input['message']) ? trim($input['message']) : '';
        
        if (!$talk_id || !$message) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Talk ID and message required']);
            exit;
        }
        
        $formatted_body = "<!--{\"author\": \"{$userDisplayName}\"}-->{$message}";
        $url = "https://api.github.com/repos/{$repo_owner}/{$repo_name}/issues/{$talk_id}/comments";
        $res = github_request($url, 'POST', ['body' => $formatted_body], $github_token);
        
        if ($res['code'] !== 201) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Failed to post message']);
            exit;
        }
        
        echo json_encode(['ok' => true, 'success' => true]);
        exit;
    }
    
    // 2. Create a new talk (Private DM or Group)
    if ($action === 'create_talk') {
        $type = $input['type'] ?? 'private';
        
        if ($type === 'private') {
            $other_id = (int)($input['participant_id'] ?? 0);
            if (!$other_id) {
                http_response_code(400);
                echo json_encode(['ok' => false, 'error' => 'Participant ID required']);
                exit;
            }
            
            // Fetch profiles details
            $other_profile = BxDolProfile::getInstance($other_id);
            if (!$other_profile) {
                http_response_code(400);
                echo json_encode(['ok' => false, 'error' => 'Invalid participant profile']);
                exit;
            }
            $other_name = $other_profile->getDisplayName();
            
            // First search if there's already an issue with these participants
            $url = "https://api.github.com/repos/{$repo_owner}/{$repo_name}/issues?state=all&per_page=100";
            $res = github_request($url, 'GET', null, $github_token);
            if ($res['code'] === 200) {
                $issues = json_decode($res['body'], true);
                if (is_array($issues)) {
                    foreach ($issues as $issue) {
                        $body = $issue['body'] ?? '';
                        if (preg_match('/<!--(.*?)-->/s', $body, $matches)) {
                            $metadata = json_decode(trim($matches[1]), true);
                            if ($metadata && isset($metadata['type']) && $metadata['type'] === 'private') {
                                $participants = $metadata['participants'];
                                if (in_array($currentUserId, $participants) && in_array($other_id, $participants)) {
                                    // Found existing private conversation! Return its ID
                                    echo json_encode(['ok' => true, 'talk_id' => $issue['number']]);
                                    exit;
                                }
                            }
                        }
                    }
                }
            }
            
            // Otherwise, create a new issue for this private chat
            $metadata = [
                'type' => 'private',
                'participants' => [$currentUserId, $other_id],
                'participant_names' => [
                    (string)$currentUserId => $userDisplayName,
                    (string)$other_id => $other_name
                ]
            ];
            
            $issue_title = "Chat: {$userDisplayName} & {$other_name}";
            $issue_body = "<!--" . json_encode($metadata) . "-->\nPrivate chat room.";
            
            $url = "https://api.github.com/repos/{$repo_owner}/{$repo_name}/issues";
            $payload = [
                'title' => $issue_title,
                'body' => $issue_body
            ];
            $res = github_request($url, 'POST', $payload, $github_token);
            
            if ($res['code'] !== 201) {
                http_response_code(500);
                echo json_encode(['ok' => false, 'error' => 'Failed to create talk']);
                exit;
            }
            
            $new_issue = json_decode($res['body'], true);
            echo json_encode(['ok' => true, 'talk_id' => $new_issue['number']]);
            exit;
            
        } else if ($type === 'group') {
            $name = trim($input['name'] ?? 'Group Talk');
            $participant_ids = $input['participant_ids'] ?? [];
            
            // Add current user to group
            if (!in_array($currentUserId, $participant_ids)) {
                $participant_ids[] = $currentUserId;
            }
            
            $participant_names = [
                (string)$currentUserId => $userDisplayName
            ];
            
            foreach ($participant_ids as $p_id) {
                $p_id = (int)$p_id;
                if ($p_id !== $currentUserId) {
                    $p_profile = BxDolProfile::getInstance($p_id);
                    if ($p_profile) {
                        $participant_names[(string)$p_id] = $p_profile->getDisplayName();
                    }
                }
            }
            
            $metadata = [
                'type' => 'group',
                'name' => $name,
                'participants' => array_map('intval', $participant_ids),
                'participant_names' => $participant_names
            ];
            
            $issue_title = "Group: {$name}";
            $issue_body = "<!--" . json_encode($metadata) . "-->\nGroup chat room.";
            
            $url = "https://api.github.com/repos/{$repo_owner}/{$repo_name}/issues";
            $payload = [
                'title' => $issue_title,
                'body' => $issue_body
            ];
            $res = github_request($url, 'POST', $payload, $github_token);
            
            if ($res['code'] !== 201) {
                http_response_code(500);
                echo json_encode(['ok' => false, 'error' => 'Failed to create group talk']);
                exit;
            }
            
            $new_issue = json_decode($res['body'], true);
            echo json_encode(['ok' => true, 'talk_id' => $new_issue['number']]);
            exit;
        }
    }
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
?>
