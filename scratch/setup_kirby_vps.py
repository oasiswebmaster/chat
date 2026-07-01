import json
import os
import yaml
import sys

# Insert path to vps_tool
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")

from vps_tool import run_cmd, upload_file

# Define paths
LOCAL_BLUEPRINT = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\deploy-mirror\data\site.yml"
LOCAL_CONFIG = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\deploy-mirror\data\config.php"

# Write remote setup script
remote_setup_code = """
import json
import os
import yaml

# 1. Ensure directories exist
os.makedirs('/var/www/oasis-admin/site/blueprints', exist_ok=True)
os.makedirs('/var/www/oasis-admin/site/config', exist_ok=True)
os.makedirs('/var/www/oasis-admin/content', exist_ok=True)

# Move uploaded files to their correct locations
os.system('mv /tmp/site.yml /var/www/oasis-admin/site/blueprints/site.yml')
os.system('mv /tmp/config.php /var/www/oasis-admin/site/config/config.php')

# 2. Read existing site configs to pre-populate Kirby
cards = {}
site_config = {}
alert = {}

if os.path.exists('/var/www/oasis-frontend/data/cards.json'):
    with open('/var/www/oasis-frontend/data/cards.json', 'r') as f:
        cards = json.load(f)

if os.path.exists('/var/www/oasis-frontend/data/site-config.json'):
    with open('/var/www/oasis-frontend/data/site-config.json', 'r') as f:
        site_config = json.load(f)

if os.path.exists('/var/www/oasis-frontend/data/alert.json'):
    with open('/var/www/oasis-frontend/data/alert.json', 'r') as f:
        alert = json.load(f)

# 3. Format into Kirby's text format
def format_field(name, value):
    return f"{name}: {value}\\n----\\n"

content = ""
content += format_field("Title", "Oasis Resort Web Builder")

# Add site config fields
content += format_field("Manager_name", site_config.get("manager_name", ""))
content += format_field("Manager_phone", site_config.get("manager_phone", ""))
content += format_field("Manager_email", site_config.get("manager_email", ""))
content += format_field("Address_line1", site_config.get("address_line1", ""))
content += format_field("Address_line2", site_config.get("address_line2", ""))

# Add alert fields
content += format_field("Alert_active", "true" if alert.get("active", False) else "false")
content += format_field("Alert_severity", alert.get("severity", "warning"))
content += format_field("Alert_headline", alert.get("headline", ""))
content += format_field("Alert_message", alert.get("message", ""))

# Add structure fields (YAML format)
sale_cards = []
for c in cards.get("sale", []):
    sale_cards.append({
        "lot_number": c.get("lot_number", ""),
        "title": c.get("title", ""),
        "price": c.get("price", ""),
        "lot_type": c.get("lot_type", ""),
        "sqft": c.get("sqft", ""),
        "description": c.get("description", ""),
        "image_url": c.get("image_url", ""),
        "href": c.get("href", ""),
        "status": c.get("status", "active")
    })

rental_cards = []
for c in cards.get("rental", []):
    rental_cards.append({
        "lot_number": c.get("lot_number", ""),
        "title": c.get("title", ""),
        "price": c.get("price", ""),
        "lot_type": c.get("lot_type", ""),
        "sqft": c.get("sqft", ""),
        "description": c.get("description", ""),
        "image_url": c.get("image_url", ""),
        "href": c.get("href", ""),
        "status": c.get("status", "active")
    })

# Format YAML with double-space indent for Kirby structure field
def to_kirby_yaml(data):
    if not data:
        return ""
    # We want to dump it as a YAML list
    y = yaml.dump(data, default_flow_style=False, sort_keys=False)
    # Prefix each line with spaces if needed (standard YAML list is fine)
    return "\\n" + y

content += f"Sale_cards: {to_kirby_yaml(sale_cards)}\\n----\\n"
content += f"Rental_cards: {to_kirby_yaml(rental_cards)}\\n"

# Write to content/site.txt
with open('/var/www/oasis-admin/content/site.txt', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully configured Kirby and pre-populated content!")
"""

# Write the local temp script
temp_local_script = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\deploy-mirror\data\setup_kirby.py"
with open(temp_local_script, "w", encoding="utf-8") as f:
    f.write(remote_setup_code)

print("Uploading blueprint and config to VPS...")
upload_file(LOCAL_BLUEPRINT, "/tmp/site.yml")
upload_file(LOCAL_CONFIG, "/tmp/config.php")
upload_file(temp_local_script, "/tmp/setup_kirby.py")

print("Running setup script on VPS...")
run_cmd("sudo python3 /tmp/setup_kirby.py")

print("Setting folder permissions for Kirby...")
run_cmd("sudo chown -R www-data:www-data /var/www/oasis-admin && sudo chmod -R 775 /var/www/oasis-admin")

print("Cleaning up temp files...")
os.remove(temp_local_script)
run_cmd("rm -f /tmp/site.yml /tmp/config.php /tmp/setup_kirby.py")
print("Done!")
