<?php
define('BX_DOL', 1);
require_once('/var/www/una/inc/header.inc.php');

$db = BxDolDb::getInstance();

echo "Updating page visibility bitmasks to require member login...\n";

// Require login for pages
$db->query("UPDATE `sys_objects_page` SET `visible_for_levels` = 2147483646 WHERE `uri` IN ('documents', 'events-calendar', 'list-my-home')");
echo "Updated sys_objects_page for documents, events-calendar, list-my-home.\n";

echo "Enabling global guest lockout setting...\n";
$db->query("UPDATE `sys_options` SET `value` = 'on' WHERE `name` = 'sys_lock_from_unauthenticated'");
echo "Enabled sys_lock_from_unauthenticated.\n";

echo "Hiding site navigation menu items from guest users...\n";
$db->query("UPDATE `sys_menu_items` SET `visible_for_levels` = 2147483646 WHERE `set_name` = 'sys_site' AND `name` != 'home'");
echo "Updated sys_site navigation menu items visibility.\n";

echo "Deactivating guest and public calendar options in settings...\n";

// Disable guest/public options
$db->query("UPDATE `sys_options` SET `value` = '' WHERE `name` = 'bx_events_enable_guest_calendar' OR `name` = 'bx_events_enable_public_calendar'");
echo "Updated guest calendar option settings.\n";

echo "Clearing UNA DB and template caches...\n";
$oDb = BxDolDb::getInstance();
$aTables = $oDb->getColumn("SHOW TABLES LIKE '%cache%'");
foreach ($aTables as $sTable) {
    $oDb->query("DELETE FROM `$sTable` WHERE 1");
}
echo "All database cache tables cleared!\n";

// Clear files cache
@shell_exec('rm -rf /var/www/una/cache/* /var/www/una/cache_public/* 2>/dev/null');
echo "Filesystem cache cleared!\n";

echo "Database lockdown completed successfully!\n";
?>
