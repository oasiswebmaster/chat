import sys
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file
import os

# Define the Nginx server block for the admin subdomain
nginx_block = """

# 3. Kirby CMS Admin Panel (Subdomain)
server {
    server_name admin.oasisresort.ca;

    root /var/www/oasis-admin;
    index index.php index.html;

    client_max_body_size 20M;

    location / {
        try_files $uri $uri/ /index.php$is_args$args;
    }

    # Pass PHP scripts to PHP-FPM
    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Block access to Kirby's sensitive directories
    location ~ ^/(content|site|kirby|media/accounts) {
        deny all;
    }

    location ~ /\\\\.ht {
        deny all;
    }

    listen 80;
    listen [::]:80;
}
"""

# Remote script to append the server block if not already present
remote_code = f"""
with open('/etc/nginx/sites-enabled/oasisresort', 'r') as f:
    content = f.read()

if 'admin.oasisresort.ca' in content:
    print("Nginx server block for admin.oasisresort.ca already exists.")
else:
    # Append the server block
    with open('/etc/nginx/sites-enabled/oasisresort', 'a') as f:
        f.write(\"\"\"{nginx_block}\"\"\")
    print("Successfully appended admin.oasisresort.ca server block to Nginx config.")
"""

# Write it locally
temp_local = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\append_nginx.py"
with open(temp_local, "w", encoding="utf-8") as f:
    f.write(remote_code)

print("Uploading Nginx patcher script to VPS...")
upload_file(temp_local, "/tmp/append_nginx.py")

print("Executing Nginx patch on VPS...")
run_cmd("sudo python3 /tmp/append_nginx.py && sudo nginx -t && sudo systemctl reload nginx")

print("Cleaning up local and remote temp files...")
os.remove(temp_local)
run_cmd("rm -f /tmp/append_nginx.py")
print("Done!")
