<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'user_id' => $this->user_id,
            'username' => $this->username,
            'timezone' => $this->timezone,
            'message_count' => $this->message_count,
            'like_count' => $this->like_count,
            'register_date' => Carbon::createFromTimestamp($this->register_date)->toDateTimeString()
        ];
    }
}
