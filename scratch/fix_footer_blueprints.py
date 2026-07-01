import sys, os
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file

def make_blueprint(title):
    return f"""title: {title}
form:
  fields:
    tabs:
      type: tabs
      active: 1
      fields:
        content_tab:
          type: tab
          title: Content
          fields:
            header.title:
              type: text
              autofocus: true
              style: vertical
              label: Title
            content:
              type: editor
              label: Content
              rows: 25
              id: editor
              style: vertical
"""

blueprints = {
    "resort_info.yaml": make_blueprint("Resort Information"),
    "bookings.yaml": make_blueprint("Bookings"),
    "privacy.yaml": make_blueprint("Privacy Policy"),
}

tmp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\_bp_tmp"
os.makedirs(tmp, exist_ok=True)

for name, content in blueprints.items():
    local = os.path.join(tmp, name)
    with open(local, "w", encoding="utf-8") as f:
        f.write(content)
    upload_file(local, f"/tmp/{name}")

run_cmd("sudo mv /tmp/resort_info.yaml /var/www/oasis-admin/user/blueprints/pages/resort_info.yaml")
run_cmd("sudo mv /tmp/bookings.yaml /var/www/oasis-admin/user/blueprints/pages/bookings.yaml")
run_cmd("sudo mv /tmp/privacy.yaml /var/www/oasis-admin/user/blueprints/pages/privacy.yaml")
run_cmd("sudo chown -R www-data:www-data /var/www/oasis-admin/user/blueprints")
run_cmd("cd /var/www/oasis-admin && sudo -u www-data php bin/grav clearcache")

import shutil
shutil.rmtree(tmp)
print("Done — footer page blueprints now have a full content editor.")
