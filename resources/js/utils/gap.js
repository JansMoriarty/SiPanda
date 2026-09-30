import { WEAK_THRESHOLD } from "@/utils/format";

/**
 * Knowledge Gap dihitung per mata kuliah, bukan dijumlahkan dari semua
 * dokumen milik user. Bentuk data mock di mockV2.js sengaja meniru tabel
 * yang sudah diputuskan supaya query aslinya tinggal diimplementasikan di
 * lapisan yang sama:
 *
 *   attempt_answers
 *     JOIN questions ON questions.id = attempt_answers.question_id
 *    WHERE attempt_answers.attempt_id IN (
 *              SELECT id FROM quiz_attempts
 *               WHERE user_id = ? AND course_id = ?
 *            )
 *   GROUP BY questions.concept_id
 *
 * Karena itu koreksi dihitung per baris jawaban, bukan per soal: kalau
 * satu konsep diuji di tiga quiz, ketiganya ikut dihitung, dan konsep
 * yang belum pernah dijawab tidak diberi angka 0 karang.
 */

/** Persentase benar. Jawaban 0 tidak dipaksa jadi 0% agar tidak Miracle. */
export const masteryOf = (correct, answered) =>
    answered > 0 ? Math.round((correct / answered) * 100) : 0;

export const isWeakMastery = (mastery) => mastery < WEAK_THRESHOLD;

/** Terlemah dulu. Konsep yang belum diuji ditaruh paling akhir, bukan di 0%. */
const byGap = (a, b) => {
    if (a.untested !== b.untested) return a.untested ? 1 : -1;
    if (a.mastery !== b.mastery) return a.mastery - b.mastery;
    return a.name.localeCompare(b.name);
};

/**
 * Agregasi satu mata kuliah.
 *
 * @param course   course yang jadi scope; semua answer dari course lain
 *                 diabaikan, sama seperti WHERE course_id di query asli.
 * @param attempts baris quiz_attempts (satu per percobaan).
 * @param questions baris questions (concept_id per soal).
 * @param concepts baris concepts milik course tersebut.
 */
export const buildCourseGap = ({ course, attempts = [], questions = [], concepts = [] }) => {
    const courseId = course?.id;
    const questionById = new Map(questions.map((q) => [q.id, q]));
    const bucketByConcept = new Map();
    const quizIds = new Set();
    let correct = 0;
    let answered = 0;

    for (const attempt of attempts) {
        if (courseId !== undefined && attempt.course_id !== courseId) continue;
        quizIds.add(attempt.quiz_id);
        for (const answer of attempt.answers ?? []) {
            const question = questionById.get(answer.question_id);
            if (!question) continue;
            if (question.course_id !== courseId) continue;
            const bucket = bucketByConcept.get(question.concept_id) ?? { correct: 0, answered: 0, attempts: 0 };
            bucket.answered += 1;
            bucket.attempts += 1;
            if (answer.correct) {
                bucket.correct += 1;
                correct += 1;
            }
            answered += 1;
            bucketByConcept.set(question.concept_id, bucket);
        }
    }

    const courseConcepts = concepts.filter((c) => c.course_id === courseId);
    const rows = courseConcepts.map((concept) => {
        const bucket = bucketByConcept.get(concept.id);
        const untested = !bucket;
        return {
            concept_id: concept.id,
            name: concept.name,
            description: concept.description ?? null,
            importance: concept.importance ?? null,
            correct: bucket?.correct ?? 0,
            answered: bucket?.answered ?? 0,
            attempts: bucket?.attempts ?? 0,
            mastery: untested ? null : masteryOf(bucket.correct, bucket.answered),
            untested,
            needs_practice: !untested && isWeakMastery(masteryOf(bucket.correct, bucket.answered)),
        };
    });

    rows.sort(byGap);

    return {
        course,
        attempt_count: attempts.filter((a) => courseId === undefined || a.course_id === courseId).length,
        quiz_count: quizIds.size,
        answered,
        correct,
        mastery: masteryOf(correct, answered),
        weak_count: rows.filter((r) => r.needs_practice).length,
        tested_count: rows.filter((r) => !r.untested).length,
        concepts: rows,
    };
};

/** Ringkasan per course untuk baris filter, termasuk course tanpa attempt. */
export const buildCourseGapSummaries = ({ courses = [], attempts = [], questions = [], concepts = [] }) =>
    courses.map((course) => {
        const gap = buildCourseGap({ course, attempts, questions, concepts });
        return {
            course,
            attempt_count: gap.attempt_count,
            quiz_count: gap.quiz_count,
            mastery: gap.mastery,
            weak_count: gap.weak_count,
            has_data: gap.answered > 0,
        };
    });

/** Konsep terlemah lintas course, untuk ringkasan di Dashboard. */
export const buildWeakestConcepts = ({ courses = [], attempts = [], questions = [], concepts = [] }) =>
    courses
        .flatMap((course) =>
            buildCourseGap({ course, attempts, questions, concepts }).concepts
                .filter((row) => !row.untested)
                .map((row) => ({
                    ...row,
                    course_id: course.id,
                    course_name: course.name,
                    course_color: course.color,
                }))
        )
        .sort(byGap);

/** Konsep terkuat lintas course, untuk kartu "Sudah kuat" di Dashboard. */
export const buildStrongestConcepts = (data, limit = 2) =>
    [...buildWeakestConcepts(data)].reverse().slice(0, limit);
