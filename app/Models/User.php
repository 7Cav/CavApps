<?php

namespace App\Models;

use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Carbon\Carbon;

class User extends Authenticatable
{
	use Notifiable;

	/**
	 * Specify that we're using the db for the API, or Cav_db
	 * @var string
	 */
	protected $connection = 'mysql';

	/**
	 * The attributes that are mass assignable.
	 *
	 * @var array
	 */
	protected $fillable = [
		'name', 'email','provider_id',
		'avatar', 'is_banned', 'is_banned'
	];

	/**
	 * The attributes that should be hidden for arrays.
	 *
	 * @var array
	 */
	protected $hidden = [
	];

	protected $appends = [
		'days_since_last_usage'
	];

	public function xenUser()
	{
	    return $this->hasOne('App\Models\CavUser', 'user_id', 'provider_id');
	}

	public function milpac()
	{
	    return $this->hasOne('App\Models\Milpac', 'user_id', 'provider_id');
	}

	public function apilogs()
	{
		return $this->hasMany('App\Models\APILog', 'user_id', 'id');
	}

	public function tokenrequests()
	{
		return $this->hasMany('App\Models\TokenRequest', 'user_id', 'id');
	}

	public function getDaysSinceLastUsageAttribute()
	{
	    $log = $this->apilogs()->orderBy('created_at', 'desc')->first();

	   if ($log) {
	    	return Carbon::now()->diffInDays($log->created_at);
		}

		return 0;
	}
}
