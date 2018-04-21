<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use App\Models\Position;

class Milpac extends Model
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
	protected $primaryKey = 'relation_id';

	/**
	 * Specify table in xenforo
	 * 
	 * @var string
	 */
	protected $table = 'xf_pe_roster_user_relation';

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
		'position_id', 'secondary_position_ids', 'rank_id',
		'uniform_date', 'custom_roster_fields'
	];

	protected $appends = [
		'rank', 'status', 'primary',
		'rank_shorthand'
	];

	public function records()
	{
		return $this->hasMany('App\Models\Record', 'relation_id', 'relation_id');
	}

	public function getRankAttribute()
	{
		return DB::connection('cav_db')
					->table('xf_pe_roster_rank')
					->where('rank_id', $this->rank_id)
					->value('title');
	}

	public function primaryPosition()
	{
		return $this->hasOne('App\Models\Position', 'position_id', 'position_id');
	}

	public function getPrimaryAttribute()
	{
		return $this->primaryPosition->position_title;
	}

	/**
	 * Accessor that mimics Eloquent dynamic property.
	 *
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	public function getSecondaryPositionsAttribute()
	{
		if (!$this->relationLoaded('secondaryPositions')) {
			$positions = Position::whereIn('position_id', $this->secondary_position_ids)->orderBy('materialized_order', 'asc')->get();

			$this->setRelation('secondaryPositions', $positions);
		}

		return $this->getRelation('secondaryPositions');
	}

	/**
	 * Access positions relation query.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */	
	public function secondaryPositions()
	{
		return Position::whereIn('position_id', $this->secondary_position_ids);
	}

	/**
	 * Accessor for secondary_position_ids property.
	 *
	 * @return array
	 */
	public function getSecondaryPositionIdsAttribute($commaSeparatedIds)
	{
		return explode(',', $commaSeparatedIds);
	}

	/**
	 * Mutator for secondary_position_ids property.
	 *
	 * @param  array|string $ids
	 * @return void
	 */
	public function setSecondaryPositionIdsAttribute($ids)
	{
		$this->attributes['secondary_position_ids'] = is_string($ids) ? $ids : implode(',', $ids);
	}

	public function getBilletsAttribute()
	{
	
		return $this->secondaryPositions->add($this->primaryPosition)->sortBy('materialized_order');
	}

	public function awards()
	{
		return $this->hasMany('App\Models\AwardRecord', 'relation_id', 'relation_id');
	}

	public function getActiveAttribute()
	{
		return $this->roster_id === 1 ? true : false;
	}

	public function getEloaAttribute()
	{
		return $this->roster_id === 2 ? true : false;
	}

	public function getDischargedAttribute()
	{
		return $this->roster_id === 6 ? true : false;
	}

	public function getStatusAttribute()
	{
		switch($this->roster_id) {
			case 1:
				return 'active';
			case 2:
				return 'eloa';
			case 6:
				return 'disch';
			default:
				return 'unknown';
		}
	}

	public function getRankShorthandAttribute()
	{
		return $this->generateRankShorthand();
	}

	public function generateRankShorthand()
	{
		switch ($this->rank) {
			case "General of the Army":
				return 'GOA';
			case "General":
				return 'GEN';
			case "Lieutenant General":
				return 'LTG';
			case "Major General":
				return 'MG';
			case "Brigadier General":
				return 'BG';
			case "Colonel":
				return 'COL';
			case "Lieutenant Colonel":
				return 'LTC';
			case "Major":
				return 'MAJ';
			case "Captain":
				return 'CPT';
			case "First Lieutenant":
				return '1LT';
			case "Second Lieutenant":
				return '2LT';
			case "Chief Warrant Officer 5":
				return 'CW5';
			case "Chief Warrant Officer 4":
				return 'CW4';
			case "Chief Warrant Officer 3":
				return 'CW3';
			case "Chief Warrant Officer 2":
				return 'CW2';
			case "Warrant Officer 1":
				return 'WO1';
			case "Command Sergeant Major":
				return 'CSM';
			case "Sergeant Major":
				return 'SGM';
			case "First Sergeant":
				return '1SG';
			case "Master Sergeant":
				return 'MSG';
			case "Sergeant First Class":
				return 'SFC';
			case "Staff Sergeant":
				return 'SSG';
			case "Sergeant":
				return 'SGT';
			case "Corporal":
				return 'CPL';
			case "Specialist":
				return 'SPC';
			case "Private First Class":
				return 'PFC';
			case "Private":
				return 'PVT';
			case "Recruit":
				return 'RCT';
			default:
				return 'UNK';
		}
	}
}
