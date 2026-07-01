import sys
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file
import os

# 1. Define the Grav Page Blueprint (default.yaml)
grav_blueprint = """title: Oasis Resort Web Builder

form:
  fields:
    tabs:
      type: tabs
      active: 1
      fields:
        listings_tab:
          type: tab
          title: 📋 Listings
          fields:
            header.sale_cards:
              type: list
              label: 🏡 Sites For Sale
              btn_add: Add New Site
              fields:
                .lot_number:
                  type: text
                  label: Lot Number
                  placeholder: e.g. Lot 301
                .price:
                  type: text
                  label: Price
                  placeholder: e.g. $189,000
                .title:
                  type: text
                  label: Title
                  placeholder: e.g. Lot 301 — Lakefront Premium
                .lot_type:
                  type: text
                  label: Lot Type
                .sqft:
                  type: text
                  label: Size
                .image_url:
                  type: text
                  label: Image URL
                .href:
                  type: text
                  label: Link URL
                .status:
                  type: select
                  label: Status
                  default: active
                  options:
                    active: Active (Visible)
                    hidden: Hidden
                .description:
                  type: textarea
                  label: Description

            header.rental_cards:
              type: list
              label: 🔑 Sites For Rent
              btn_add: Add New Site
              fields:
                .lot_number:
                  type: text
                  label: Site Number
                  placeholder: e.g. Site 305
                .price:
                  type: text
                  label: Price
                  placeholder: e.g. $195/night
                .title:
                  type: text
                  label: Title
                .lot_type:
                  type: text
                  label: Site Type
                .sqft:
                  type: text
                  label: Size
                .image_url:
                  type: text
                  label: Image URL
                .href:
                  type: text
                  label: Link URL
                .status:
                  type: select
                  label: Status
                  default: active
                  options:
                    active: Active (Visible)
                    hidden: Hidden
                .description:
                  type: textarea
                  label: Description

        site_content_tab:
          type: tab
          title: 🏠 Site Content
          fields:
            header.manager_name:
              type: text
              label: On Site Manager Name(s)
              placeholder: e.g. Janet & Tim Pearson
            header.manager_phone:
              type: text
              label: Phone Number
            header.manager_email:
              type: text
              label: Email Address
            header.address_line1:
              type: text
              label: Address Line 1
            header.address_line2:
              type: text
              label: Address Line 2

        emergency_alert_tab:
          type: tab
          title: 🚨 Emergency Alert
          fields:
            header.alert_active:
              type: toggle
              label: Alert Status
              default: 0
              options:
                1: 🔴 Alert is LIVE on the website
                0: ⚪ Alert is OFF
            header.alert_severity:
              type: select
              label: Severity Level
              default: warning
              options:
                warning: ⚠️ Warning (Amber)
                critical: 🔴 Critical (Red)
            header.alert_headline:
              type: text
              label: Alert Headline
            header.alert_message:
              type: textarea
              label: Alert Message
"""

# 2. Define the Grav Sync Plugin (oasis-sync.php)
grav_plugin_php = """<?php
namespace Grav\\Plugin;

use Grav\\Common\\Plugin;
use RocketTheme\\Toolbox\\Event\\Event;

class OasisSyncPlugin extends Plugin
{
    public static function getSubscribedEvents()
    {
        return [
            'onAdminSave' => ['onAdminSave', 0]
        ];
    }

    public function onAdminSave(Event $event)
    {
        $page = $event['object'];
        
        // Only sync if it's our web-builder page
        if ($page->value('title') === 'Oasis Resort Web Builder') {
            
            // 1. Sync Realtor Cards (Sale & Rental)
            $sale = [];
            $id = 1;
            $saleCards = $page->value('header.sale_cards') ?? [];
            foreach ($saleCards as $item) {
                $item['id'] = $id++;
                $imageUrl = $item['image_url'] ?? '';
                $item['image_url'] = $imageUrl;
                $item['images'] = [$imageUrl];
                $sale[] = $item;
            }

            $rental = [];
            $id = 101;
            $rentalCards = $page->value('header.rental_cards') ?? [];
            foreach ($rentalCards as $item) {
                $item['id'] = $id++;
                $imageUrl = $item['image_url'] ?? '';
                $item['image_url'] = $imageUrl;
                $item['images'] = [$imageUrl];
                $rental[] = $item;
            }

            $cardsData = [
                'sale' => $sale,
                'rental' => $rental
            ];

            @file_put_contents(
                '/var/www/oasis-frontend/data/cards.json',
                json_encode($cardsData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            );

            // 2. Sync Site Content (Managers & Address)
            $siteData = [
                'manager_name'  => $page->value('header.manager_name') ?? '',
                'manager_phone' => $page->value('header.manager_phone') ?? '',
                'manager_email' => $page->value('header.manager_email') ?? '',
                'address_line1' => $page->value('header.address_line1') ?? '',
                'address_line2' => $page->value('header.address_line2') ?? ''
            ];

            @file_put_contents(
                '/var/www/oasis-frontend/data/site-config.json',
                json_encode($siteData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            );

            // 3. Sync Emergency Alert
            $alertData = [
                'active'   => (bool)($page->value('header.alert_active') ?? false),
                'severity' => $page->value('header.alert_severity') ?? 'warning',
                'headline' => $page->value('header.alert_headline') ?? '',
                'message'  => $page->value('header.alert_message') ?? ''
            ];

            @file_put_contents(
                '/var/www/oasis-frontend/data/alert.json',
                json_encode($alertData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            );
        }
    }
}
"""

grav_plugin_yaml = """enabled: true
"""

# Remote setup python code to run on VPS
remote_setup_code = """
import json
import os
import yaml

# 1. Ensure directories exist
os.makedirs('/var/www/oasis-admin/user/blueprints/pages', exist_ok=True)
os.makedirs('/var/www/oasis-admin/user/plugins/oasis-sync', exist_ok=True)
os.makedirs('/var/www/oasis-admin/user/pages/01.web-builder', exist_ok=True)

# Remove default pages so the admin panel is clean
if os.path.exists('/var/www/oasis-admin/user/pages/01.home'):
    import shutil
    shutil.rmtree('/var/www/oasis-admin/user/pages/01.home')

# Move uploaded files to their correct locations
os.system('mv /tmp/default.yaml /var/www/oasis-admin/user/blueprints/pages/default.yaml')
os.system('mv /tmp/oasis-sync.php /var/www/oasis-admin/user/plugins/oasis-sync/oasis-sync.php')
os.system('mv /tmp/oasis-sync.yaml /var/www/oasis-admin/user/plugins/oasis-sync/oasis-sync.yaml')

# 2. Read existing site configs to pre-populate Grav
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

# 3. Format into Grav page frontmatter (YAML)
page_data = {
    "title": "Oasis Resort Web Builder",
    "manager_name": site_config.get("manager_name", ""),
    "manager_phone": site_config.get("manager_phone", ""),
    "manager_email": site_config.get("manager_email", ""),
    "address_line1": site_config.get("address_line1", ""),
    "address_line2": site_config.get("address_line2", ""),
    "alert_active": 1 if alert.get("active", False) else 0,
    "alert_severity": alert.get("severity", "warning"),
    "alert_headline": alert.get("headline", ""),
    "alert_message": alert.get("message", ""),
    "sale_cards": [],
    "rental_cards": []
}

for c in cards.get("sale", []):
    page_data["sale_cards"].append({
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

for c in cards.get("rental", []):
    page_data["rental_cards"].append({
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

# Write the default.md file with the YAML frontmatter
yaml_content = yaml.dump(page_data, default_flow_style=False, sort_keys=False, allow_unicode=True)
md_content = f\"\"\"---
{yaml_content}---
\"\"\"

with open('/var/www/oasis-admin/user/pages/01.web-builder/default.md', 'w', encoding='utf-8') as f:
    f.write(md_content)

print("Successfully configured Grav pages and pre-populated content!")
"""

# Write files locally
os.makedirs(r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_temp", exist_ok=True)
local_blueprint = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_temp\default.yaml"
local_plugin_php = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_temp\oasis-sync.php"
local_plugin_yaml = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_temp\oasis-sync.yaml"
local_setup_py = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_temp\setup_grav.py"

with open(local_blueprint, "w", encoding="utf-8") as f: f.write(grav_blueprint)
with open(local_plugin_php, "w", encoding="utf-8") as f: f.write(grav_plugin_php)
with open(local_plugin_yaml, "w", encoding="utf-8") as f: f.write(grav_plugin_yaml)
with open(local_setup_py, "w", encoding="utf-8") as f: f.write(remote_setup_code)

print("Uploading Grav config and plugin files to VPS...")
upload_file(local_blueprint, "/tmp/default.yaml")
upload_file(local_plugin_php, "/tmp/oasis-sync.php")
upload_file(local_plugin_yaml, "/tmp/oasis-sync.yaml")
upload_file(local_setup_py, "/tmp/setup_grav.py")

print("Running Grav configuration script on VPS...")
run_cmd("sudo python3 /tmp/setup_grav.py")

# 5. Patch Nginx to add redirect from / to /admin and block dotfiles
remote_nginx_patch_code = """
import re

with open('/etc/nginx/sites-enabled/oasisresort', 'r') as f:
    config = f.read()

# We want to add a redirect inside the admin.oasisresort.ca server block:
# 'location = / { return 302 /admin; }'
# Let's find where the admin.oasisresort.ca block defines root and append the redirect.
if 'location = / {' not in config:
    # Find the server block for admin.oasisresort.ca
    pattern = r'(server_name\\s+admin\\.oasisresort\\.ca;.*?root\\s+/var/www/oasis-admin;)'
    match = re.search(pattern, config, re.DOTALL)
    if match:
        original = match.group(1)
        replacement = original + "\\n\\n    # Redirect root to /admin\\n    location = / {\\n        return 302 /admin;\\n    }"
        config = config.replace(original, replacement)
        print("Nginx config updated with root-to-admin redirect.")

with open('/etc/nginx/sites-enabled/oasisresort', 'w') as f:
    f.write(config)
"""

temp_nginx_patch = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_temp\patch_nginx_grav.py"
with open(temp_nginx_patch, "w", encoding="utf-8") as f: f.write(remote_nginx_patch_code)

print("Uploading Nginx patcher to VPS...")
upload_file(temp_nginx_patch, "/tmp/patch_nginx_grav.py")

print("Executing Nginx patch on VPS...")
run_cmd("sudo python3 /tmp/patch_nginx_grav.py && sudo nginx -t && sudo systemctl reload nginx")

print("Setting final permissions...")
run_cmd("sudo chown -R www-data:www-data /var/www/oasis-admin && sudo chmod -R 775 /var/www/oasis-admin")

print("Cleaning up temp files...")
import shutil
shutil.rmtree(r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_temp")
run_cmd("rm -rf /tmp/default.yaml /tmp/oasis-sync.php /tmp/oasis-sync.yaml /tmp/setup_grav.py /tmp/patch_nginx_grav.py")
print("Done configuring Grav!")
