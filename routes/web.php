<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\AskPandaController;
use App\Http\Controllers\Auth\ProfileAvatarController;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::get('/', [DocumentController::class, 'index'])->name('documents.index');
    Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
    Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
    Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
    Route::get('/ask-panda', [AskPandaController::class, 'index'])->name('ask-panda.index');
    Route::post('/ask-panda', [AskPandaController::class, 'ask'])->name('ask-panda.ask');
    Route::get('/settings', fn() => Inertia::render('Settings/Index'))->name('settings.index');
    Route::post('/profile/avatar', [ProfileAvatarController::class, 'store'])->name('profile.avatar.store');
    Route::delete('/profile/avatar', [ProfileAvatarController::class, 'destroy'])->name('profile.avatar.destroy');

    /*
    |--------------------------------------------------------------------------
    | SiPanda V2 (UI shell — mock data, belum menyentuh DB)
    |--------------------------------------------------------------------------
    | Route di bawah hanya merender halaman dengan data statis supaya UI V2
    | bisa di-review dulu (prinsip "UI First" di AGENTS.md). Belum ada query
    | ke documents/chunks/concepts, jadi tidak ada risiko scoping di sini.
    |
    | Catatan: '/' tetap documents.index (V1) dan TIDAK digantikan /materials.
    |
    | TODO V2: ganti closure Inertia::render di bawah dengan controller
    | sungguhan yang sudah di-scope lewat course.user_id.
    */
    Route::get('/dashboard', fn() => Inertia::render('Dashboard'))->name('dashboard');
    Route::get('/materials', fn() => Inertia::render('Materials/Index'))->name('materials.index');
    Route::get('/progress', fn() => Inertia::render('Progress/Index'))->name('progress');
    Route::get('/documents/{document}', fn() => Inertia::render('Materials/Show'))->name('materials.show');
    Route::get('/documents/{document}/study-pack', fn() => Inertia::render('Materials/StudyPack'))->name('materials.study-pack');
    Route::get('/documents/{document}/quiz', fn() => Inertia::render('Quiz/Index'))->name('materials.quiz');
    Route::get('/quiz/{attempt}/results', fn() => Inertia::render('Quiz/Results'))->name('quiz.results');
});

require __DIR__ . '/auth.php';