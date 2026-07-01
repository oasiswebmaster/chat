import sys
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file
import os

# Updated blueprints with direct preview links at the top (no emojis, very clean)
listings_blueprint = """title: Buy or Rent
form:
  fields:
    preview_link:
      type: display
      markdown: true
      content: "🔗 **[Preview Live Page on Website](https://oasisresort.ca)**"
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
    preview_link:
      type: display
      markdown: true
      content: "🔗 **[Preview Live Page on Website](https://oasisresort.ca)**"
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
    preview_link:
      type: display
      markdown: true
      content: "🔗 **[Preview Live Page on Website](https://oasisresort.ca)**"
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
    preview_link:
      type: display
      markdown: true
      content: "🔗 **[Preview Live Page on Website](https://oasisresort.ca)**"
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

# Default blueprint for footer text pages (extends default page with a preview link)
default_blueprint = """title: Default
extends@:
  type: default
  context: blueprints/pages

form:
  fields:
    preview_link:
      type: display
      markdown: true
      content: "🔗 **[Preview Live Page on Website](https://oasisresort.ca/coming-soon.html?page=resort-info)** (If editing Resort Info)<br>🔗 **[Preview Live Page on Website](https://oasisresort.ca/coming-soon.html?page=bookings)** (If editing Bookings)<br>🔗 **[Preview Live Page on Website](https://oasisresort.ca/coming-soon.html?page=privacy)** (If editing Privacy Policy)"
      placement: top
"""

# Remote python code to write these blueprints
remote_code = """
import os

os.makedirs('/var/www/oasis-admin/user/blueprints/pages', exist_ok=True)

os.system('mv /tmp/listings.yaml /var/www/oasis-admin/user/blueprints/pages/listings.yaml')
os.system('mv /tmp/managers.yaml /var/www/oasis-admin/user/blueprints/pages/managers.yaml')
os.system('mv /tmp/visit_us.yaml /var/www/oasis-admin/user/blueprints/pages/visit_us.yaml')
os.system('mv /tmp/emergency_alert.yaml /var/www/oasis-admin/user/blueprints/pages/emergency_alert.yaml')
os.system('mv /tmp/default.yaml /var/www/oasis-admin/user/blueprints/pages/default.yaml')

print("Successfully added preview links to Grav blueprints!")
"""

# Write files locally with UTF-8 encoding
os.makedirs(r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_previews", exist_ok=True)
l_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_previews\listings.yaml"
m_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_previews\managers.yaml"
vu_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_previews\visit_us.yaml"
ea_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_previews\emergency_alert.yaml"
d_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_previews\default.yaml"
setup_py = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_previews\setup.py"

with open(l_bp, "w", encoding="utf-8") as f: f.write(listings_blueprint)
with open(m_bp, "w", encoding="utf-8") as f: f.write(managers_blueprint)
with open(vu_bp, "w", encoding="utf-8") as f: f.write(visit_us_blueprint)
with open(ea_bp, "w", encoding="utf-8") as f: f.write(emergency_alert_blueprint)
with open(d_bp, "w", encoding="utf-8") as f: f.write(default_blueprint)
with open(setup_py, "w", encoding="utf-8") as f: f.write(remote_code)

print("Uploading updated blueprints...")
upload_file(l_bp, "/tmp/listings.yaml")
upload_file(m_bp, "/tmp/managers.yaml")
upload_file(vu_bp, "/tmp/visit_us.yaml")
upload_file(ea_bp, "/tmp/emergency_alert.yaml")
upload_file(d_bp, "/tmp/default.yaml")
upload_file(setup_py, "/tmp/setup.py")

print("Running blueprint update on VPS...")
run_cmd("sudo python3 /tmp/setup.py")
run_cmd("sudo chown -R www-data:www-data /var/www/oasis-admin && sudo chmod -R 775 /var/www/oasis-admin")

print("Cleaning up...")
import shutil
shutil.rmtree(r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_previews")
run_cmd("rm -f /tmp/listings.yaml /tmp/managers.yaml /tmp/visit_us.yaml /tmp/emergency_alert.yaml /tmp/default.yaml /tmp/setup.py")
print("Done!")
