<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Document;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Services\Admin\OnlineUsers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Manajemen user (lintas-user, di balik middleware `admin`).
 *
 * Aksi berbahaya dijaga: admin tidak bisa menurunkan/menonaktifkan/menghapus
 * akunnya sendiri, dan sistem selalu menyisakan minimal satu admin.
 */
class UserController extends Controller
{
    public function index(Request $request, OnlineUsers $online)
    {
        $search = trim((string) $request->query('q', ''));
        $role = (string) $request->query('role', '');
        $status = (string) $request->query('status', '');

        $users = User::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when(in_array($role, [User::ROLE_ADMIN, User::ROLE_STUDENT], true), fn ($q) => $q->where('role', $role))
            ->when($status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->withCount(['courses', 'quizAttempts'])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $onlineIds = $online->ids()->all();

        $users->through(fn (User $user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => (bool) $user->is_active,
            'courses_count' => $user->courses_count,
            'quiz_attempts_count' => $user->quiz_attempts_count,
            'is_online' => in_array($user->id, $onlineIds, true),
            'created_at' => $user->created_at?->toISOString(),
            'last_login_at' => $user->last_login_at?->toISOString(),
        ]);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'q' => $search,
                'role' => in_array($role, [User::ROLE_ADMIN, User::ROLE_STUDENT], true) ? $role : 'all',
                'status' => in_array($status, ['active', 'inactive'], true) ? $status : 'all',
            ],
            'counts' => [
                'total' => User::count(),
                'admins' => User::where('role', User::ROLE_ADMIN)->count(),
                'inactive' => User::where('is_active', false)->count(),
            ],
        ]);
    }

    public function show(Request $request, User $user)
    {
        $courseIds = $user->courses()->pluck('id');

        $documents = Document::query()->whereIn('course_id', $courseIds);

        $completed = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->whereNotNull('completed_at');

        $quizzesTaken = (clone $completed)->count();

        $courses = $user->courses()
            ->withCount('documents')
            ->orderBy('name')
            ->get(['id', 'name', 'color'])
            ->map(fn (Course $course) => [
                'id' => $course->id,
                'name' => $course->name,
                'color' => $course->color,
                'documents_count' => $course->documents_count,
            ]);

        $recentAttempts = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->whereNotNull('completed_at')
            ->with('document:id,original_filename')
            ->latest('completed_at')
            ->limit(5)
            ->get()
            ->map(fn (QuizAttempt $attempt) => [
                'id' => $attempt->id,
                'document' => $attempt->document?->original_filename,
                'score' => $attempt->score ?? 0,
                'correct' => $attempt->correct_answers,
                'total' => $attempt->total_questions,
                'completed_at' => $attempt->completed_at?->toISOString(),
            ])
            ->values();

        return Inertia::render('Admin/Users/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'role' => $user->role,
                'is_active' => (bool) $user->is_active,
                'created_at' => $user->created_at?->toISOString(),
                'last_login_at' => $user->last_login_at?->toISOString(),
            ],
            'stats' => [
                'courses' => $courses->count(),
                'documents' => (clone $documents)->count(),
                'study_packs_ready' => (clone $documents)->where('study_pack_status', 'ready')->count(),
                'quizzes_taken' => $quizzesTaken,
                'average_score' => $quizzesTaken > 0
                    ? (int) round((clone $completed)->avg('score'))
                    : null,
            ],
            'courses' => $courses,
            'recent_attempts' => $recentAttempts,
            'is_self' => $request->user()->id === $user->id,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_STUDENT])],
            'is_active' => ['required', 'boolean'],
        ]);

        $isSelf = $user->id === $request->user()->id;

        if ($isSelf && ($validated['role'] !== User::ROLE_ADMIN || ! $validated['is_active'])) {
            return back()->withErrors(['role' => 'Kamu tidak bisa menurunkan atau menonaktifkan akunmu sendiri.']);
        }

        if (! $isSelf
            && $user->isAdmin()
            && $validated['role'] !== User::ROLE_ADMIN
            && User::where('role', User::ROLE_ADMIN)->count() <= 1) {
            return back()->withErrors(['role' => 'Minimal harus ada satu admin yang tersisa.']);
        }

        $user->forceFill([
            'role' => $validated['role'],
            'is_active' => (bool) $validated['is_active'],
        ])->save();

        // Kalau dinonaktifkan, putuskan sesinya supaya langsung ter-logout.
        if (! (bool) $validated['is_active']) {
            DB::table('sessions')->where('user_id', $user->id)->delete();
        }

        return back()->with('success', 'Data user diperbarui.');
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return back()->withErrors(['user' => 'Kamu tidak bisa menghapus akunmu sendiri.']);
        }

        if ($user->isAdmin() && User::where('role', User::ROLE_ADMIN)->count() <= 1) {
            return back()->withErrors(['user' => 'Minimal harus ada satu admin yang tersisa.']);
        }

        // documents.course_id = nullOnDelete, jadi dokumen user harus dihapus
        // manual dulu supaya tidak jadi yatim (tak terlihat oleh siapa pun).
        $documents = Document::query()
            ->whereIn('course_id', $user->courses()->pluck('id'))
            ->get();

        foreach ($documents as $document) {
            Storage::delete('documents/' . $document->stored_filename);
            $document->delete(); // concepts/questions/chunks ikut cascade
        }

        DB::table('sessions')->where('user_id', $user->id)->delete();

        $user->delete(); // courses + quiz_attempts ikut cascade

        return redirect()->route('admin.users.index')->with('success', 'User dihapus.');
    }
}
