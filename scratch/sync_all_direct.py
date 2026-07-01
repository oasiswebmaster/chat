import sys, os, yaml, json, re
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file

# Python script to run on the VPS
vps_script = """import os, yaml, json, re

PAGES_DIR = '/var/www/oasis-admin/user/pages'
FRONTEND_DATA = '/var/www/oasis-frontend/data'

def parse_md(path):
    if not os.path.exists(path):
        return None, None
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parse frontmatter
    m = re.match(r'^---\\s*\\n(.*?)\\n---\\s*\\n(.*)$', content, re.DOTALL)
    if m:
        try:
            frontmatter = yaml.safe_load(m.group(1))
            body = m.group(2).strip()
            return frontmatter, body
        except Exception as e:
            print(f"Error parsing {path}: {e}")
    return None, None

# 1. Sync Listings
fm, body = parse_md(f"{PAGES_DIR}/01.buy-or-rent/listings.md")
if fm:
    sale = []
    for i, item in enumerate(fm.get('sale_cards', []), 1):
        item['id'] = i
        item['images'] = [item.get('image_url', '')]
        sale.append(item)
    
    rental = []
    for i, item in enumerate(fm.get('rental_cards', []), 101):
        item['id'] = i
        item['images'] = [item.get('image_url', '')]
        rental.append(item)
        
    with open(f"{FRONTEND_DATA}/cards.json", 'w', encoding='utf-8') as f:
        json.dump({'sale': sale, 'rental': rental}, f, indent=2, ensure_ascii=False)
    print("Synced cards.json")

# 2 & 3. Sync On-Site Managers and Visit Us
site_config = {}
cfg_path = f"{FRONTEND_DATA}/site-config.json"
if os.path.exists(cfg_path):
    try:
        with open(cfg_path, 'r', encoding='utf-8') as f:
            site_config = json.load(f)
    except:
        pass

fm, body = parse_md(f"{PAGES_DIR}/02.on-site-managers/managers.md")
if fm:
    site_config['manager_name'] = fm.get('manager_name', '')
    site_config['manager_phone'] = fm.get('manager_phone', '')
    site_config['manager_email'] = fm.get('manager_email', '')

fm, body = parse_md(f"{PAGES_DIR}/03.visit-us/visit_us.md")
if fm:
    site_config['address_line1'] = fm.get('address_line1', '')
    site_config['address_line2'] = fm.get('address_line2', '')

with open(cfg_path, 'w', encoding='utf-8') as f:
    json.dump(site_config, f, indent=2, ensure_ascii=False)
print("Synced site-config.json")

# 4. Sync Emergency Alert
fm, body = parse_md(f"{PAGES_DIR}/04.emergency-alert/emergency_alert.md")
if fm:
    alert = {
        'active': bool(fm.get('alert_active', False)),
        'severity': fm.get('alert_severity', 'warning'),
        'headline': fm.get('alert_headline', ''),
        'message': fm.get('alert_message', '')
    }
    with open(f"{FRONTEND_DATA}/alert.json", 'w', encoding='utf-8') as f:
        json.dump(alert, f, indent=2, ensure_ascii=False)
    print("Synced alert.json")

# 5. Sync Footer Pages (resort-info, bookings, privacy)
import markdown
for folder, slug in [
    ('05.resort-info/resort_info.md', 'resort-info'),
    ('06.bookings/bookings.md', 'bookings'),
    ('07.privacy/privacy.md', 'privacy')
]:
    fm, body = parse_md(f"{PAGES_DIR}/{folder}")
    if fm and body:
        # Convert markdown body to HTML
        html_content = markdown.markdown(body)
        page_data = {
            'title': fm.get('title', ''),
            'content': html_content
        }
        with open(f"{FRONTEND_DATA}/page-{slug}.json", 'w', encoding='utf-8') as f:
            json.dump(page_data, f, indent=2, ensure_ascii=False)
        print(f"Synced page-{slug}.json")
"""

local_path = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\sync_pages_direct.py"
with open(local_path, "w", encoding="utf-8") as f:
    f.write(vps_script)

print("Uploading to VPS...")
upload_file(local_path, "/tmp/sync_pages_direct.py")
run_cmd("sudo python3 /tmp/sync_pages_direct.py")
run_cmd("rm -f /tmp/sync_pages_direct.py")
os.remove(local_path)
print("Done!")
