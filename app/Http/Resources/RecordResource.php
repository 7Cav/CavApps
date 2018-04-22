<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class RecordResource extends JsonResource
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
            'details' => $this->details,
            'record_date' => Carbon::createFromTimestamp($this->record_date)->toDateTimeString(),
            'citation_date' => Carbon::createFromTimestamp($this->citation_date)->toDateTimeString()
        ];
    }
}
