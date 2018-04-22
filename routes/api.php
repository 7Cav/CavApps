<?php

use Illuminate\Http\Request;

use App\Models\CavUser;
use App\Models\Record;
use App\Models\AwardRecord;
use App\Models\Milpac;

use App\Http\Resources\UserResource;
use App\Http\Resources\MilpacResource;
use App\Http\Resources\RecordResource;
use App\Http\Resources\RecordResourceCollection;
use App\Http\Resources\UserListResourceCollection;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// FRONT-END API
Route::prefix('api')->group(function () {

    Route::get('/user/{id}/milpac', function ($id, Request $request) {
        return new MilpacResource(CavUser::find($id)->milpac);
    })->name('user-milpac');

    Route::get('user/{id}/records', function($id, Request $request) {
        return new RecordResourceCollection(CavUser::find($id)->milpac->records);
    })->name('user-records');

    Route::get('/record/{id}', function($id, Request $request) {
        return new RecordResource(Record::find($id));
    })->name('record');

    Route::get('/users/{type}', function($type, Request $request) {

        switch($type) {
            case "active":
                $milpacs = Milpac::where('roster_id', 1)->get();
                break;
            case "eloa":
                $milpacs = Milpac::where('roster_id', 2)->get();
                break;
            case "disch":
                $milpacs = Milpac::where('roster_id', 6)->get();
                break;
            default:
                $milpacs = collect();
                break;
        }

        return new UserListResourceCollection($milpacs);

    })->name('users');

    Route::get('/user/{id}', function ($id, Request $request) {
        return new UserResource(CavUser::find($id));
    })->name('user');

    Route::get('/user/{id}/awards', function ($id, Request $request) {
        return new AwardResourceCollection(CavUser::find($id)->milpac->awards);
    })->name('user-awards');

    Route::get('/award/{id}', function ($id, Request $request) {
        return new AwardResource(AwardRecord::find($id));
    })->name('user-specific-award');

});
