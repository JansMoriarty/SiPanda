<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\PracticeController;
use App\Http\Controllers\MaterialsController;
use App\Http\Controllers\StudyPackController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AskPandaController;
use App\Http\Controllers\Auth\ProfileAvatarController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\LlmUsageController as AdminLlmUsageController;
use App\Http\Controllers\Admin\OnlineController as AdminOnlineController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use Inertia\Inertia;

Route::middleware(['auth', 'student'])->group(function () {
    // '/' adalah halaman utama V2. Dulu ini halaman "Documents" terpisah (V1),
    // sekarang disatukan: keduanya merender Materials/Index.
    Route::get('/', [MaterialsController::class, 'index'])->name('home');
    Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
    Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
    Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
    Route::get('/ask-panda', [AskPandaController::class, 'index'])->name('ask-panda.index');
    Route::post('/ask-panda', [AskPandaController::class, 'ask'])->name('ask-panda.ask');
    Route::get('/settings', fn() => Inertia::render('Settings/Index'))->name('settings.index');
    Route::get('/pricing', fn() => Inertia::render('Pricing/Index'))->name('pricing.index');

    /*
    |--------------------------------------------------------------------------
    | Profile
    |--------------------------------------------------------------------------
    | Halaman ini mencampur identitas + statistik, jadi batasnya ditulis di sini:
    |
    | - Identitas (nama/email/foto) diambil dari auth.user yang sudah di-share
    |   HandleInertiaRequests, dan aksi avatar memakai route di bawah yang
    |   benar-benar menulis ke storage.
    | - Statistik belajar (streak, penguasaan per mata kuliah, riwayat quiz)
    |   diambil dari controller yang membaca DB lewat course.user_id, memakai
    |   ProgressData yang sama dengan Progress/Dashboard.
    */
    Route::get('/profile', [ProfileController::class, 'index'])->name('profile.index');
    Route::post('/profile/avatar', [ProfileAvatarController::class, 'store'])->name('profile.avatar.store');
    Route::delete('/profile/avatar', [ProfileAvatarController::class, 'destroy'])->name('profile.avatar.destroy');

    /*
    |--------------------------------------------------------------------------
    | SiPanda V2
    |--------------------------------------------------------------------------
    | Semua halaman V2 (dashboard, materials, study pack, quiz, progress,
    | practice, profile) sudah tersambung ke controller nyata yang membaca DB.
    | Tidak ada lagi halaman V2 yang memakai data mock.
    |
    | Query yang menyentuh documents/concepts/questions/attempts WAJIB lewat
    | course.user_id = auth()->id(); documents tidak punya user_id sendiri.
    |
    | Catatan: halaman "Documents" V1 sudah dilebur ke Materials. '/' dan
    | '/materials' sama-sama merender Materials/Index.
    */
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/materials', [MaterialsController::class, 'index'])->name('materials.index');
    Route::get('/progress', [ProgressController::class, 'index'])->name('progress');
    Route::get('/documents/{document}', [MaterialsController::class, 'show'])->name('materials.show');
    Route::post('/documents/{document}/study-pack', [MaterialsController::class, 'generateStudyPack'])->name('materials.study-pack.generate');
    Route::get('/documents/{document}/study-pack', [StudyPackController::class, 'show'])->name('materials.study-pack');
    Route::get('/documents/{document}/quiz', [QuizController::class, 'start'])->name('materials.quiz');
    Route::post('/quiz/{attempt}/submit', [QuizController::class, 'submit'])->name('materials.quiz.submit');
    Route::get('/quiz/{attempt}/results', [QuizController::class, 'results'])->name('quiz.results');

    /*
    | Personalized Practice disusun dari konsep lemah per course. Controller
    | menolak course yang bukan milik user yang sedang login (403), bukan
    | sekadar "tidak ditemukan".
    */
    Route::get('/practice/{course}', [PracticeController::class, 'show'])->name('practice.show');
});

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
| Area admin sengaja lintas-user. Dikunci oleh middleware `admin` (based on
| users.role) di atas middleware `auth`. Jangan pasang route student di sini.
*/
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');

    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::get('/users/{user}', [AdminUserController::class, 'show'])->name('users.show');
    Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');

    Route::get('/online', [AdminOnlineController::class, 'index'])->name('online.index');
    Route::delete('/online/{user}', [AdminOnlineController::class, 'destroy'])->name('online.destroy');

    Route::get('/llm-usage', [AdminLlmUsageController::class, 'index'])->name('llm-usage.index');
});

require __DIR__ . '/auth.php';