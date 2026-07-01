import sys, re
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd

# Get the index.html and extract all id= attributes
result = run_cmd("sudo cat /var/www/oasis-frontend/index.html")
stdout = result.get("stdout", "") if isinstance(result, dict) else str(result)

# Also print the raw output so we can grep it
ids = re.findall(r'id=["\']([^"\']+)["\']', stdout)
print("Section IDs found on index.html:")
for i in ids:
    print(f"  #{i}")

# Also check for section/class patterns
sections = re.findall(r'(?:class|id)=["\']([^"\']*(?:section|container|visit|listing|alert|hero|about|contact|footer|manager)[^"\']*)["\']', stdout, re.IGNORECASE)
print("\nSection-related classes/ids:")
for s in set(sections):
    print(f"  {s}")

# Check the page frontmatter to understand template mapping
for page_dir in ["01.buy-or-rent", "02.on-site-managers", "03.visit-us", "04.emergency-alert", "05.resort-info", "06.bookings", "07.privacy"]:
    r = run_cmd(f"sudo cat /var/www/oasis-admin/user/pages/{page_dir}/default.md 2>/dev/null || sudo ls /var/www/oasis-admin/user/pages/{page_dir}/")
    print(f"\n--- {page_dir} ---")
