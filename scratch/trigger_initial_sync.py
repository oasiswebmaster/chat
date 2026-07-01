import sys, os
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file

sync_all_php = """<?php
define('GRAV_ROOT', '/var/www/oasis-admin');
define('DS', '/');
require_once(GRAV_ROOT . '/vendor/autoload.php');

$grav = \Grav\Common\Grav::instance();
$grav->init();

// Load the plugin so it's registered
$grav['plugins']->setup();

$pages = $grav['pages']->all();
foreach ($pages as $page) {
    if ($page->routable()) {
        $template = $page->template();
        echo "Processing page: " . $page->title() . " (template: " . $template . ")\\n";
        
        // Manually trigger the plugin save logic to guarantee it runs
        $plugin = new \Grav\Plugin\OasisSyncPlugin('oasis-sync', $grav);
        $event = new \RocketTheme\Toolbox\Event\Event(['object' => $page]);
        $plugin->onAdminSave($event);
    }
}
echo "Done syncing all pages!\\n";
"""

local_path = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\sync_all.php"
with open(local_path, "w", encoding="utf-8") as f:
    f.write(sync_all_php)

print("Uploading to VPS...")
upload_file(local_path, "/tmp/sync_all.php")
run_cmd("sudo -u www-data php /tmp/sync_all.php")
run_cmd("rm -f /tmp/sync_all.php")
os.remove(local_path)
print("Done!")
