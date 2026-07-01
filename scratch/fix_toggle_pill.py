import sys, os
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file

local_js = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\deploy-mirror\js\site-config-loader.js"

with open(local_js, "r", encoding="utf-8") as f:
    js = f.read()

# We need to update the setActive function in site-config-loader.js to also move the togglePill.
# Let's find the setActive function and update it.

old_setActive = """        function setActive(tab) {
          activeTab = tab;
          if (tab === 'sale') {
            buyBtn.className = btnBaseClass + ' ' + btnActiveClass;
            rentBtn.className = btnBaseClass + ' ';
          } else {
            buyBtn.className = btnBaseClass + ' ';
            rentBtn.className = btnBaseClass + ' ' + btnActiveClass;
          }
          renderCards();
        }"""

new_setActive = """        var pill = toggleWrap.querySelector('[class*="togglePill"]');

        function updatePill(activeBtn) {
          if (pill && activeBtn) {
            pill.style.left = activeBtn.offsetLeft + 'px';
            pill.style.width = activeBtn.offsetWidth + 'px';
          }
        }

        function setActive(tab) {
          activeTab = tab;
          if (tab === 'sale') {
            buyBtn.className = btnBaseClass + ' ' + btnActiveClass;
            rentBtn.className = btnBaseClass + ' ';
            updatePill(buyBtn);
          } else {
            buyBtn.className = btnBaseClass + ' ';
            rentBtn.className = btnBaseClass + ' ' + btnActiveClass;
            updatePill(rentBtn);
          }
          renderCards();
        }

        // Run once initially to position the pill correctly
        setTimeout(function() {
          updatePill(activeTab === 'sale' ? buyBtn : rentBtn);
        }, 50);"""

if old_setActive in js:
    js = js.replace(old_setActive, new_setActive)
    print("Updated setActive function to animate the togglePill.")
else:
    print("ERROR: Could not find old setActive function in JS!")
    sys.exit(1)

with open(local_js, "w", encoding="utf-8") as f:
    f.write(js)

# Upload to VPS
remote_temp = "/tmp/site-config-loader.js"
remote_dest = "/var/www/oasis-frontend/js/site-config-loader.js"

print("Uploading to VPS...")
upload_file(local_js, remote_temp)
run_cmd(f"sudo mv {remote_temp} {remote_dest}")
run_cmd(f"sudo chown www-data:www-data {remote_dest}")
run_cmd(f"sudo chmod 644 {remote_dest}")
print("Done VPS!")
