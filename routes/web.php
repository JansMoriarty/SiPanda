<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\AskPandaController;
use Inertia\Inertia;

Route::get('/', [DocumentController::class, 'index'])->name('documents.index');
Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
Route::get('/ask-panda', [AskPandaController::class, 'index'])->name('ask-panda.index');
Route::post('/ask-panda', [AskPandaController::class, 'ask'])->name('ask-panda.ask');
Route::get('/settings', fn () => Inertia::render('Settings/Index'))->name('settings.index');
Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');