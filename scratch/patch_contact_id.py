import sys, os
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd

# 1. Patch index.html on the VPS
patch_vps_cmd = (
    "sudo sed -i 's/class=\"contact-section\"/id=\"contact\" class=\"contact-section\"/g' "
    "/var/www/oasis-frontend/index.html"
)
print("Patching index.html on VPS...")
run_cmd(patch_vps_cmd)

# 2. Patch index.html locally
local_index = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\deploy-mirror\index.html"
if os.path.exists(local_index):
    with open(local_index, "r", encoding="utf-8") as f:
        html = f.read()
    
    if 'id="contact"' not in html:
        html = html.replace('class="contact-section"', 'id="contact" class="contact-section"')
        with open(local_index, "w", encoding="utf-8") as f:
            f.write(html)
        print("Patched local index.html")
    else:
        print("Local index.html already patched.")

# 3. Update the Grav Twig templates to point to the new #contact ID
THEME_DIR = "/var/www/oasis-admin/user/themes/quark2/templates"

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

# Deploy the updated Twig files for managers and visit_us
import tempfile
for name, label, url in [
    ("managers.html.twig", "On-Site Managers", "https://oasisresort.ca/#contact"),
    ("visit_us.html.twig", "Visit Us", "https://oasisresort.ca/#contact")
]:
    content = make_iframe_twig(label, url)
    fd, temp_path = tempfile.mkstemp(suffix=".twig")
    with os.fdopen(fd, 'w', encoding='utf-8') as tmp_f:
        tmp_f.write(content)
    
    # Upload and move
    from vps_tool import upload_file
    upload_file(temp_path, f"/tmp/{name}")
    run_cmd(f"sudo mv /tmp/{name} {THEME_DIR}/{name}")
    os.remove(temp_path)

run_cmd(f"sudo chown -R www-data:www-data {THEME_DIR}")
run_cmd("cd /var/www/oasis-admin && sudo -u www-data php bin/grav clearcache")
print("All done!")
