<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CavUser extends Model
{

    /**
     * Specify that we're using the db for the API, or cav_db
     * @var string
     */
    protected $connection = 'cav_db';

    /**
     * Xenforo doesn't use just `id` for it's tables...
     * @var string
     */
    protected $primaryKey = 'user_id';

    /**
     * Specify table in xenforo
     * 
     * @var string
     */
    protected $table = 'xf_user';

    /**
     * The attributes that are mass assignable.
     *
     * note: this is empty as we're not writing to the cav_db users
     *
     * @var array
     */
    protected $fillable = [

    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [

    ];

    public function milpac()
    {
        return $this->hasOne('App\Models\Milpac', 'user_id', 'user_id');
    }
}
