import sys, os
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file

THEME_DIR = "/var/www/oasis-admin/user/themes/quark2/templates"

# Map each Grav page template to the correct external site URL + section
# The iframe loads the live oasisresort.ca and scrolls/targets the section
def make_iframe_twig(label, url):
    return f"""{{% extends 'partials/base.html.twig' %}}

{{% block content %}}
<style>
  .oasis-preview-wrap {{
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
  }}
  .oasis-preview-label {{
    display: inline-block;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    color: #fff;
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 0.4rem 1.2rem;
    border-radius: 6px 6px 0 0;
    margin-bottom: 0;
  }}
  .oasis-preview-frame {{
    width: 100%;
    height: 80vh;
    border: 2px solid #1a1a2e;
    border-radius: 0 0 12px 12px;
    background: #f4f4f4;
  }}
</style>
<div class="oasis-preview-wrap">
  <span class="oasis-preview-label">Live Preview — {label}</span>
  <iframe class="oasis-preview-frame" src="{url}" loading="lazy"></iframe>
</div>
{{% endblock %}}
"""

templates = {
    # Main CMS pages
    "listings.html.twig":        make_iframe_twig("Buy or Rent", "https://oasisresort.ca/#booking"),
    "managers.html.twig":        make_iframe_twig("On-Site Managers", "https://oasisresort.ca/#booking"),
    "visit_us.html.twig":        make_iframe_twig("Visit Us", "https://oasisresort.ca/#booking"),
    "emergency_alert.html.twig": make_iframe_twig("Emergency Alert Banner", "https://oasisresort.ca/"),
    # Footer pages
    "resort_info.html.twig":     make_iframe_twig("Resort Information", "https://oasisresort.ca/coming-soon?page=resort-info"),
    "bookings.html.twig":        make_iframe_twig("Bookings", "https://oasisresort.ca/coming-soon?page=bookings"),
    "privacy.html.twig":         make_iframe_twig("Privacy Policy", "https://oasisresort.ca/coming-soon?page=privacy"),
}

tmp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\_twig2"
os.makedirs(tmp, exist_ok=True)

for name, content in templates.items():
    local = os.path.join(tmp, name)
    with open(local, "w", encoding="utf-8") as f:
        f.write(content)
    upload_file(local, f"/tmp/{name}")
    run_cmd(f"sudo mv /tmp/{name} {THEME_DIR}/{name}")

run_cmd(f"sudo chown -R www-data:www-data {THEME_DIR}")
run_cmd("cd /var/www/oasis-admin && sudo -u www-data php bin/grav clearcache")

import shutil
shutil.rmtree(tmp)
print("Done — all preview templates now show the live external site via iframe.")
