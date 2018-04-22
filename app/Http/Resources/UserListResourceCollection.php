<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use App\Http\Resources\UserListResource;

use Carbon\Carbon;

class UserListResourceCollection extends ResourceCollection
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
            'data' => [
                'user_ids' => UserListResource::collection($this->collection),
            ],
            'type' => $request->route('type')
        ];           
    }
}
