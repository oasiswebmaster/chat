import secrets
import os
import sys

sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file

# 1. Generate secure random keys
salt_key = secrets.token_hex(32)
cookie_key = secrets.token_hex(32)

print(f"Generated secure content salt: {salt_key[:8]}...")
print(f"Generated secure cookie key: {cookie_key[:8]}...")

# 2. Define the new config.php content with placeholders
config_php_template = """<?php
/**
 * Kirby Configuration
 * Handles automatic export of panel content to the front-facing website's JSON files.
 */

return [
    'debug' => false,
    
    // Security Keys
    'content' => [
        'salt' => '{{SALT_KEY}}'
    ],
    'cookie.key' => '{{COOKIE_KEY}}',
    
    // Enable the Panel
    'panel' => [
        'install' => false // Disable installer now that account is created
    ],

    // Hooks to sync data to the main website
    'hooks' => [
        'page.update:after' => function ($newPage, $oldPage) {
            if ($newPage->isSite()) {
                
                // 1. Sync Realtor Cards (Sale & Rental)
                $sale = [];
                $id = 1;
                foreach ($newPage->sale_cards()->yaml() as $item) {
                    $item['id'] = $id++;
                    $imageUrl = $item['image_url'] ?? '';
                    $item['image_url'] = $imageUrl;
                    $item['images'] = [$imageUrl];
                    $sale[] = $item;
                }

                $rental = [];
                $id = 101;
                foreach ($newPage->rental_cards()->yaml() as $item) {
                    $item['id'] = $id++;
                    $imageUrl = $item['image_url'] ?? '';
                    $item['image_url'] = $imageUrl;
                    $item['images'] = [$imageUrl];
                    $rental[] = $item;
                }

                $cardsData = [
                    'sale' => $sale,
                    'rental' => $rental
                ];

                @file_put_contents(
                    '/var/www/oasis-frontend/data/cards.json',
                    json_encode($cardsData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
                );

                // 2. Sync Site Content (Managers & Address)
                $siteData = [
                    'manager_name'  => $newPage->manager_name()->value(),
                    'manager_phone' => $newPage->manager_phone()->value(),
                    'manager_email' => $newPage->manager_email()->value(),
                    'address_line1' => $newPage->address_line1()->value(),
                    'address_line2' => $newPage->address_line2()->value()
                ];

                @file_put_contents(
                    '/var/www/oasis-frontend/data/site-config.json',
                    json_encode($siteData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
                );

                // 3. Sync Emergency Alert
                $alertData = [
                    'active'   => $newPage->alert_active()->toBool(),
                    'severity' => $newPage->alert_severity()->value(),
                    'headline' => $newPage->alert_headline()->value(),
                    'message'  => $newPage->alert_message()->value()
                ];

                @file_put_contents(
                    '/var/www/oasis-frontend/data/alert.json',
                    json_encode($alertData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
                );
            }
        }
    ]
];
"""

updated_config_php = config_php_template.replace("{{SALT_KEY}}", salt_key).replace("{{COOKIE_KEY}}", cookie_key)

# Write locally
local_config_path = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\deploy-mirror\data\config.php"
with open(local_config_path, "w", encoding="utf-8") as f:
    f.write(updated_config_php)

print("Uploading updated config.php to VPS...")
upload_file(local_config_path, "/tmp/config.php")
run_cmd("sudo mv /tmp/config.php /var/www/oasis-admin/site/config/config.php")
run_cmd("sudo chown www-data:www-data /var/www/oasis-admin/site/config/config.php")

# 3. Patch Nginx to block .git and all dotfiles
remote_nginx_patch_code = """
import re

with open('/etc/nginx/sites-enabled/oasisresort', 'r') as f:
    config = f.read()

# Replace the location ~ /\\\\.ht block with a block that denies all dotfiles (starts with a dot)
config_patched = re.sub(
    r'location\\s+~\\s+/\\\\\\\\\\.ht\\s*\\{\\s*deny\\s+all;\\s*\\}',
    'location ~ /\\\\. { deny all; }',
    config
)

with open('/etc/nginx/sites-enabled/oasisresort', 'w') as f:
    f.write(config_patched)

print("Nginx config updated to block dotfiles (.git, .htaccess, etc.)")
"""

temp_nginx_patch = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\patch_nginx_dotfiles.py"
with open(temp_nginx_patch, "w", encoding="utf-8") as f:
    f.write(remote_nginx_patch_code)

print("Uploading Nginx dotfile patcher to VPS...")
upload_file(temp_nginx_patch, "/tmp/patch_nginx_dotfiles.py")

print("Executing Nginx dotfile patch on VPS...")
run_cmd("sudo python3 /tmp/patch_nginx_dotfiles.py && sudo nginx -t && sudo systemctl reload nginx")

print("Cleaning up temp files...")
os.remove(temp_nginx_patch)
run_cmd("rm -f /tmp/patch_nginx_dotfiles.py")
print("Done securing Kirby!")
