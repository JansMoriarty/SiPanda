<?php

namespace App\Http\Controllers;

use App\Models\Flashcard;
use App\Models\FlashcardReview;
use Illuminate\Http\Request;

/**
 * Menandai satu kartu belajar sebagai "sudah dikuasai" atau "perlu diulang".
 *
 * Kepemilikan dicek lewat flashcard -> document -> course.user_id, sama seperti
 * halaman user lain: documents tidak punya user_id sendiri. Satu baris per
 * (user, kartu), jadi menandai ulang cukup meng-update.
 */
class FlashcardReviewController extends Controller
{
    public function store(Request $request, Flashcard $flashcard)
    {
        $this->authorizeOwnership($request, $flashcard);

        $data = $request->validate([
            'known' => 'required|boolean',
        ]);

        FlashcardReview::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'flashcard_id' => $flashcard->id,
            ],
            [
                'known' => (bool) $data['known'],
                'reviewed_at' => now(),
            ]
        );

        return redirect()->back();
    }

    private function authorizeOwnership(Request $request, Flashcard $flashcard): void
    {
        $flashcard->loadMissing('document.course');

        abort_unless(
            $flashcard->document
                && $flashcard->document->course
                && $flashcard->document->course->user_id === $request->user()->id,
            403
        );
    }
}
