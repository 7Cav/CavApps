<?php

namespace App\Repositories;

use Illuminate\Support\Facades\Auth;
use App\Models\SidebarMenu;

class SidebarRepository {

    public function getAvailibleMenus()
    {
        $user = Auth::user();
        $menus = SidebarMenu::with('items')->get();

        if ($user) {
            if (!$user->is_admin) {
        
                foreach($menus as $menuKey => $menu) {
                    foreach($menu->items as $itemKey => $item) {
                        if ($item->admin_only) {
                            $menu->items->forget($itemKey);
                        }
                    }

                    if ($menu->items->count() === 0 ) {
                        $menus->forget($menuKey);
                    }
                }

                return $menus;
            }

            return $menus;
        }

        return [];
    }
}
