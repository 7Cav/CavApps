<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Award extends Model
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
    protected $primaryKey = 'award_id';

    /**
     * Specify table in xenforo
     * 
     * @var string
     */
    protected $table = 'xf_pe_roster_award';

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
        'award_image', 'award_group_id',
        'display_order'
    ];
}
