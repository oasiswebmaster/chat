import sys, os
sys.path.insert(0, r"C:\Users\jeyap\Documents\antigravity\calm-shannon")
sys.path.insert(0, r"C:\Users\jeyap\.gemini\antigravity\brain\e9b2fca7-852c-467a-b9ec-53e9fb2e7359\scratch")
from vps_tool import run_cmd, upload_file

# Let's create the updated oasis-sync.php file
sync_php = """<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;
use RocketTheme\Toolbox\Event\Event;

class OasisSyncPlugin extends Plugin
{
    public static function getSubscribedEvents()
    {
        return [
            'onAdminSave' => ['onAdminSave', 0]
        ];
    }

    public function onAdminSave(Event $event)
    {
        $page = $event['object'];
        $template = $page->template();

        // 1. Sync Listings
        if ($template === 'listings') {
            $sale = [];
            $id = 1;
            $saleCards = $page->value('header.sale_cards') ?? [];
            foreach ($saleCards as $item) {
                $item['id'] = $id++;
                $imageUrl = $item['image_url'] ?? '';
                $item['image_url'] = $imageUrl;
                $item['images'] = [$imageUrl];
                $sale[] = $item;
            }

            $rental = [];
            $id = 101;
            $rentalCards = $page->value('header.rental_cards') ?? [];
            foreach ($rentalCards as $item) {
                $item['id'] = $id++;
                $imageUrl = $item['image_url'] ?? '';
                $item['image_url'] = $imageUrl;
                $item['images'] = [$imageUrl];
                $rental[] = $item;
            }

            $cardsData = [
                'sale' => $sale,
                'rental' => $rental
            ];

            @file_put_contents(
                '/var/www/oasis-frontend/data/cards.json',
                json_encode($cardsData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            );
        }

        // 2. Sync On Site Managers
        if ($template === 'managers') {
            $file = '/var/www/oasis-frontend/data/site-config.json';
            $data = [];
            if (file_exists($file)) {
                $data = json_decode(file_get_contents($file), true) ?? [];
            }
            $data['manager_name'] = $page->value('header.manager_name') ?? '';
            $data['manager_phone'] = $page->value('header.manager_phone') ?? '';
            $data['manager_email'] = $page->value('header.manager_email') ?? '';
            
            @file_put_contents(
                $file,
                json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            );
        }

        // 3. Sync Visit Us (Address)
        if ($template === 'visit_us') {
            $file = '/var/www/oasis-frontend/data/site-config.json';
            $data = [];
            if (file_exists($file)) {
                $data = json_decode(file_get_contents($file), true) ?? [];
            }
            $data['address_line1'] = $page->value('header.address_line1') ?? '';
            $data['address_line2'] = $page->value('header.address_line2') ?? '';
            
            @file_put_contents(
                $file,
                json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            );
        }

        // 4. Sync Emergency Alert
        if ($template === 'emergency_alert') {
            $alertData = [
                'active'   => (bool)($page->value('header.alert_active') ?? false),
                'severity' => $page->value('header.alert_severity') ?? 'warning',
                'headline' => $page->value('header.alert_headline') ?? '',
                'message'  => $page->value('header.alert_message') ?? ''
            ];

            @file_put_contents(
                '/var/www/oasis-frontend/data/alert.json',
                json_encode($alertData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            );
        }

        // 5. Sync Footer Text Pages (Resort Info, Bookings, Privacy)
        if (in_array($template, ['default', 'resort_info', 'bookings', 'privacy'])) {
            $slug = $page->slug();
            if (in_array($slug, ['resort-info', 'bookings', 'privacy'])) {
                $file = "/var/www/oasis-frontend/data/page-{$slug}.json";
                $pageData = [
                    'title' => $page->title(),
                    'content' => $page->content() // Compiles markdown to HTML
                ];
                @file_put_contents(
                    $file,
                    json_encode($pageData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
                );
            }
        }
    }
}
"""

local_path = r"C:\Users\jeyap\Documents\antigravity\calm-shannon\scratch\oasis-sync.php"
with open(local_path, "w", encoding="utf-8") as f:
    f.write(sync_php)

print("Uploading to VPS...")
upload_file(local_path, "/tmp/oasis-sync.php")
run_cmd("sudo mv /tmp/oasis-sync.php /var/www/oasis-admin/user/plugins/oasis-sync/oasis-sync.php")
run_cmd("sudo chown www-data:www-data /var/www/oasis-admin/user/plugins/oasis-sync/oasis-sync.php")
os.remove(local_path)
print("Done!")
