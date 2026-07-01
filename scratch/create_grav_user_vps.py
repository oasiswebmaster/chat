import sys
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file
import os

# Remote Python code to create the Grav user account file directly
remote_code = """
import os
import subprocess

# 1. Generate the bcrypt hash using PHP
php_code = '<?php echo password_hash("oasis2026!", PASSWORD_DEFAULT);'
with open('/tmp/hash_gen.php', 'w') as f:
    f.write(php_code)

result = subprocess.run(['php', '/tmp/hash_gen.php'], capture_output=True, text=True)
password_hash = result.stdout.strip()
os.remove('/tmp/hash_gen.php')

if not password_hash.startswith('$2y$'):
    print("Error generating password hash:", result.stderr)
    exit(1)

# 2. Define the Grav account YAML content
account_yaml = f\"\"\"email: oasis.webmaster@proton.me
fullname: Oasis Webmaster
title: Admin
state: enabled
access:
  admin:
    login: true
    super: true
  site:
    login: true
hashed_password: {password_hash}
\"\"\"

# Ensure the accounts directory exists
os.makedirs('/var/www/oasis-admin/user/accounts', exist_ok=True)

# Write the account file
account_file = '/var/www/oasis-admin/user/accounts/webmaster.yaml'
with open(account_file, 'w', encoding='utf-8') as f:
    f.write(account_yaml)

print(f"Successfully created Grav account file at {account_file}")
"""

# Write it locally
temp_local = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\create_grav_user.py"
with open(temp_local, "w", encoding="utf-8") as f:
    f.write(remote_code)

print("Uploading user creator to VPS...")
upload_file(temp_local, "/tmp/create_grav_user.py")

print("Executing user creator on VPS...")
run_cmd("sudo python3 /tmp/create_grav_user.py")

print("Setting account file permissions...")
run_cmd("sudo chown -R www-data:www-data /var/www/oasis-admin/user/accounts && sudo chmod -R 775 /var/www/oasis-admin/user/accounts")

print("Cleaning up temp files...")
os.remove(temp_local)
run_cmd("rm -f /tmp/create_grav_user.py")
print("Done!")
