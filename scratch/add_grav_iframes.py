import sys
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file
import os

# 1. Define the Blueprints with IFRAMES (NO EMOJIS, Very Clean)
listings_blueprint = """title: Buy or Rent
form:
  fields:
    preview_iframe:
      type: display
      markdown: true
      content: '<iframe src="https://oasisresort.ca#booking" style="width:100%; height:550px; border:1px solid rgba(23, 103, 246, 0.15); border-radius:8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background:#fff;"></iframe>'
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
    preview_iframe:
      type: display
      markdown: true
      content: '<iframe src="https://oasisresort.ca#contact" style="width:100%; height:350px; border:1px solid rgba(23, 103, 246, 0.15); border-radius:8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background:#fff;"></iframe>'
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
    preview_iframe:
      type: display
      markdown: true
      content: '<iframe src="https://oasisresort.ca#contact" style="width:100%; height:350px; border:1px solid rgba(23, 103, 246, 0.15); border-radius:8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background:#fff;"></iframe>'
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
    preview_iframe:
      type: display
      markdown: true
      content: '<iframe src="https://oasisresort.ca" style="width:100%; height:550px; border:1px solid rgba(23, 103, 246, 0.15); border-radius:8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background:#fff;"></iframe>'
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

resort_info_blueprint = """title: Resort Information
extends@:
  type: default
  context: blueprints/pages

form:
  fields:
    preview_iframe:
      type: display
      markdown: true
      content: '<iframe src="https://oasisresort.ca/coming-soon.html?page=resort-info" style="width:100%; height:500px; border:1px solid rgba(23, 103, 246, 0.15); border-radius:8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background:#fff;"></iframe>'
      placement: top
"""

bookings_blueprint = """title: Bookings
extends@:
  type: default
  context: blueprints/pages

form:
  fields:
    preview_iframe:
      type: display
      markdown: true
      content: '<iframe src="https://oasisresort.ca/coming-soon.html?page=bookings" style="width:100%; height:500px; border:1px solid rgba(23, 103, 246, 0.15); border-radius:8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background:#fff;"></iframe>'
      placement: top
"""

privacy_blueprint = """title: Privacy Policy
extends@:
  type: default
  context: blueprints/pages

form:
  fields:
    preview_iframe:
      type: display
      markdown: true
      content: '<iframe src="https://oasisresort.ca/coming-soon.html?page=privacy" style="width:100%; height:500px; border:1px solid rgba(23, 103, 246, 0.15); border-radius:8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background:#fff;"></iframe>'
      placement: top
"""

# Remote python code to run on VPS
remote_setup_code = """
import os

# 1. Ensure directory exists
os.makedirs('/var/www/oasis-admin/user/blueprints/pages', exist_ok=True)

# 2. Move blueprints
os.system('mv /tmp/listings.yaml /var/www/oasis-admin/user/blueprints/pages/listings.yaml')
os.system('mv /tmp/managers.yaml /var/www/oasis-admin/user/blueprints/pages/managers.yaml')
os.system('mv /tmp/visit_us.yaml /var/www/oasis-admin/user/blueprints/pages/visit_us.yaml')
os.system('mv /tmp/emergency_alert.yaml /var/www/oasis-admin/user/blueprints/pages/emergency_alert.yaml')
os.system('mv /tmp/resort_info.yaml /var/www/oasis-admin/user/blueprints/pages/resort_info.yaml')
os.system('mv /tmp/bookings.yaml /var/www/oasis-admin/user/blueprints/pages/bookings.yaml')
os.system('mv /tmp/privacy.yaml /var/www/oasis-admin/user/blueprints/pages/privacy.yaml')

# Clean up default.yaml since we split it
if os.path.exists('/var/www/oasis-admin/user/blueprints/pages/default.yaml'):
    os.remove('/var/www/oasis-admin/user/blueprints/pages/default.yaml')

# 3. Rename page files to match the new templates
def rename_page(path, old_name, new_name):
    old_file = os.path.join(path, old_name)
    new_file = os.path.join(path, new_name)
    if os.path.exists(old_file):
        os.rename(old_file, new_file)
        print(f"Renamed {old_file} to {new_file}")

rename_page('/var/www/oasis-admin/user/pages/05.resort-info', 'default.md', 'resort_info.md')
rename_page('/var/www/oasis-admin/user/pages/06.bookings', 'default.md', 'bookings.md')
rename_page('/var/www/oasis-admin/user/pages/07.privacy', 'default.md', 'privacy.md')

print("Successfully updated Grav blueprints and page files on VPS!")
"""

# 4. Remote python code to patch Nginx
remote_nginx_code = """
nginx_file = '/etc/nginx/sites-enabled/oasisresort'

with open(nginx_file, 'r') as f:
    config = f.read()

# Replace X-Frame-Options "DENY"; with Content-Security-Policy for frame-ancestors
if 'add_header X-Frame-Options "DENY";' in config:
    config = config.replace(
        'add_header X-Frame-Options "DENY";',
        "add_header Content-Security-Policy \\"frame-ancestors 'self' https://admin.oasisresort.ca;\\";"
    )
    print("Replaced X-Frame-Options with Content-Security-Policy in Nginx config.")
else:
    print("X-Frame-Options header not found or already replaced.")

with open(nginx_file, 'w') as f:
    f.write(config)
"""

# Write files locally
os.makedirs(r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_iframes", exist_ok=True)
l_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_iframes\listings.yaml"
m_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_iframes\managers.yaml"
vu_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_iframes\visit_us.yaml"
ea_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_iframes\emergency_alert.yaml"
ri_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_iframes\resort_info.yaml"
b_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_iframes\bookings.yaml"
p_bp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_iframes\privacy.yaml"
setup_py = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_iframes\setup.py"
nginx_py = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_iframes\patch_nginx.py"

with open(l_bp, "w", encoding="utf-8") as f: f.write(listings_blueprint)
with open(m_bp, "w", encoding="utf-8") as f: f.write(managers_blueprint)
with open(vu_bp, "w", encoding="utf-8") as f: f.write(visit_us_blueprint)
with open(ea_bp, "w", encoding="utf-8") as f: f.write(emergency_alert_blueprint)
with open(ri_bp, "w", encoding="utf-8") as f: f.write(resort_info_blueprint)
with open(b_bp, "w", encoding="utf-8") as f: f.write(bookings_blueprint)
with open(p_bp, "w", encoding="utf-8") as f: f.write(privacy_blueprint)
with open(setup_py, "w", encoding="utf-8") as f: f.write(remote_setup_code)
with open(nginx_py, "w", encoding="utf-8") as f: f.write(remote_nginx_code)

print("Uploading files to VPS...")
upload_file(l_bp, "/tmp/listings.yaml")
upload_file(m_bp, "/tmp/managers.yaml")
upload_file(vu_bp, "/tmp/visit_us.yaml")
upload_file(ea_bp, "/tmp/emergency_alert.yaml")
upload_file(ri_bp, "/tmp/resort_info.yaml")
upload_file(b_bp, "/tmp/bookings.yaml")
upload_file(p_bp, "/tmp/privacy.yaml")
upload_file(setup_py, "/tmp/setup.py")
upload_file(nginx_py, "/tmp/patch_nginx.py")

print("Running setup script on VPS...")
run_cmd("sudo python3 /tmp/setup.py")
print("Running Nginx patcher on VPS...")
run_cmd("sudo python3 /tmp/patch_nginx.py && sudo nginx -t && sudo systemctl reload nginx")

print("Setting permissions...")
run_cmd("sudo chown -R www-data:www-data /var/www/oasis-admin && sudo chmod -R 775 /var/www/oasis-admin")

print("Cleaning up...")
import shutil
shutil.rmtree(r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\grav_iframes")
run_cmd("rm -f /tmp/listings.yaml /tmp/managers.yaml /tmp/visit_us.yaml /tmp/emergency_alert.yaml /tmp/resort_info.yaml /tmp/bookings.yaml /tmp/privacy.yaml /tmp/setup.py /tmp/patch_nginx.py")
print("Done!")
