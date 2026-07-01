import sys, re
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd

result = run_cmd("sudo cat /var/www/oasis-frontend/index.html")
stdout = str(result)

# Find all id= attributes
ids = re.findall(r'id="([^"]+)"', stdout)
print("All IDs on the page:")
for i in sorted(set(ids)):
    print(f"  #{i}")

# Find all section tags
sections = re.findall(r'<section[^>]*>', stdout)
print("\nAll <section> tags:")
for s in sections:
    print(f"  {s}")
