<?php
/**
 * Kirby Configuration
 * Handles automatic export of panel content to the front-facing website's JSON files.
 */

return [
    'debug' => false,
    
    // Security Keys
    'content' => [
        'salt' => '1f21095fd90c6ec5c2f1e2b7a97ba3a70941f7c2f5cfd9e6ffc13c97742dd314'
    ],
    'cookie.key' => 'f3db3d3777b44690e1dadc98784ba42eb0f90a085355ecef1a37e3f114397b14',
    
    // Enable the Panel
    'panel' => [
        'install' => false // Disable installer now that account is created
    ],

    // Hooks to sync data to the main website
    'hooks' => [
        'page.update:after' => function ($newPage, $oldPage) {
            if ($newPage->isSite()) {
                
                // 1. Sync Realtor Cards (Sale & Rental)
                $sale = [];
                $id = 1;
                foreach ($newPage->sale_cards()->yaml() as $item) {
                    $item['id'] = $id++;
                    $imageUrl = $item['image_url'] ?? '';
                    $item['image_url'] = $imageUrl;
                    $item['images'] = [$imageUrl];
                    $sale[] = $item;
                }

                $rental = [];
                $id = 101;
                foreach ($newPage->rental_cards()->yaml() as $item) {
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

                // 2. Sync Site Content (Managers & Address)
                $siteData = [
                    'manager_name'  => $newPage->manager_name()->value(),
                    'manager_phone' => $newPage->manager_phone()->value(),
                    'manager_email' => $newPage->manager_email()->value(),
                    'address_line1' => $newPage->address_line1()->value(),
                    'address_line2' => $newPage->address_line2()->value()
                ];

                @file_put_contents(
                    '/var/www/oasis-frontend/data/site-config.json',
                    json_encode($siteData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
                );

                // 3. Sync Emergency Alert
                $alertData = [
                    'active'   => $newPage->alert_active()->toBool(),
                    'severity' => $newPage->alert_severity()->value(),
                    'headline' => $newPage->alert_headline()->value(),
                    'message'  => $newPage->alert_message()->value()
                ];

                @file_put_contents(
                    '/var/www/oasis-frontend/data/alert.json',
                    json_encode($alertData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
                );
            }
        }
    ]
];
