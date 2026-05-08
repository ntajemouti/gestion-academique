<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        "app" => "MyISTA Backend",
        "framework" => "Laravel",
        "status" => "running",
        "author" => "Najlae",
        "version" => "1.0"
    ]);
});