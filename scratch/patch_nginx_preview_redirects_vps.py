import sys
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file
import os

# Remote Python code to add the redirects to the admin.oasisresort.ca server block in Nginx
remote_patch_code = """
import re

nginx_file = '/etc/nginx/sites-enabled/oasisresort'

with open(nginx_file, 'r') as f:
    config = f.read()

# Define the redirect blocks
redirect_blocks = \"\"\"
    # Redirect Grav front-end pages to the actual live website for previews
    location = /buy-or-rent {
        return 302 https://oasisresort.ca;
    }
    location = /on-site-managers {
        return 302 https://oasisresort.ca;
    }
    location = /visit-us {
        return 302 https://oasisresort.ca;
    }
    location = /emergency-alert {
        return 302 https://oasisresort.ca;
    }
    location = /resort-info {
        return 302 https://oasisresort.ca/coming-soon.html?page=resort-info;
    }
    location = /bookings {
        return 302 https://oasisresort.ca/coming-soon.html?page=bookings;
    }
    location = /privacy {
        return 302 https://oasisresort.ca/coming-soon.html?page=privacy;
    }
\"\"\"

# Check if redirects are already added
if 'location = /buy-or-rent' in config:
    print("Redirects already present in Nginx config.")
else:
    # Insert the redirects right after 'server_name admin.oasisresort.ca;'
    pattern = r'(server_name\\s+admin\\.oasisresort\\.ca;)'
    match = re.search(pattern, config)
    if match:
        original = match.group(1)
        replacement = original + "\\n" + redirect_blocks
        config_patched = config.replace(original, replacement)
        
        with open(nginx_file, 'w') as f:
            f.write(config_patched)
        print("Successfully added preview redirects to admin.oasisresort.ca server block.")
    else:
        print("Error: Could not find admin.oasisresort.ca server block in Nginx config.")
"""

# Write it locally
temp_local = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\patch_nginx_preview_redirects.py"
with open(temp_local, "w", encoding="utf-8") as f:
    f.write(remote_patch_code)

print("Uploading Nginx patcher to VPS...")
upload_file(temp_local, "/tmp/patch_nginx_preview_redirects.py")

print("Executing Nginx patch on VPS...")
run_cmd("sudo python3 /tmp/patch_nginx_preview_redirects.py && sudo nginx -t && sudo systemctl reload nginx")

print("Cleaning up temp files...")
os.remove(temp_local)
run_cmd("rm -f /tmp/patch_nginx_preview_redirects.py")
print("Done!")
