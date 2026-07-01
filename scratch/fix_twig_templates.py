import sys, os
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file

def make_twig(page_title):
    return f"""{{% extends 'partials/base.html.twig' %}}

{{% block content %}}
<div style="max-width:800px; margin:2rem auto; padding:2rem; background:#fff; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <h1 style="font-family:'Playfair Display',serif; color:#1a1a2e; margin-bottom:1rem;">{{{{ page.title }}}}</h1>
  <div style="font-family:'Inter',sans-serif; color:#333; line-height:1.8;">
    {{{{ page.content|raw }}}}
  </div>
</div>
{{% endblock %}}
"""

templates = {
    "bookings.html.twig": make_twig("Bookings"),
    "privacy.html.twig": make_twig("Privacy Policy"),
    "resort_info.html.twig": make_twig("Resort Information"),
}

tmp = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\_twig_tmp"
os.makedirs(tmp, exist_ok=True)

for name, content in templates.items():
    local = os.path.join(tmp, name)
    with open(local, "w", encoding="utf-8") as f:
        f.write(content)
    upload_file(local, f"/tmp/{name}")
    run_cmd(f"sudo mv /tmp/{name} /var/www/oasis-admin/user/themes/quark/templates/{name}")

run_cmd("sudo chown -R www-data:www-data /var/www/oasis-admin/user/themes/quark/templates")
run_cmd("cd /var/www/oasis-admin && sudo -u www-data php bin/grav clearcache")

import shutil
shutil.rmtree(tmp)
print("Done — Twig templates now render actual page content from the editor.")
