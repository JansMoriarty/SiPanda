<?php

namespace Tests\Feature;

use App\Models\Concept;
use App\Models\Course;
use App\Models\Document;
use App\Models\Flashcard;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Alur menandai kartu belajar lewat HTTP. Menegaskan satu baris per (user, kartu),
 * menandai ulang meng-update bukan menggandakan, dan akses di-scope lewat
 * flashcard -> document -> course.user_id.
 */
class FlashcardFlowTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Flashcard}
     */
    private function flashcardFor(?User $owner = null): array
    {
        $owner ??= User::factory()->create();

        $course = Course::create([
            'user_id' => $owner->id,
            'name' => 'Kalkulus',
            'color' => '#0c9c8f',
        ]);

        $document = Document::create([
            'course_id' => $course->id,
            'original_filename' => 'bab1.pdf',
            'stored_filename' => 'doc_test.pdf',
            'file_type' => 'pdf',
            'file_size' => 1024,
            'status' => 'processed',
        ]);

        $concept = Concept::create([
            'document_id' => $document->id,
            'name' => 'Limit',
            'sort_order' => 0,
        ]);

        $flashcard = Flashcard::create([
            'document_id' => $document->id,
            'concept_id' => $concept->id,
            'front' => 'Apa itu limit?',
            'back' => 'Nilai yang didekati.',
            'sort_order' => 0,
        ]);

        return [$owner, $flashcard];
    }

    public function test_guest_diarahkan_ke_login(): void
    {
        [, $flashcard] = $this->flashcardFor();

        $this->post(route('flashcards.review', $flashcard), ['known' => true])
            ->assertRedirect(route('login'));
    }

    public function test_menandai_kartu_membuat_satu_baris_review(): void
    {
        [$user, $flashcard] = $this->flashcardFor();

        $this->actingAs($user)
            ->post(route('flashcards.review', $flashcard), ['known' => true])
            ->assertRedirect();

        $this->assertDatabaseCount('flashcard_reviews', 1);
        $this->assertDatabaseHas('flashcard_reviews', [
            'user_id' => $user->id,
            'flashcard_id' => $flashcard->id,
            'known' => true,
        ]);
    }

    public function test_menandai_ulang_mengupdate_bukan_menggandakan(): void
    {
        [$user, $flashcard] = $this->flashcardFor();

        $this->actingAs($user)->post(route('flashcards.review', $flashcard), ['known' => true]);
        $this->actingAs($user)->post(route('flashcards.review', $flashcard), ['known' => false]);

        $this->assertDatabaseCount('flashcard_reviews', 1);
        $this->assertDatabaseHas('flashcard_reviews', [
            'user_id' => $user->id,
            'flashcard_id' => $flashcard->id,
            'known' => false,
        ]);
    }

    public function test_known_wajib_boolean(): void
    {
        [$user, $flashcard] = $this->flashcardFor();

        $this->actingAs($user)
            ->post(route('flashcards.review', $flashcard), ['known' => 'bukan-boolean'])
            ->assertSessionHasErrors('known');

        $this->assertDatabaseCount('flashcard_reviews', 0);
    }

    public function test_tidak_bisa_menandai_kartu_orang_lain(): void
    {
        [, $flashcard] = $this->flashcardFor();
        $other = User::factory()->create();

        $this->actingAs($other)
            ->post(route('flashcards.review', $flashcard), ['known' => true])
            ->assertForbidden();

        $this->assertDatabaseCount('flashcard_reviews', 0);
    }
}
