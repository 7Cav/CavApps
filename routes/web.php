<?php

// LETS LOAD THIS BTICH
Route::get('/', 'HomeController@index')->name('home');

// GENERAL ROUTES
Route::get('login/xenforo', 'Auth\AuthController@redirectToProvider')->name('login');
Route::get('login/xenforo/callback', 'Auth\AuthController@handleProviderCallback');
Route::get('logout', 'Auth\AuthController@logout')->name('logout')->middleware('auth');

// USER ROUTES
Route::middleware(['web', 'auth'])->prefix('home')->group(function() {

});

// ADMIN ROUTES
Route::middleware(['web', 'auth', 'admin'])->prefix('admin')->group(function () {
    Route::get('/', 'AdminController@index')->name('admin');
});
