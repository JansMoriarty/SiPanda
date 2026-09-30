import { buildCourseGap, masteryOf } from "@/utils/gap";

/**
 * Personalized Practice adalah konsumen dari Knowledge Gap. Halaman ini
 * tidak mencari sendiri konsep mana yang lemah, tapi memakai hasil yang
 * sama dengan halaman Progress (buildCourseGap) supaya tidak ada dua
 * definisi "kONSEP lemah" yang bisa berbeda.
 *
 * Bentuk query aslinya nanti kira-kira begini, untuk concept weak milik
 * satu course milik user yang sedang login:
 *
 *   SELECT questions.* FROM questions
 *    WHERE questions.concept_id IN (
 *          concept weak dari attempt_answers JOIN questions, dibatasi
 *          user_id + course_id
 *    )
 *    ORDER BY questions.difficulty
 *
 * `bank` di sini menggantikan tabel questions khusus soal latihan. Bank itu
 * sengaja terpisah dari registry questions milik Knowledge Gap, supaya
 * menjawab latihan tidak mengubah satu pun angka di halaman Progress.
 */

const DEFAULT_PER_CONCEPT = 3;
const DEFAULT_PASSING_SCORE = 70;

/** Konsep lemah pada satu course, terlemah dulu (urutan dari gap). */
export const weakConceptsFor = ({ course, attempts = [], questions = [], concepts = [] }) =>
    buildCourseGap({ course, attempts, questions, concepts }).concepts.filter((row) => row.needs_practice);

/**
 * Sesi latihan untuk satu course: hanya soal dari konsep yang lemah.
 *
 * Konsep yang lemah tapi belum punya soal di bank dilaporkan di
 * `missing_concepts`, bukan diam-diam jadi sesi kosong.
 */
export const buildPracticeSession = ({
    course,
    attempts = [],
    questions = [],
    concepts = [],
    bank = [],
    perConcept = DEFAULT_PER_CONCEPT,
    passing_score = DEFAULT_PASSING_SCORE,
}) => {
    const weak = weakConceptsFor({ course, attempts, questions, concepts });
    const courseId = course?.id;
    const picked = [];
    const missing = [];

    for (const concept of weak) {
        // Bank ikut di-scope per course, jadi concept_id yang sama di course
        // lain tidak ikut terbawa.
        const pool = bank.filter((q) => q.course_id === courseId && q.concept_id === concept.concept_id);
        if (pool.length === 0) {
            missing.push(concept);
            continue;
        }
        picked.push(
            ...pool.slice(0, perConcept).map((q, i) => ({
                id: q.id,
                concept: q.concept_id,
                concept_name: concept.name,
                question: q.question,
                options: q.options,
                correct_index: q.correct_index,
                explanation: q.explanation,
                // Nomor urut di dalam konsep, bukan di seluruh sesi.
                concept_question_number: i + 1,
            }))
        );
    }

    return {
        id: `practice-${courseId}`,
        kind: 'practice',
        course,
        concepts: weak,
        questions: picked,
        total_questions: picked.length,
        per_concept: perConcept,
        passing_score,
        missing_concepts: missing,
        can_start: weak.length > 0 && picked.length > 0,
    };
};

/** Hasil satu sesi latihan, dihitung per konsep seperti halaman Quiz. */
export const buildPracticeResult = ({ session, answers = [], completed_at = null }) => {
    const total = answers.length;
    const correct = answers.filter((a) => a.correct).length;
    const score = masteryOf(correct, total);

    const byConcept = new Map();
    for (const answer of answers) {
        const bucket = byConcept.get(answer.concept) ?? { total: 0, correct: 0 };
        bucket.total += 1;
        if (answer.correct) bucket.correct += 1;
        byConcept.set(answer.concept, bucket);
    }

    const breakdown = [...byConcept.entries()]
        .map(([concept_id, v]) => {
            const concept = session.concepts.find((c) => c.concept_id === concept_id);
            return {
                concept_id,
                name: concept?.name ?? concept_id,
                total: v.total,
                correct: v.correct,
                score: masteryOf(v.correct, v.total),
                // Mastery sebelum latihan, supaya kelihatan apakah hasil
                // membaik. Null kalau konsepnya belum pernah diuji.
                mastery_before: concept?.mastery ?? null,
            };
        })
        .sort((a, b) => a.score - b.score);

    return {
        session_id: session.id,
        kind: 'practice',
        course_id: session.course?.id ?? null,
        course_name: session.course?.name ?? null,
        total,
        correct,
        score,
        passing_score: session.passing_score,
        completed_at,
        answers,
        breakdown,
    };
};
