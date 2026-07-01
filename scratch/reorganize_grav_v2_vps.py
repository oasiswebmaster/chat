import sys
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file
import os

# 1. Define the Blueprints (NO EMOJIS, Professional Labels)
listings_blueprint = """title: Buy or Rent
form:
  fields:
    tabs:
      type: tabs
      active: 1
      fields:
        listings_tab:
          type: tab
          title: Listings
          fields:
            header.sale_cards:
              type: list
              label: Sites For Sale
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
              label: Sites For Rent
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

managers_blueprint = """title: On Site Managers
form:
  fields:
    tabs:
      type: tabs
      active: 1
      fields:
        site_content_tab:
          type: tab
          title: On Site Managers
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
"""

visit_us_blueprint = """title: Visit Us
form:
  fields:
    tabs:
      type: tabs
      active: 1
      fields:
        address_tab:
          type: tab
          title: Visit Us
          fields:
            header.address_line1:
              type: text
              label: Address Line 1
              placeholder: e.g. 2615 Lakeshore Dr
            header.address_line2:
              type: text
              label: Address Line 2
              placeholder: e.g. Osoyoos, BC V0H 1V6
"""

emergency_alert_blueprint = """title: Emergency Alert
form:
  fields:
    tabs:
      type: tabs
      active: 1
      fields:
        emergency_alert_tab:
          type: tab
          title: Emergency Alert
          fields:
            header.alert_active:
              type: toggle
              label: Alert Status
              default: 0
              options:
                1: Alert is LIVE on the website
                0: Alert is OFF
            header.alert_severity:
              type: select
              label: Severity Level
              default: warning
              options:
                warning: Warning (Amber)
                critical: Critical (Red)
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

        // 2. Sync On Site Managers
        if ($template === 'managers') {
            $file = '/var/www/oasis-frontend/data/site-config.json';
            $data = [];
            if (file_exists($file)) {
                $data = json_decode(file_get_contents($file), true) ?? [];
            }
            $data['manager_name'] = $page->value('header.manager_name') ?? '';
            $data['manager_phone'] = $page->value('header.manager_phone') ?? '';
            $data['manager_email'] = $page->value('header.manager_email') ?? '';
            
            @file_put_contents(
                $file,
                json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            );
        }

        // 3. Sync Visit Us (Address)
        if ($template === 'visit_us') {
            $file = '/var/www/oasis-frontend/data/site-config.json';
            $data = [];
            if (file_exists($file)) {
                $data = json_decode(file_get_contents($file), true) ?? [];
            }
            $data['address_line1'] = $page->value('header.address_line1') ?? '';
            $data['address_line2'] = $page->value('header.address_line2') ?? '';
            
            @file_put_contents(
                $file,
                json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            );
        }

        // 4. Sync Emergency Alert
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

        // 5. Sync Footer Text Pages (Resort Info, Bookings, Privacy)
        if ($template === 'default') {
            $slug = $page->slug();
            if (in_array($slug, ['resort-info', 'bookings', 'privacy'])) {
                $file = "/var/www/oasis-frontend/data/page-{$slug}.json";
                $pageData = [
                    'title' => $page->title(),
                    'content' => $page->content() // Compiles markdown to HTML
                ];
                @file_put_contents(
                    $file,
                    json_encode($pageData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
                );
            }
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

# 1. Clean up old page folders
if os.path.exists('/var/www/oasis-admin/user/pages'):
    shutil.rmtree('/var/www/oasis-admin/user/pages')
os.makedirs('/var/www/oasis-admin/user/pages', exist_ok=True)

# Clean up old blueprints
if os.path.exists('/var/www/oasis-admin/user/blueprints/pages'):
    shutil.rmtree('/var/www/oasis-admin/user/blueprints/pages')
os.makedirs('/var/www/oasis-admin/user/blueprints/pages', exist_ok=True)

# Move uploaded blueprints
os.system('mv /tmp/listings.yaml /var/www/oasis-admin/user/blueprints/pages/listings.yaml')
os.system('mv /tmp/managers.yaml /var/www/oasis-admin/user/blueprints/pages/managers.yaml')
os.system('mv /tmp/visit_us.yaml /var/www/oasis-admin/user/blueprints/pages/visit_us.yaml')
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

# 3. Create the pages matching front-page containers exactly (NO EMOJIS)
# Page 1: Buy or Rent
os.makedirs('/var/www/oasis-admin/user/pages/01.buy-or-rent', exist_ok=True)
listings_data = {
    "title": "Buy or Rent",
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
with open('/var/www/oasis-admin/user/pages/01.buy-or-rent/listings.md', 'w', encoding='utf-8') as f:
    f.write(f"---\\n{yaml.dump(listings_data, default_flow_style=False, sort_keys=False, allow_unicode=True)}---\\n")

# Page 2: On Site Managers
os.makedirs('/var/www/oasis-admin/user/pages/02.on-site-managers', exist_ok=True)
managers_data = {
    "title": "On Site Managers",
    "manager_name": site_config.get("manager_name", ""),
    "manager_phone": site_config.get("manager_phone", ""),
    "manager_email": site_config.get("manager_email", "")
}
with open('/var/www/oasis-admin/user/pages/02.on-site-managers/managers.md', 'w', encoding='utf-8') as f:
    f.write(f"---\\n{yaml.dump(managers_data, default_flow_style=False, sort_keys=False, allow_unicode=True)}---\\n")

# Page 3: Visit Us
os.makedirs('/var/www/oasis-admin/user/pages/03.visit-us', exist_ok=True)
visit_us_data = {
    "title": "Visit Us",
    "address_line1": site_config.get("address_line1", ""),
    "address_line2": site_config.get("address_line2", "")
}
with open('/var/www/oasis-admin/user/pages/03.visit-us/visit_us.md', 'w', encoding='utf-8') as f:
    f.write(f"---\\n{yaml.dump(visit_us_data, default_flow_style=False, sort_keys=False, allow_unicode=True)}---\\n")

# Page 4: Emergency Alert
os.makedirs('/var/www/oasis-admin/user/pages/04.emergency-alert', exist_ok=True)
emergency_alert_data = {
    "title": "Emergency Alert",
    "alert_active": 1 if alert.get("active", False) else 0,
    "alert_severity": alert.get("severity", "warning"),
    "alert_headline": alert.get("headline", ""),
    "alert_message": alert.get("message", "")
}
with open('/var/www/oasis-admin/user/pages/04.emergency-alert/emergency_alert.md', 'w', encoding='utf-8') as f:
    f.write(f"---\\n{yaml.dump(emergency_alert_data, default_flow_style=False, sort_keys=False, allow_unicode=True)}---\\n")

# Page 5: Resort Info (Footer Page)
os.makedirs('/var/www/oasis-admin/user/pages/05.resort-info', exist_ok=True)
resort_info_data = {
    "title": "Resort Information"
}
with open('/var/www/oasis-admin/user/pages/05.resort-info/default.md', 'w', encoding='utf-8') as f:
    f.write(f"---\\n{yaml.dump(resort_info_data, default_flow_style=False, sort_keys=False, allow_unicode=True)}---\\n\\n# Resort Information\\n\\nEnter resort information here...")

# Page 6: Bookings (Footer Page)
os.makedirs('/var/www/oasis-admin/user/pages/06.bookings', exist_ok=True)
bookings_data = {
    "title": "Bookings"
}
with open('/var/www/oasis-admin/user/pages/06.bookings/default.md', 'w', encoding='utf-8') as f:
    f.write(f"---\\n{yaml.dump(bookings_data, default_flow_style=False, sort_keys=False, allow_unicode=True)}---\\n\\n# Bookings\\n\\nEnter booking details here...")

# Page 7: Privacy (Footer Page)
os.makedirs('/var/www/oasis-admin/user/pages/07.privacy', exist_ok=True)
privacy_data = {
    "title": "Privacy Policy"
}
with open('/var/www/oasis-admin/user/pages/07.privacy/default.md', 'w', encoding='utf-8') as f:
    f.write(f"---\\n{yaml.dump(privacy_data, default_flow_style=False, sort_keys=False, allow_unicode=True)}---\\n\\n# Privacy Policy\\n\\nEnter privacy policy details here...")

print("Successfully reorganized Grav CMS with footer pages and front-page containers!")
"""

# Write files locally
os.makedirs(r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg_v2", exist_ok=True)
local_l_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg_v2\listings.yaml"
local_m_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg_v2\managers.yaml"
local_vu_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg_v2\visit_us.yaml"
local_ea_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg_v2\emergency_alert.yaml"
local_plugin = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg_v2\oasis-sync.php"
local_setup = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg_v2\reorganize_grav_v2.py"

with open(local_l_bp, "w", encoding="utf-8") as f: f.write(listings_blueprint)
with open(local_m_bp, "w", encoding="utf-8") as f: f.write(managers_blueprint)
with open(local_vu_bp, "w", encoding="utf-8") as f: f.write(visit_us_blueprint)
with open(local_ea_bp, "w", encoding="utf-8") as f: f.write(emergency_alert_blueprint)
with open(local_plugin, "w", encoding="utf-8") as f: f.write(grav_plugin_php)
with open(local_setup, "w", encoding="utf-8") as f: f.write(remote_reorganize_code)

print("Uploading reorganized config files to VPS...")
upload_file(local_l_bp, "/tmp/listings.yaml")
upload_file(local_m_bp, "/tmp/managers.yaml")
upload_file(local_vu_bp, "/tmp/visit_us.yaml")
upload_file(local_ea_bp, "/tmp/emergency_alert.yaml")
upload_file(local_plugin, "/tmp/oasis-sync.php")
upload_file(local_setup, "/tmp/reorganize_grav_v2.py")

print("Running Grav reorganization script on VPS...")
run_cmd("sudo python3 /tmp/reorganize_grav_v2.py")

print("Setting folder permissions for Grav...")
run_cmd("sudo chown -R www-data:www-data /var/www/oasis-admin && sudo chmod -R 775 /var/www/oasis-admin")

print("Cleaning up local and remote temp files...")
import shutil
shutil.rmtree(r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_reorg_v2")
run_cmd("rm -rf /tmp/listings.yaml /tmp/managers.yaml /tmp/visit_us.yaml /tmp/emergency_alert.yaml /tmp/oasis-sync.php /tmp/reorganize_grav_v2.py")
print("Done!")
