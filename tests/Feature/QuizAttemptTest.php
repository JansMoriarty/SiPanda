<?php

namespace Tests\Feature;

use App\Models\AttemptAnswer;
use App\Models\Concept;
use App\Models\Course;
use App\Models\Document;
use App\Models\Question;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Skema quiz: attempt milik (document, user), setiap jawaban menunjuk satu
 * question milik attempt tersebut (unik). Dipakai untuk Quiz, Knowledge Gap,
 * dan Progress. Karena itu FK dirantai: hapus document/user/question ikut
 * membersihkan attempt & jawaban yang menggantung.
 */
class QuizAttemptTest extends TestCase
{
    use RefreshDatabase;

    private function document(): Document
    {
        $user = User::factory()->create();
        $course = Course::create([
            'user_id' => $user->id,
            'name' => 'Kalkulus',
            'color' => '#0c9c8f',
        ]);

        return Document::create([
            'course_id' => $course->id,
            'original_filename' => 'bab1.pdf',
            'stored_filename' => 'doc_test.pdf',
            'file_type' => 'pdf',
            'file_size' => 1024,
            'status' => 'processed',
        ]);
    }

    private function concept(Document $document, string $name = 'Limit'): Concept
    {
        return Concept::create(['document_id' => $document->id, 'name' => $name]);
    }

    private function question(Document $document, Concept $concept): Question
    {
        return Question::create([
            'document_id' => $document->id,
            'concept_id' => $concept->id,
            'question' => 'Apa itu limit?',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => 1,
            'explanation' => 'Karena ...',
        ]);
    }

    private function attempt(Document $document): QuizAttempt
    {
        return QuizAttempt::create([
            'document_id' => $document->id,
            'user_id' => $document->course->user_id,
            'total_questions' => 1,
            'correct_answers' => 1,
            'score' => 100,
            'started_at' => now(),
            'completed_at' => now(),
        ]);
    }

    public function test_relasi_dua_arah_attempt_dan_answer(): void
    {
        $document = $this->document();
        $question = $this->question($document, $this->concept($document));
        $attempt = $this->attempt($document);

        $answer = AttemptAnswer::create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'selected_index' => 1,
            'is_correct' => true,
        ]);

        $this->assertTrue($attempt->document->is($document));
        $this->assertTrue($attempt->user->is($document->course->user));
        $this->assertTrue($attempt->answers->contains($answer));
        $this->assertTrue($document->quizAttempts->contains($attempt));
        $this->assertTrue($document->course->user->quizAttempts->contains($attempt));
        $this->assertTrue($answer->attempt->is($attempt));
        $this->assertTrue($answer->question->is($question));
        $this->assertTrue($question->attemptAnswers->contains($answer));
    }

    public function test_skor_di_cast_integer_dan_waktu_datetime(): void
    {
        $document = $this->document();
        $attempt = $this->attempt($document);

        $this->assertSame(100, $attempt->fresh()->score);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $attempt->fresh()->completed_at);
    }

    public function test_selected_index_null_saat_soal_dilewati(): void
    {
        $document = $this->document();
        $question = $this->question($document, $this->concept($document));
        $attempt = $this->attempt($document);

        $answer = AttemptAnswer::create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $question->id,
        ]);

        $this->assertNull($answer->fresh()->selected_index);
        $this->assertFalse($answer->fresh()->is_correct);
    }

    public function test_hapus_document_menghapus_attempt_dan_answer(): void
    {
        $document = $this->document();
        $question = $this->question($document, $this->concept($document));
        $attempt = $this->attempt($document);
        AttemptAnswer::create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'is_correct' => true,
        ]);

        $document->delete();

        $this->assertDatabaseCount('quiz_attempts', 0);
        $this->assertDatabaseCount('attempt_answers', 0);
    }

    public function test_hapus_user_menghapus_attempt(): void
    {
        $document = $this->document();
        $question = $this->question($document, $this->concept($document));
        $attempt = $this->attempt($document);
        AttemptAnswer::create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $question->id,
        ]);

        $document->course->user->delete();

        $this->assertDatabaseCount('quiz_attempts', 0);
        $this->assertDatabaseCount('attempt_answers', 0);
    }

    public function test_hapus_question_menghapus_answer(): void
    {
        $document = $this->document();
        $question = $this->question($document, $this->concept($document));
        $attempt = $this->attempt($document);
        AttemptAnswer::create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $question->id,
        ]);

        $question->delete();

        $this->assertDatabaseCount('quiz_attempts', 1);
        $this->assertDatabaseCount('attempt_answers', 0);
    }

    public function test_satu_question_hanya_sekali_per_attempt(): void
    {
        $document = $this->document();
        $question = $this->question($document, $this->concept($document));
        $attempt = $this->attempt($document);

        AttemptAnswer::create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'selected_index' => 1,
        ]);

        $this->expectException(QueryException::class);

        AttemptAnswer::create([
            'quiz_attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'selected_index' => 2,
        ]);
    }
}
