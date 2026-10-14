<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Services\Admin\OnlineUsers;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

/**
 * Ringkasan lintas-user untuk admin. Semua query di sini memang sengaja
 * membaca data seluruh user (di balik middleware `admin`), berbeda dengan
 * controller student yang selalu di-scope lewat course.user_id.
 */
class DashboardController extends Controller
{
    public function index(OnlineUsers $online)
    {
        $weekAgo = Carbon::now()->subDays(7);

        $completed = QuizAttempt::query()->whereNotNull('completed_at');
        $quizzesTaken = (clone $completed)->count();

        $documentsByStatus = Document::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_users' => User::count(),
                'new_users_7d' => User::where('created_at', '>=', $weekAgo)->count(),
                'active_users_7d' => User::where('last_login_at', '>=', $weekAgo)->count(),
                'inactive_users' => User::where('is_active', false)->count(),
                'online_now' => $online->count(),
                'total_documents' => Document::count(),
                'documents_failed' => (int) ($documentsByStatus['failed'] ?? 0),
                'study_packs_ready' => Document::where('study_pack_status', 'ready')->count(),
                'quizzes_taken' => $quizzesTaken,
                'average_score' => $quizzesTaken > 0
                    ? (int) round((clone $completed)->avg('score'))
                    : null,
            ],
            'document_status' => [
                'uploaded' => (int) ($documentsByStatus['uploaded'] ?? 0),
                'processing' => (int) ($documentsByStatus['processing'] ?? 0),
                'processed' => (int) ($documentsByStatus['processed'] ?? 0),
                'failed' => (int) ($documentsByStatus['failed'] ?? 0),
            ],
            'recent_users' => User::latest()
                ->limit(5)
                ->get(['id', 'name', 'email', 'role', 'is_active', 'created_at', 'last_login_at'])
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_active' => (bool) $user->is_active,
                    'created_at' => $user->created_at?->toISOString(),
                    'last_login_at' => $user->last_login_at?->toISOString(),
                ])
                ->values(),
        ]);
    }
}
