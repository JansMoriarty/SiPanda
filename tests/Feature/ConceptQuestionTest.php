<?php

namespace Tests\Feature;

use App\Models\Concept;
use App\Models\Course;
use App\Models\Document;
use App\Models\Question;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Skema konsep & soal untuk V2. Yang dikunci di sini adalah kawat relasi
 * dan perilaku FK, bukan isi AI: konsep/soal selalu menempel ke satu
 * document (sehingga scoping ke user nanti lewat document.course.user_id),
 * dan menghapus document membersihkan turunannya. Concept adalah induk soal
 * (FK cascade, NOT NULL), jadi menghapus concept juga menghapus soalnya.
 */
class ConceptQuestionTest extends TestCase
{
    use RefreshDatabase;

    private function document(array $attributes = []): Document
    {
        $user = User::factory()->create();
        $course = Course::create([
            'user_id' => $user->id,
            'name' => 'Kalkulus',
            'color' => '#0c9c8f',
        ]);

        return Document::create(array_merge([
            'course_id' => $course->id,
            'original_filename' => 'bab1.pdf',
            'stored_filename' => 'doc_test.pdf',
            'file_type' => 'pdf',
            'file_size' => 1024,
            'status' => 'processed',
        ], $attributes));
    }

    private function concept(Document $document, array $attributes = []): Concept
    {
        return Concept::create(array_merge([
            'document_id' => $document->id,
            'name' => 'Limit',
        ], $attributes));
    }

    private function question(Document $document, Concept $concept, array $attributes = []): Question
    {
        return Question::create(array_merge([
            'document_id' => $document->id,
            'concept_id' => $concept->id,
            'question' => 'Apa itu limit?',
            'options' => ['A', 'B', 'C', 'D'],
            'correct_index' => 2,
            'explanation' => 'Limit adalah nilai yang didekati.',
            'source_label' => 'Slide 4',
        ], $attributes));
    }

    public function test_concept_dan_question_terhubung_dua_arah(): void
    {
        $document = $this->document();
        $concept = $this->concept($document, ['description' => 'Konsep dasar limit']);
        $question = $this->question($document, $concept);

        $this->assertTrue($concept->document->is($document));
        $this->assertTrue($document->concepts->contains($concept));
        $this->assertTrue($document->questions->contains($question));
        $this->assertTrue($question->concept->is($concept));
        $this->assertTrue($concept->questions->contains($question));
        $this->assertSame('Konsep dasar limit', $concept->description);
    }

    public function test_options_di_cast_ke_array_dan_is_correct(): void
    {
        $document = $this->document();
        $concept = $this->concept($document);
        $question = $this->question($document, $concept, [
            'options' => ['A', 'B', 'C'],
            'correct_index' => 1,
        ]);

        $this->assertSame(['A', 'B', 'C'], $question->fresh()->options);
        $this->assertTrue($question->fresh()->isCorrect(1));
        $this->assertFalse($question->fresh()->isCorrect(0));
        $this->assertSame($concept->id, $question->fresh()->concept_id);
    }

    public function test_importance_default_medium_dan_sort_order_default_nol(): void
    {
        $document = $this->document();
        $concept = $this->concept($document, ['name' => 'Turunan']);

        $this->assertSame('medium', $concept->fresh()->importance);
        $this->assertSame(0, $concept->fresh()->sort_order);

        $concept->update(['importance' => 'high']);
        $this->assertSame('high', $concept->fresh()->importance);
    }

    public function test_key_points_di_cast_array_dan_study_pack_status_default_null(): void
    {
        $document = $this->document([
            'key_points' => ['Limit', 'Turunan'],
        ]);

        $this->assertSame(['Limit', 'Turunan'], $document->fresh()->key_points);
        $this->assertNull($document->fresh()->study_pack_status);
        $this->assertNull($document->fresh()->study_pack_generated_at);
    }

    public function test_hapus_document_menghapus_concept_dan_question(): void
    {
        $document = $this->document();
        $concept = $this->concept($document, ['name' => 'Integral']);
        $this->question($document, $concept);

        $document->delete();

        $this->assertDatabaseCount('concepts', 0);
        $this->assertDatabaseCount('questions', 0);
    }

    public function test_hapus_concept_menghapus_question(): void
    {
        $document = $this->document();
        $concept = $this->concept($document, ['name' => 'Trigonometri']);
        $this->question($document, $concept);

        $concept->delete();

        $this->assertDatabaseCount('concepts', 0);
        $this->assertDatabaseCount('questions', 0);
    }

    public function test_unique_concept_name_per_document_menolak_duplikat(): void
    {
        $document = $this->document();
        $this->concept($document, ['name' => 'Matriks']);

        $this->expectException(QueryException::class);

        $this->concept($document, ['name' => 'Matriks']);
    }
}
