<?php

namespace Tests\Feature;

use App\Models\AttemptAnswer;
use App\Models\Concept;
use App\Models\Course;
use App\Models\Document;
use App\Models\Question;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Materials/StudyPack sekarang membaca DB. Yang dijaga: isi study pack
 * (ringkasan, poin, konsep, quiz) selalu milik user yang login, dan
 * penguasaan per konsep dihitung dari attempt selesai milik user itu saja.
 */
class StudyPackPageTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Document}
     */
    private function document(string $label = 'a', array $overrides = []): array
    {
        $user = User::factory()->create();
        $course = Course::create([
            'user_id' => $user->id,
            'name' => "Kalkulus {$label}",
            'color' => '#465FFF',
        ]);

        $document = Document::create(array_merge([
            'course_id' => $course->id,
            'original_filename' => "bab-{$label}.pdf",
            'stored_filename' => "doc-{$label}.pdf",
            'file_type' => 'pdf',
            'file_size' => 2048,
            'page_count' => 12,
            'status' => 'processed',
            'study_pack_status' => 'ready',
            'summary' => 'Ringkasan bab.',
            'key_points' => ['Poin satu', 'Poin dua'],
        ], $overrides));

        return [$user, $document];
    }

    private function concept(Document $document, string $name, int $sortOrder, string $importance = 'high'): Concept
    {
        return Concept::create([
            'document_id' => $document->id,
            'name' => $name,
            'description' => "Deskripsi {$name}",
            'importance' => $importance,
            'sort_order' => $sortOrder,
        ]);
    }

    private function question(Document $document, Concept $concept): Question
    {
        return Question::create([
            'document_id' => $document->id,
            'concept_id' => $concept->id,
            'question' => "Soal {$concept->name}?",
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => 0,
            'explanation' => 'Karena A.',
        ]);
    }

    private function answeredAttempt(User $user, Document $document, array $answers): QuizAttempt
    {
        $attempt = QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $user->id,
            'total_questions' => count($answers),
            'correct_answers' => count(array_filter($answers)),
            'score' => count($answers) > 0 ? (int) round(count(array_filter($answers)) / count($answers) * 100) : 0,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        return $attempt;
    }

    public function test_guest_diarahkan_ke_login(): void
    {
        [$user, $document] = $this->document('a');
        $this->assertNotNull($user);

        $this->get(route('materials.study-pack', $document))->assertRedirect(route('login'));
    }

    public function test_show_mengirim_ringkasan_dan_poin_penting(): void
    {
        [$user, $document] = $this->document('a');

        $this->actingAs($user)
            ->get(route('materials.study-pack', $document))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Materials/StudyPack')
                ->where('pack.document.id', $document->id)
                ->where('pack.document.title', 'bab-a.pdf')
                ->where('pack.summary', 'Ringkasan bab.')
                ->has('pack.key_points', 2)
                ->where('pack.key_points.1', 'Poin dua')
                ->where('pack.quiz.total_questions', 0));
    }

    public function test_penguasaan_konsep_dihitung_dari_attempt_selesai(): void
    {
        [$user, $document] = $this->document('a');
        $limit = $this->concept($document, 'Limit', 1);
        $turunan = $this->concept($document, 'Turunan', 2, 'medium');

        $q1 = $this->question($document, $limit);
        $q2 = $this->question($document, $limit);
        $q3 = $this->question($document, $turunan);

        // Limit: 2 dijawab, 1 benar -> 50%. Turunan: 1 dijawab, 1 benar -> 100%.
        $attempt = $this->answeredAttempt($user, $document, [true, false, true]);

        foreach ([[$q1, true], [$q2, false], [$q3, true]] as [$question, $correct]) {
            AttemptAnswer::create([
                'quiz_attempt_id' => $attempt->id,
                'question_id' => $question->id,
                'selected_index' => $correct ? 0 : 1,
                'is_correct' => $correct,
            ]);
        }

        $this->actingAs($user)
            ->get(route('materials.study-pack', $document))
            ->assertInertia(fn (Assert $page) => $page
                ->where('pack.concepts.0.name', 'Limit')
                ->where('pack.concepts.0.mastery', 50)
                ->where('pack.concepts.1.name', 'Turunan')
                ->where('pack.concepts.1.mastery', 100)
                ->has('pack.quiz.covered_concepts', 2)
                ->where('pack.quiz.total_questions', 3));
    }

    public function test_konsep_tanpa_attempt_mastery_null(): void
    {
        [$user, $document] = $this->document('a');
        $this->concept($document, 'Integral', 1);

        $this->actingAs($user)
            ->get(route('materials.study-pack', $document))
            ->assertInertia(fn (Assert $page) => $page
                ->where('pack.concepts.0.name', 'Integral')
                ->where('pack.concepts.0.mastery', null));
    }

    public function test_skor_terbaik_dan_jumlah_percobaan_dari_attempt_selesai(): void
    {
        [$user, $document] = $this->document('a');

        foreach ([40, 80] as $score) {
            QuizAttempt::create([
                'document_id' => $document->id,
                'user_id' => $user->id,
                'total_questions' => 5,
                'correct_answers' => 0,
                'score' => $score,
                'started_at' => now(),
                'completed_at' => now(),
            ]);
        }

        // Belum selesai: tidak boleh dihitung.
        QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $user->id,
            'total_questions' => 5,
            'started_at' => now(),
        ]);

        $this->actingAs($user)
            ->get(route('materials.study-pack', $document))
            ->assertInertia(fn (Assert $page) => $page
                ->where('pack.quiz.best_score', 80)
                ->where('pack.quiz.attempts', 2));
    }

    public function test_attempt_user_lain_tidak_menghitung_penguasaan(): void
    {
        [$user, $document] = $this->document('a');
        $concept = $this->concept($document, 'Limit', 1);
        $question = $this->question($document, $concept);

        $other = User::factory()->create();
        $attempt = $this->answeredAttempt($other, $document, [true]);
        AttemptAnswer::create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'selected_index' => 0,
            'is_correct' => true,
        ]);

        $this->actingAs($user)
            ->get(route('materials.study-pack', $document))
            ->assertInertia(fn (Assert $page) => $page
                ->where('pack.concepts.0.mastery', null)
                ->where('pack.quiz.best_score', null)
                ->where('pack.quiz.attempts', 0));
    }

    public function test_menolak_dokumen_orang_lain(): void
    {
        [, $document] = $this->document('a');
        $other = User::factory()->create();

        $this->actingAs($other)
            ->get(route('materials.study-pack', $document))
            ->assertForbidden();
    }

    public function test_dokumen_tanpa_isi_tetap_merender_halaman(): void
    {
        [$user, $document] = $this->document('a', [
            'summary' => null,
            'key_points' => null,
        ]);

        $this->actingAs($user)
            ->get(route('materials.study-pack', $document))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Materials/StudyPack')
                ->where('pack.summary', null)
                ->where('pack.concepts', [])
                ->where('pack.quiz.total_questions', 0));
    }
}
