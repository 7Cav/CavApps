<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SidebarItem extends Model {

    /**
     * Specify that we're using the db for the API, or Cav_db
     * @var string
     */
    protected $connection = 'mysql';

    protected $table = 'sidebar_items';

    protected $fillable = [
        'title', 'url', 'icon',
        'menu_id', 'admin_only'
    ];

    public function menu()
    {
        return $this->belongsTo('App\Models\SidebarMenu', 'id', 'menu_id');
    }
}