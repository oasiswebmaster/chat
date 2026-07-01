import sys
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file
import os

# Remote script to download and install Grav + Admin on the VPS
remote_install_code = """
import os
import shutil

# 1. Clean up old Kirby installation
print("Removing old Kirby installation...")
if os.path.exists('/var/www/oasis-admin'):
    shutil.rmtree('/var/www/oasis-admin')

# 2. Download Grav + Admin zip
print("Downloading Grav + Admin package...")
os.system('wget https://getgrav.org/download/core/grav-admin/latest -O /tmp/grav-admin.zip')

# 3. Extract Grav
print("Extracting Grav...")
if os.path.exists('/tmp/grav-extracted'):
    shutil.rmtree('/tmp/grav-extracted')
os.makedirs('/tmp/grav-extracted', exist_ok=True)
os.system('unzip -q /tmp/grav-admin.zip -d /tmp/grav-extracted')

# 4. Move to /var/www/oasis-admin
print("Moving Grav to /var/www/oasis-admin...")
shutil.move('/tmp/grav-extracted/grav-admin', '/var/www/oasis-admin')

# 5. Clean up temp files
print("Cleaning up temp files...")
os.remove('/tmp/grav-admin.zip')
shutil.rmtree('/tmp/grav-extracted')

print("Grav core installed successfully!")
"""

# Write local script
temp_local = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\install_grav.py"
with open(temp_local, "w", encoding="utf-8") as f:
    f.write(remote_install_code)

print("Uploading Grav installer to VPS...")
upload_file(temp_local, "/tmp/install_grav.py")

print("Running Grav installer on VPS...")
run_cmd("sudo python3 /tmp/install_grav.py")

print("Setting folder permissions for Grav...")
run_cmd("sudo chown -R www-data:www-data /var/www/oasis-admin && sudo chmod -R 775 /var/www/oasis-admin")

print("Cleaning up local and remote temp files...")
os.remove(temp_local)
run_cmd("rm -f /tmp/install_grav.py")
print("Done!")
