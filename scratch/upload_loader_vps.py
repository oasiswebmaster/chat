import sys, os
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file

local_file = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\deploy-mirror\js\site-config-loader.js"
remote_temp = "/tmp/site-config-loader.js"
remote_dest = "/var/www/oasis-frontend/js/site-config-loader.js"

print("Uploading to VPS...")
upload_file(local_file, remote_temp)
print("Moving to final destination...")
run_cmd(f"sudo mv {remote_temp} {remote_dest}")
run_cmd(f"sudo chown www-data:www-data {remote_dest}")
run_cmd(f"sudo chmod 644 {remote_dest}")
print("Done!")
