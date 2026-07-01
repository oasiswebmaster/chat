import sys, os
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd

print("Creating backups directory...")
run_cmd("sudo mkdir -p /var/www/backups")

print("Backing up frontend website...")
run_cmd("sudo tar -czf /var/www/backups/oasis-frontend-checkpoint.tar.gz -C /var/www oasis-frontend")

print("Backing up Grav admin portal...")
run_cmd("sudo tar -czf /var/www/backups/oasis-admin-user-checkpoint.tar.gz -C /var/www/oasis-admin user")

print("Verifying backups exist...")
res = run_cmd("ls -la /var/www/backups/")
print(res)

print("Done! Checkpoint created successfully.")
