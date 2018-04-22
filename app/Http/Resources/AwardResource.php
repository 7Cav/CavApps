<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class AwardResource extends JsonResource
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
            'record_id' => $this->record_id,
            'award_id' => $this->award_id,
            'from_user_id' => $this->from_user_id,
            'details' => $this->details,
            'award_date' => Carbon::createFromTimestamp($this->award_date)->toDateTimeString(),
            'citation_date' => Carbon::createFromTimestamp($this->citation_date)->toDateTimeString()
        ];
    }
}
