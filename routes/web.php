<?php

use Illuminate\Support\Facades\Route;

// Public pages
Route::view('/', 'pages.home')->name('home');
Route::view('/registration', 'pages.registration')->name('registration');
Route::view('/lookup', 'pages.lookup')->name('lookup');

// Admin pages
Route::view('/login', 'pages.login')->middleware('admin.guest')->name('login');
Route::view('/dashboard', 'pages.dashboard')->middleware('admin.page')->name('dashboard');
