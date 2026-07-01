import sys
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file
import os

# Define the PHP code to create the user
php_code = """<?php
require '/var/www/oasis-admin/kirby/bootstrap.php';

// Instantiate Kirby with the correct root directory
$kirby = new Kirby([
    'roots' => [
        'index'   => '/var/www/oasis-admin',
        'content' => '/var/www/oasis-admin/content',
        'site'    => '/var/www/oasis-admin/site',
        'kirby'   => '/var/www/oasis-admin/kirby',
    ]
]);

// Impersonate superuser to allow user creation without session
$kirby->impersonate('kirby');

try {
    $user = $kirby->users()->create([
        'email'    => 'oasis.webmaster@proton.me',
        'password' => 'OasisResort2026!',
        'role'     => 'admin',
        'name'     => 'Oasis Webmaster',
        'language' => 'en'
    ]);
    echo "SUCCESS: User oasis.webmaster@proton.me created successfully!\\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\\n";
}
"""

# Write it locally
temp_local = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\create_user.php"
with open(temp_local, "w", encoding="utf-8") as f:
    f.write(php_code)

print("Uploading user creation script to VPS...")
upload_file(temp_local, "/tmp/create_user.php")

print("Executing user creation script as www-data user...")
# Running as www-data ensures the generated account file has the correct ownership
run_cmd("sudo -u www-data php /tmp/create_user.php")

print("Cleaning up local and remote temp files...")
os.remove(temp_local)
run_cmd("rm -f /tmp/create_user.php")
print("Done!")
