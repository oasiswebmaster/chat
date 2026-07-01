import sys
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file
import os

# 1. Define the 3 Blueprints
listings_blueprint = """title: Listings Editor
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
"""

site_content_blueprint = """title: Site Content Editor
form:
  fields:
    tabs:
      type: tabs
      active: 1
      fields:
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
"""

emergency_alert_blueprint = """title: Emergency Alert Editor
form:
  fields:
    tabs:
      type: tabs
      active: 1
      fields:
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

# 2. Define the updated Grav Sync Plugin (oasis-sync.php)
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
        $template = $page->template();

        // 1. Sync Listings
        if ($template === 'listings') {
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
        }

        // 2. Sync Site Content
        if ($template === 'site_content') {
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
        }

        // 3. Sync Emergency Alert
        if ($template === 'emergency_alert') {
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

# Remote python code to run on VPS
remote_reorganize_code = """
import json
import os
import yaml
import shutil

# 1. Clean up old page configuration
if os.path.exists('/var/www/oasis-admin/user/pages/01.web-builder'):
    shutil.rmtree('/var/www/oasis-admin/user/pages/01.web-builder')

# Remove default page blueprints
if os.path.exists('/var/www/oasis-admin/user/blueprints/pages/default.yaml'):
    os.remove('/var/www/oasis-admin/user/blueprints/pages/default.yaml')

# Ensure blueprint directory exists
os.makedirs('/var/www/oasis-admin/user/blueprints/pages', exist_ok=True)

# Move uploaded blueprints
os.system('mv /tmp/listings.yaml /var/www/oasis-admin/user/blueprints/pages/listings.yaml')
os.system('mv /tmp/site_content.yaml /var/www/oasis-admin/user/blueprints/pages/site_content.yaml')
os.system('mv /tmp/emergency_alert.yaml /var/www/oasis-admin/user/blueprints/pages/emergency_alert.yaml')

# Move uploaded plugin code
os.system('mv /tmp/oasis-sync.php /var/www/oasis-admin/user/plugins/oasis-sync/oasis-sync.php')

# 2. Read existing site configs to pre-populate Grav pages
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

# 3. Create the 3 pages
# Page 1: Listings
os.makedirs('/var/www/oasis-admin/user/pages/01.listings', exist_ok=True)
listings_data = {
    "title": "🏡 Realtor Cards",
    "sale_cards": [],
    "rental_cards": []
}
for c in cards.get("sale", []):
    listings_data["sale_cards"].append({
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
    listings_data["rental_cards"].append({
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

with open('/var/www/oasis-admin/user/pages/01.listings/listings.md', 'w', encoding='utf-8') as f:
    f.write(f"---\\n{yaml.dump(listings_data, default_flow_style=False, sort_keys=False, allow_unicode=True)}---\\n")

# Page 2: Site Content
os.makedirs('/var/www/oasis-admin/user/pages/02.site-content', exist_ok=True)
site_content_data = {
    "title": "🏠 Site Content",
    "manager_name": site_config.get("manager_name", ""),
    "manager_phone": site_config.get("manager_phone", ""),
    "manager_email": site_config.get("manager_email", ""),
    "address_line1": site_config.get("address_line1", ""),
    "address_line2": site_config.get("address_line2", "")
}
with open('/var/www/oasis-admin/user/pages/02.site-content/site_content.md', 'w', encoding='utf-8') as f:
    f.write(f"---\\n{yaml.dump(site_content_data, default_flow_style=False, sort_keys=False, allow_unicode=True)}---\\n")

# Page 3: Emergency Alert
os.makedirs('/var/www/oasis-admin/user/pages/03.emergency-alert', exist_ok=True)
emergency_alert_data = {
    "title": "🚨 Emergency Alert",
    "alert_active": 1 if alert.get("active", False) else 0,
    "alert_severity": alert.get("severity", "warning"),
    "alert_headline": alert.get("headline", ""),
    "alert_message": alert.get("message", "")
}
with open('/var/www/oasis-admin/user/pages/03.emergency-alert/emergency_alert.md', 'w', encoding='utf-8') as f:
    f.write(f"---\\n{yaml.dump(emergency_alert_data, default_flow_style=False, sort_keys=False, allow_unicode=True)}---\\n")

print("Successfully reorganized Grav CMS into three separate editor containers!")
"""

# Write files locally in scratch folder
os.makedirs(r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg", exist_ok=True)
local_l_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg\listings.yaml"
local_sc_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg\site_content.yaml"
local_ea_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg\emergency_alert.yaml"
local_plugin = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg\oasis-sync.php"
local_setup = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg\reorganize_grav.py"

with open(local_l_bp, "w", encoding="utf-8") as f: f.write(listings_blueprint)
with open(local_sc_bp, "w", encoding="utf-8") as f: f.write(site_content_blueprint)
with open(local_ea_bp, "w", encoding="utf-8") as f: f.write(emergency_alert_blueprint)
with open(local_plugin, "w", encoding="utf-8") as f: f.write(grav_plugin_php)
with open(local_setup, "w", encoding="utf-8") as f: f.write(remote_reorganize_code)

print("Uploading reorganized config files to VPS...")
upload_file(local_l_bp, "/tmp/listings.yaml")
upload_file(local_sc_bp, "/tmp/site_content.yaml")
upload_file(local_ea_bp, "/tmp/emergency_alert.yaml")
upload_file(local_plugin, "/tmp/oasis-sync.php")
upload_file(local_setup, "/tmp/reorganize_grav.py")

print("Running Grav reorganization script on VPS...")
run_cmd("sudo python3 /tmp/reorganize_grav.py")

print("Setting folder permissions for Grav...")
run_cmd("sudo chown -R www-data:www-data /var/www/oasis-admin && sudo chmod -R 775 /var/www/oasis-admin")

print("Cleaning up local and remote temp files...")
import shutil
shutil.rmtree(r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg")
run_cmd("rm -rf /tmp/listings.yaml /tmp/site_content.yaml /tmp/emergency_alert.yaml /tmp/oasis-sync.php /tmp/reorganize_grav.py")
print("Done!")
