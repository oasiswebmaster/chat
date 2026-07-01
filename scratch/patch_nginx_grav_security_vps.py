import sys
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file
import os

# Remote Python code to patch Nginx with Grav-specific security rules
remote_patch_code = """
import re

nginx_file = '/etc/nginx/sites-enabled/oasisresort'

with open(nginx_file, 'r') as f:
    config = f.read()

# Define the Grav security blocks
grav_security_blocks = \"\"\"
    # --- Grav Security Rules ---
    # 1. Deny access to sensitive internal folders
    location ~* /(\\\\.git|cache|bin|logs|backup|tests)/.*$ {
        return 403;
    }

    # 2. Deny access to sensitive system and vendor files
    location ~* /(system|vendor)/.*\\\\.(txt|xml|md|html|yaml|yml|php|pl|py|cgi|twig|sh|bat)$ {
        return 403;
    }

    # 3. Deny access to sensitive user files
    location ~* /user/.*\\\\.(txt|md|yaml|yml|php|pl|py|cgi|twig|sh|bat)$ {
        return 403;
    }

    # 4. Deny access to specific sensitive files in the root
    location ~ /(LICENSE\\\\.txt|composer\\\\.lock|composer\\\\.json|nginx\\\\.conf|web\\\\.config|htaccess\\\\.txt|\\\\.htaccess) {
        return 403;
    }
\"\"\"

# Replace the old Kirby security block if it exists
old_kirby_block_pattern = r'# Block access to Kirby\\'s sensitive directories.*?location ~ \^\/\(content\|site\|kirby\|media\/accounts\).*?\{.*?deny all;.*?\}'
config_patched, count = re.subn(old_kirby_block_pattern, grav_security_blocks.strip(), config, flags=re.DOTALL)

if count > 0:
    print("Successfully replaced Kirby security rules with Grav security rules in Nginx config.")
else:
    # If the Kirby block wasn't matched exactly, let's append it next to the deny all block
    # or inside the server block for admin.oasisresort.ca
    pattern = r'(server_name\\s+admin\\.oasisresort\\.ca;.*?location\\s+~\\s+/\\\\\\. {\\s*deny\\s+all;\\s*\\})'
    match = re.search(pattern, config, re.DOTALL)
    if match:
        original = match.group(1)
        replacement = original + "\\n" + grav_security_blocks
        config_patched = config.replace(original, replacement)
        print("Appended Grav security rules to admin.oasisresort.ca server block.")
    else:
        print("Could not find insertion point. Appending to the end of Nginx config.")
        config_patched = config + "\\n# Grav Fallback Security\\n" + grav_security_blocks

with open(nginx_file, 'w') as f:
    f.write(config_patched)

print("Nginx configuration updated.")
"""

# Write it locally
temp_local = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\patch_nginx_grav_security.py"
with open(temp_local, "w", encoding="utf-8") as f:
    f.write(remote_patch_code)

print("Uploading Nginx patcher to VPS...")
upload_file(temp_local, "/tmp/patch_nginx_grav_security.py")

print("Executing Nginx patch on VPS...")
run_cmd("sudo python3 /tmp/patch_nginx_grav_security.py && sudo nginx -t && sudo systemctl reload nginx")

print("Cleaning up temp files...")
os.remove(temp_local)
run_cmd("rm -f /tmp/patch_nginx_grav_security.py")
print("Done!")
