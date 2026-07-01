import sys, os
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file

# 1. Copy the Oasis logo into the admin panel's public directory
run_cmd("sudo cp /var/www/oasis-frontend/images/oasis-logo.png /var/www/oasis-admin/user/plugins/admin2/app/oasis-logo.png")
run_cmd("sudo chown www-data:www-data /var/www/oasis-admin/user/plugins/admin2/app/oasis-logo.png")

# 2. Create a custom CSS file that hides the Grav logo and shows the Oasis logo
custom_css = """/* Oasis Resort — Custom Admin Branding */
/* Hide the default GRAV text logo */
.grav-logo svg,
.grav-logo img,
nav .logo svg,
nav .logo img,
.sidebar .logo svg,
.sidebar .logo img,
a[href*="admin"] > svg,
.admin-logo svg {
    display: none !important;
}

/* Replace with Oasis logo */
.grav-logo,
nav .logo,
.sidebar .logo,
.admin-logo {
    background: url('/admin/user/plugins/admin2/app/oasis-logo.png') no-repeat center center !important;
    background-size: contain !important;
    min-width: 120px;
    min-height: 40px;
}

/* Also try targeting the topbar brand link */
.grav-logo a,
nav a.logo {
    display: flex;
    align-items: center;
}
"""

local_css = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\oasis-admin-brand.css"
with open(local_css, "w", encoding="utf-8") as f:
    f.write(custom_css)

upload_file(local_css, "/tmp/oasis-admin-brand.css")
run_cmd("sudo mv /tmp/oasis-admin-brand.css /var/www/oasis-admin/user/plugins/admin2/app/oasis-admin-brand.css")
run_cmd("sudo chown www-data:www-data /var/www/oasis-admin/user/plugins/admin2/app/oasis-admin-brand.css")
os.remove(local_css)

# 3. Inject the CSS link into admin2's index.html
inject_script = """
import re

index_file = '/var/www/oasis-admin/user/plugins/admin2/app/index.html'
with open(index_file, 'r') as f:
    html = f.read()

css_link = '<link rel="stylesheet" href="/admin/user/plugins/admin2/app/oasis-admin-brand.css">'

if 'oasis-admin-brand.css' not in html:
    html = html.replace('</head>', css_link + '\\n</head>')
    with open(index_file, 'w') as f:
        f.write(html)
    print("Injected custom CSS into admin2 index.html")
else:
    print("CSS already injected.")
"""

local_inject = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\inject_css.py"
with open(local_inject, "w", encoding="utf-8") as f:
    f.write(inject_script)

upload_file(local_inject, "/tmp/inject_css.py")
run_cmd("sudo python3 /tmp/inject_css.py")
run_cmd("sudo chown www-data:www-data /var/www/oasis-admin/user/plugins/admin2/app/index.html")
run_cmd("rm -f /tmp/inject_css.py")
os.remove(local_inject)

# 4. Clear cache
run_cmd("cd /var/www/oasis-admin && sudo -u www-data php bin/grav clearcache")

print("Done — Grav logo replaced with Oasis logo.")
