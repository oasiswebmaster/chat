import sys, os
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file

# Read the current loader
result = run_cmd("sudo cat /var/www/oasis-frontend/js/site-config-loader.js")
content = str(result)

# Find and extract just the stdout portion
import re
m = re.search(r'--- STDOUT ---\r?\n(.*?)(?:\r?\n--- STDERR ---|$)', content, re.DOTALL)
if m:
    js_content = m.group(1).rstrip()
else:
    # fallback: read from local file we just deployed
    js_content = ""
    print("WARNING: Could not parse stdout, will use full replacement")

# The problem: the centering CSS override replaces grid with flexbox.
# Original CSS uses: display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;
# Our override: display: flex !important; (breaks everything)
#
# Fix: Replace the centering CSS with one that works WITH the grid layout,
# only centering when there are fewer than 3 cards.

old_centering = (
    "    if (!document.getElementById('oasis-cards-centering-css')) {\n"
    "      var style = document.createElement('style');\n"
    "      style.id = 'oasis-cards-centering-css';\n"
    "      style.textContent =\n"
    "        '[class*=\"buyGrid\"] {' +\n"
    "        '  display: flex !important;' +\n"
    "        '  flex-wrap: wrap !important;' +\n"
    "        '  justify-content: center !important;' +\n"
    "        '  gap: 1.5rem !important;' +\n"
    "        '}' +\n"
    "        '[class*=\"buyCard\"] {' +\n"
    "        '  width: calc(33.333% - 1rem) !important;' +\n"
    "        '  min-width: 280px !important;' +\n"
    "        '  max-width: 360px !important;' +\n"
    "        '  flex: 0 1 auto !important;' +\n"
    "        '}';\n"
    "      document.head.appendChild(style);\n"
    "    }"
)

new_centering = (
    "    if (!document.getElementById('oasis-cards-centering-css')) {\n"
    "      var style = document.createElement('style');\n"
    "      style.id = 'oasis-cards-centering-css';\n"
    "      style.textContent =\n"
    "        '[class*=\"buyGrid\"] {' +\n"
    "        '  justify-items: center;' +\n"
    "        '}' +\n"
    "        '@media (max-width: 900px) {' +\n"
    "        '  [class*=\"buyGrid\"] {' +\n"
    "        '    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;' +\n"
    "        '  }' +\n"
    "        '}';\n"
    "      document.head.appendChild(style);\n"
    "    }"
)

# Read the actual JS file on VPS and replace
local_js = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\site-config-loader-fixed.js"

# Read the currently deployed file
run_cmd("sudo cp /var/www/oasis-frontend/js/site-config-loader.js /tmp/loader-current.js")
run_cmd("sudo chmod 644 /tmp/loader-current.js")

# Download it
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("198.71.233.140", username="root", password="d@dfaAwf#4FQ")
sftp = ssh.open_sftp()
sftp.get("/tmp/loader-current.js", local_js)
sftp.close()
ssh.close()

with open(local_js, "r", encoding="utf-8") as f:
    js = f.read()

# Replace the centering CSS block
# The old centering block uses flex, we need to replace it with grid-compatible centering
old_css_block = """    if (!document.getElementById('oasis-cards-centering-css')) {
      var style = document.createElement('style');
      style.id = 'oasis-cards-centering-css';
      style.textContent =
        '[class*="buyGrid"] {' +
        '  display: flex !important;' +
        '  flex-wrap: wrap !important;' +
        '  justify-content: center !important;' +
        '  gap: 1.5rem !important;' +
        '}' +
        '[class*="buyCard"] {' +
        '  width: calc(33.333% - 1rem) !important;' +
        '  min-width: 280px !important;' +
        '  max-width: 360px !important;' +
        '  flex: 0 1 auto !important;' +
        '}';
      document.head.appendChild(style);
    }"""

new_css_block = """    if (!document.getElementById('oasis-cards-centering-css')) {
      var style = document.createElement('style');
      style.id = 'oasis-cards-centering-css';
      style.textContent =
        '[class*="buyGrid"] {' +
        '  justify-items: center;' +
        '}';
      document.head.appendChild(style);
    }"""

if old_css_block in js:
    js = js.replace(old_css_block, new_css_block)
    print("Replaced centering CSS block.")
else:
    print("WARNING: Could not find exact old CSS block. Trying alternative...")
    # Try a more flexible match
    js = re.sub(
        r"if \(!document\.getElementById\('oasis-cards-centering-css'\)\).*?document\.head\.appendChild\(style\);\s*\}",
        new_css_block.strip(),
        js,
        flags=re.DOTALL
    )
    print("Used regex replacement.")

with open(local_js, "w", encoding="utf-8") as f:
    f.write(js)

upload_file(local_js, "/tmp/site-config-loader.js")
run_cmd("sudo mv /tmp/site-config-loader.js /var/www/oasis-frontend/js/site-config-loader.js")
run_cmd("sudo chown www-data:www-data /var/www/oasis-frontend/js/site-config-loader.js")
run_cmd("sudo rm -f /tmp/loader-current.js")
os.remove(local_js)

# Also update the deploy-mirror copy
deploy_mirror_js = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\deploy-mirror\js\site-config-loader.js"
with open(deploy_mirror_js, "r", encoding="utf-8") as f:
    djs = f.read()

if old_css_block in djs:
    djs = djs.replace(old_css_block, new_css_block)
    with open(deploy_mirror_js, "w", encoding="utf-8") as f:
        f.write(djs)
    print("Also fixed deploy-mirror copy.")

print("Done — removed flexbox override, cards now use original CSS Grid layout.")
