<?php

use Illuminate\Database\Seeder;
use App\Models\SidebarMenu;
use App\Models\SidebarItem;
use Carbon\Carbon;

class SidebarSeeder extends Seeder
{


    const MENUS = [
        0 => [
            'title' => 'Home',
            'items' => [
                0 => [
                    'title' => 'Tokens',
                    'url' => 'home/tokens',
                    'icon' => 'fa fa-home',
                    'admin_only' => false,
                ],
                1 => [
                    'title' => 'Guide',
                    'url' => 'home/guide',
                    'icon' => 'fa fa-book',
                    'admin_only' => false,
                ],
            ],
        ],
        1 => [
            'title' => 'Admin',
            'icon' => 'fa fa-close',
            'items' => [
                0 => [
                    'title' => 'User Metrics',
                    'url' => 'admin/user-metrics',
                    'icon' => 'fa fa-line-chart',                    
                    'admin_only' => true,
                ],
                1 => [
                    'title' => 'Requests',
                    'url' => 'admin/requests',
                    'icon' => 'fa fa-users',
                    'admin_only' => true,
                ],
            ],
        ],
    ];


    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        foreach(self::MENUS as $menu) {

            DB::table('sidebar_menus')->insert([
                'title' => $menu['title'],
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]);

            $menuID = DB::getPdo()->lastInsertId();

            foreach($menu['items'] as $item) {
                DB::table('sidebar_items')->insert([
                    'title' => $item['title'],
                    'url' => $item['url'],
                    'icon' => $item['icon'],
                    'menu_id' => $menuID,
                    'admin_only' => $item['admin_only'],
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now()
                ]);

            }
        }
    }
}
