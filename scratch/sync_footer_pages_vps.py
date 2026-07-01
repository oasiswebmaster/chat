import sys, os
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file

php_script = """<?php
require_once('/var/www/oasis-admin/vendor/erusev/parsedown/Parsedown.php');
$parsedown = new Parsedown();

$pages_dir = '/var/www/oasis-admin/user/pages';
$frontend_data = '/var/www/oasis-frontend/data';

$mappings = [
    '05.resort-info/resort_info.md' => 'resort-info',
    '06.bookings/bookings.md'       => 'bookings',
    '07.privacy/privacy.md'         => 'privacy'
];

foreach ($mappings as $file_path => $slug) {
    $full_path = $pages_dir . '/' . $file_path;
    if (!file_exists($full_path)) {
        echo "File not found: $full_path\\n";
        continue;
    }
    
    $content = file_get_contents($full_path);
    
    // Parse YAML frontmatter and Markdown body
    if (preg_match('/^---\\s*\\n(.*?)\\n---\\s*\\n(.*)$/s', $content, $matches)) {
        $yaml_str = $matches[1];
        $body = trim($matches[2]);
        
        // Parse title manually from YAML
        $title = '';
        if (preg_match('/^title:\\s*(.*)$/m', $yaml_str, $title_match)) {
            $title = trim($title_match[1], " \\t\\n\\r\\0\\x0B'\\\"");
        }
        
        $html = $parsedown->text($body);
        
        $page_data = [
            'title' => $title,
            'content' => $html
        ];
        
        file_put_contents(
            $frontend_data . '/page-' . $slug . '.json',
            json_encode($page_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
        echo "Synced page-{$slug}.json successfully\\n";
    } else {
        echo "Could not parse YAML for $file_path\\n";
    }
}
"""

local_path = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\sync_footer_pages.php"
with open(local_path, "w", encoding="utf-8") as f:
    f.write(php_script)

print("Uploading to VPS...")
upload_file(local_path, "/tmp/sync_footer_pages.php")
run_cmd("sudo php /tmp/sync_footer_pages.php")
run_cmd("rm -f /tmp/sync_footer_pages.php")
os.remove(local_path)
print("Done!")
