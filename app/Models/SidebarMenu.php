<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SidebarMenu extends Model {

	/**
	 * Specify that we're using the db for the API, or Cav_db
	 * @var string
	 */
	protected $connection = 'mysql';

	protected $table = 'sidebar_menus';

	protected $fillable = [
		'title'
	];

	public function items()
	{
		return $this->hasMany('App\Models\SidebarItem', 'menu_id', 'id');
	}
}