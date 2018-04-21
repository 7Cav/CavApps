<?php

namespace App\Http\ViewComposers;

use Illuminate\View\View;
use App\Repositories\SidebarRepository;

class SidebarComposer {

    protected $appName;

    protected $menus;

    public function __construct(SidebarRepository $menus)
    {
        $this->appName = config('app.name', 'Laravel');
        $this->menus = $menus;
    }

    public function compose(View $view)
    {   
        $view->with('appName', $this->appName);
        $view->with('menus', $this->menus->getAvailibleMenus());
    }
}