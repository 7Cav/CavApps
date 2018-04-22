<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class MilpacResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'user_id' => $this->user_id,
            'real_name' => $this->real_name,
            'username' => $this->username,
            'rank' => $this->rank,
            'rank_shorthand' => $this->rank_shorthand,
            'status' => $this->status,
            'primary_position' => $this->primary,
            'bio' => $this->bio,
            'join_date' => Carbon::createFromTimestamp($this->join_date)->toDateTimeString(),
            'promotion_date' => Carbon::createFromTimestamp($this->promotion_date)->toDateTimeString()
        ];
    }
}
