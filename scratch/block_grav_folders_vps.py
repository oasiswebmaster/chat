import sys
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file
import os

# Remote Python code to patch Nginx with directory-level blocks for Grav
remote_patch_code = """
import re

nginx_file = '/etc/nginx/sites-enabled/oasisresort'

with open(nginx_file, 'r') as f:
    config = f.read()

# We want to block access to user/config/, user/accounts/, user/data/, and user/pages/ entirely.
# This prevents direct directory and file access while leaving user/plugins/ and user/themes/ accessible.
directory_block = \"\"\"    # 3. Deny access to sensitive user directories and files
    location ~* /user/(config|accounts|data|pages)/ {
        deny all;
    }
    location ~* /user/.*\\\\.(txt|md|yaml|yml|php|pl|py|cgi|twig|sh|bat)$ {
        return 403;
    }\"\"\"

# Replace the old extension-only user block
old_user_block_pattern = r'# 3\\. Deny access to sensitive user files.*?location ~\\* /user/.*?\\{.*?return 403;.*?\\}'
config_patched, count = re.subn(old_user_block_pattern, directory_block.strip(), config, flags=re.DOTALL)

if count > 0:
    print("Successfully updated Nginx config with directory-level blocks.")
else:
    print("Could not match the old user block. Searching for general insertion point.")
    # Fallback search and replace
    config_patched = config.replace(
        "location ~* /user/.*\\\\.(txt|md|yaml|yml|php|pl|py|cgi|twig|sh|bat)$ {\\n        return 403;\\n    }",
        "location ~* /user/(config|accounts|data|pages)/ {\\n        deny all;\\n    }\\n    location ~* /user/.*\\\\.(txt|md|yaml|yml|php|pl|py|cgi|twig|sh|bat)$ {\\n        return 403;\\n    }"
    )

with open(nginx_file, 'w') as f:
    f.write(config_patched)

print("Nginx configuration updated.")
"""

# Write it locally
temp_local = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\block_grav_folders.py"
with open(temp_local, "w", encoding="utf-8") as f:
    f.write(remote_patch_code)

print("Uploading Nginx patcher to VPS...")
upload_file(temp_local, "/tmp/block_grav_folders.py")

print("Executing Nginx patch and clearing Grav cache on VPS...")
run_cmd("sudo python3 /tmp/block_grav_folders.py && sudo nginx -t && sudo systemctl reload nginx")
run_cmd("cd /var/www/oasis-admin && sudo -u www-data php bin/grav clearcache")

print("Cleaning up temp files...")
os.remove(temp_local)
run_cmd("rm -f /tmp/block_grav_folders.py")
print("Done!")
