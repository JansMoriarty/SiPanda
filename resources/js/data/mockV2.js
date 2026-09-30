/**
 * MOCK DATA V2 (sementara)
 * ---------------------------------------------------------------
 * Seluruh data di file ini adalah data statis untuk membangun UI V2
 * dulu, sesuai prinsip "UI First" di AGENTS.md.
 *
 * Belum ada query DB / panggilan Gemini di balik data ini.
 * Saat backend V2 siap, file ini dihapus bertahap dan diganti props
 * dari Inertia (bentuk data di sini sengaja sudah menyerupai bentuk
 * props yang akan dipakai nanti).
 */

// ---------------------------------------------------------------- courses

export const mockCourses = [
  { id: 1, name: 'Kalkulus I', color: '#465FFF', documents_count: 12, quizzes_taken: 3 },
  { id: 2, name: 'Fisika Dasar', color: '#10B981', documents_count: 7, quizzes_taken: 1 },
  { id: 3, name: 'Trigonometri', color: '#F59E0B', documents_count: 4, quizzes_taken: 0 },
  { id: 4, name: 'Algoritma Pemrograman', color: '#8B5CF6', documents_count: 9, quizzes_taken: 2 },
];

// -------------------------------------------------------------- materials

export const mockMaterials = [
  {
    id: 101,
    title: 'Bab 01 — Limit dan Kontinuitas',
    course: { id: 1, name: 'Kalkulus I', color: '#465FFF' },
    file_type: 'pdf',
    file_size: 2_411_724,
    page_count: 42,
    status: 'processed',
    uploaded_at: '2026-09-20T09:12:00',
    study_pack: { status: 'ready', generated_at: '2026-09-20T09:14:00', progress: 100 },
    last_quiz_score: 90,
  },
  {
    id: 102,
    title: 'Bab 02 — Turunan',
    course: { id: 1, name: 'Kalkulus I', color: '#465FFF' },
    file_type: 'pdf',
    file_size: 3_884_032,
    page_count: 58,
    status: 'processed',
    uploaded_at: '2026-09-22T14:40:00',
    study_pack: { status: 'ready', generated_at: '2026-09-22T14:43:00', progress: 100 },
    last_quiz_score: 80,
  },
  {
    id: 103,
    title: 'Bab 03 — Integral',
    course: { id: 1, name: 'Kalkulus I', color: '#465FFF' },
    file_type: 'pptx',
    file_size: 8_126_464,
    page_count: 34,
    status: 'processed',
    uploaded_at: '2026-09-25T08:05:00',
    study_pack: { status: 'ready', generated_at: '2026-09-25T08:09:00', progress: 100 },
    last_quiz_score: 45,
  },
  {
    id: 104,
    title: 'Slide Pertemuan 4 — Kinematika',
    course: { id: 2, name: 'Fisika Dasar', color: '#10B981' },
    file_type: 'pptx',
    file_size: 5_242_880,
    page_count: 26,
    status: 'processed',
    uploaded_at: '2026-09-24T10:30:00',
    study_pack: { status: 'generating', generated_at: null, progress: 62 },
    last_quiz_score: null,
  },
  {
    id: 105,
    title: 'Modul Trigonometri Lengkap',
    course: { id: 3, name: 'Trigonometri', color: '#F59E0B' },
    file_type: 'pdf',
    file_size: 1_728_512,
    page_count: 30,
    status: 'processed',
    uploaded_at: '2026-09-26T16:20:00',
    study_pack: { status: 'ready', generated_at: '2026-09-26T16:22:00', progress: 100 },
    last_quiz_score: 30,
  },
  {
    id: 106,
    title: 'Bab 05 — Struktur Data Dasar',
    course: { id: 4, name: 'Algoritma Pemrograman', color: '#8B5CF6' },
    file_type: 'pdf',
    file_size: 2_998_016,
    page_count: 48,
    status: 'processing',
    uploaded_at: '2026-09-30T07:55:00',
    study_pack: { status: 'queued', generated_at: null, progress: 0 },
    last_quiz_score: null,
  },
  {
    id: 107,
    title: 'Modul Limit (Cadangan)',
    course: { id: 1, name: 'Kalkulus I', color: '#465FFF' },
    file_type: 'pdf',
    file_size: 940_800,
    page_count: 12,
    status: 'failed',
    uploaded_at: '2026-09-28T13:11:00',
    study_pack: { status: 'failed', generated_at: null, progress: 0 },
    last_quiz_score: null,
  },
];

// -------------------------------------------------------------- dashboard

export const mockDashboard = {
  greeting_name: 'Dimas',
  study_streak_days: 6,
  summary: {
    total_materials: 32,
    study_packs_ready: 24,
    quizzes_taken: 6,
    average_score: 61,
    questions_answered: 84,
    study_minutes_this_week: 145,
  },
  weekly_activity: [
    { day: 'Sen', minutes: 24, questions: 12 },
    { day: 'Sel', minutes: 35, questions: 18 },
    { day: 'Rab', minutes: 12, questions: 6 },
    { day: 'Kam', minutes: 28, questions: 15 },
    { day: 'Jum', minutes: 20, questions: 9 },
    { day: 'Sab', minutes: 18, questions: 14 },
    { day: 'Min', minutes: 8, questions: 10 },
  ],
  continue_learning: [mockMaterials[2], mockMaterials[4], mockMaterials[3]],
  // knowledge_gap_preview dan strong_concepts TIDAK ada di sini. Keduanya
  // dihitung dari mockQuizAttempts + mockQuestions oleh utils/gap.js, sama
  // seperti halaman Progress, supaya dua halaman tidak bisa berbeda angka.
  recent_quizzes: [
    {
      id: 9001,
      material_title: 'Bab 03 — Integral',
      course: 'Kalkulus I',
      score: 45,
      total: 10,
      completed_at: '2026-09-27T19:30:00',
      weak_concepts: ['Integral Tak Sederhana', 'Substitusi U'],
    },
    {
      id: 9002,
      material_title: 'Modul Trigonometri Lengkap',
      course: 'Trigonometri',
      score: 30,
      total: 10,
      completed_at: '2026-09-25T20:10:00',
      weak_concepts: ['Identitas Trigonometri'],
    },
    {
      id: 9003,
      material_title: 'Bab 02 — Turunan',
      course: 'Kalkulus I',
      score: 80,
      total: 10,
      completed_at: '2026-09-22T18:05:00',
      weak_concepts: ['Turunan Implisit'],
    },
  ],
};

// --------------------------------------------------------------- concepts

/**
 * Definisi tunggal konsep untuk Bab 03. Dipakai oleh Study Pack (dengan
 * mastery) dan oleh Quiz (untuk menandai tiap soal), supaya nama & id
 * konsep tidak pernah berbeda di dua halaman.
 */
export const mockConcepts = [
  {
    id: 'c1',
    course_id: 1,
    name: 'Integral Tak Sederhana',
    description: 'Menyelesaikan integral tanpa perubahan bentuk fungsi.',
    mastery: 45,
    importance: 'high',
  },
  {
    id: 'c2',
    course_id: 1,
    name: 'Substitusi U',
    description: 'Mengubah bentuk integral agar variabelnya dapat dipisahkan dari sisanya.',
    mastery: 52,
    importance: 'high',
  },
  {
    id: 'c3',
    course_id: 1,
    name: 'Integrasi Per Bagian',
    description: 'Untuk hasil kali dua fungsi yang tidak bisa dipisah.',
    mastery: 30,
    importance: 'medium',
  },
  {
    id: 'c4',
    course_id: 1,
    name: 'Teorema Dasar Kalkulus',
    description: 'Menghubungkan luas di bawah kurva dengan nilai antiderivat.',
    mastery: 64,
    importance: 'high',
  },
];

/** Konsep course 2, dipakai sebagai pembanding saat filter diganti. */
export const mockFisikaConcepts = [
  { id: 'f1', course_id: 2, name: 'Gerak Lurus', description: 'Kecepatan, percepatan, dan grafik posisi-waktu.', importance: 'high' },
  { id: 'f2', course_id: 2, name: 'Hukum Newton', description: 'Gaya, massa, dan percepatan benda.', importance: 'high' },
  { id: 'f3', course_id: 2, name: 'Energi Kinetik', description: 'Hubungan energi dengan kecepatan dan massa.', importance: 'medium' },
];

/**
 * Konsep milik course 1 yang belum masuk Study Pack Bab 03 dan belum
 * pernah diuji. Sengaja ada supaya Knowledge Gap bisa menampilkan konsep
 * "belum diuji" alih-alih mengarang angka 0% untuknya.
 */
export const mockBelumDiujiConcept = {
  id: 'c5',
  course_id: 1,
  name: 'Penggunaan Tool',
  description: 'Menyelesaikan soal dengan Leibniz, Maple, atau kalkulator ilmiah.',
  importance: 'low',
};

/** Registry konsep lintas course, dasar untuk agregasi Knowledge Gap. */
export const mockCourseConcepts = [
  ...mockConcepts,
  mockBelumDiujiConcept,
  ...mockFisikaConcepts,
];

/** Concept id yang benar-benar diuji oleh mockQuiz, urut. */
export const coveredConceptIds = ['c1', 'c2', 'c3', 'c4'];

// ------------------------------------------------------------- study pack

export const mockStudyPack = {
  document: {
    id: 103,
    title: 'Bab 03 — Integral',
    course: { id: 1, name: 'Kalkulus I', color: '#465FFF' },
    file_type: 'pptx',
    file_size: 8_126_464,
    page_count: 34,
    uploaded_at: '2026-09-25T08:05:00',
  },
  summary:
    'Bab ini membahas integral sebagai kebalikan dari turunan. Dimulai dari konsep luas di bawah kurva, ' +
    'disusul integral tak tentu, aturan integral, hingga metode substitusi dan integrasi per bagian. ' +
    'Fokus bab ini adalah:kapan teknik yang tepat harus dipilih untuk setiap jenis integral.',
  key_points: [
    'Integral tak tentu selalu ditulis sebagai C + konstanta, bukan angka tetap.',
    'Aturan integral mengikuti aturan turunan secara kebalikan.',
    'Substitusi u-Lafadz dipakai saat penyusun fungsi yang sama dengan turunannya.',
  ],
  concepts: mockConcepts,
  flashcards: [
    {
      id: 'f1',
      front: 'Apa yang dilakukan oleh metode Substitusi U?',
      back: 'Mengubah bentuk integral dengan substitusi variabel agar fungsi yang akan diderensalkan terpisah dari sisanya.',
    },
    {
      id: 'f2',
      front: 'Mengapa hasil integral selalu ditambah konstanta C?',
      back: 'Karena turunan dari konstanta adalah nol, maka banyak fungsi berbeda memiliki turunan yang sama.',
    },
    {
      id: 'f3',
      front: 'Kapan integrasi per bagian lebih baik daripada substitusi?',
      back: 'Saat integrand berupa hasil kali dua fungsi yang tidak dapat dipisahkan, misalnya x·e^x atau ln(x).',
    },
  ],
  quiz: {
    id: 'q103',
    total_questions: 10,
    time_limit_minutes: 15,
    passing_score: 70,
    best_score: 45,
    attempts: 2,
    covered_concepts: coveredConceptIds,
  },
  ask_panda: {
    scope_note:
      'Jawaban dibatasi pada isi dokumen ini, dengan dukungan materi lain dari mata kuliah yang sama.',
    suggested_questions: [
      'Kapan substitusi u lebih cocok dipakai daripada integrasi per bagian?',
      'Beri contoh soal integral tak sederhana beserta langkah penyelesaiannya.',
      'Apa hubungan teorema dasar kalkulus dengan luas di bawah kurva?',
    ],
    example_answer:
      'Substitusi u dipakai ketika penyusun fungsi yang akan diderensalkan bisa dipisahkan dari sisanya, ' +
      'misalnya pada ∫ 2x·(x²+1)⁵ dx. Integrasi per bagian lebih tepat untuk hasil kali dua fungsi yang ' +
      'tidak dapat dipisahkan, seperti ∫ x·eˣ dx. Keduanya sering dicoba berurutan bila cara pertama gagal.',
  },
};

// ------------------------------------------------------------------- quiz

/**
 * Mock quiz interaktif. Setiap soal WAJIB punya tag `concept` supaya
 * jawabannya bisa langsung dirollup menjadi breakdown per konsep di
 * halaman Hasil Quiz, dan nanti jadi bahan Knowledge Gap.
 *
 * Cakupan: c1 x3, c2 x3, c3 x2, c4 x2 = 10 soal.
 */
export const mockQuiz = {
  id: 'q103',
  document_id: 103,
  document_title: 'Bab 03 — Integral',
  course: { id: 1, name: 'Kalkulus I', color: '#465FFF' },
  total_questions: 10,
  time_limit_minutes: 15,
  passing_score: 70,
  best_score: 45,
  attempts: 2,
  questions: [
    {
      id: 'q1',
      concept: 'c1',
      question: 'Hitung: ∫ (4x³ − 2x) dx',
      options: ['x⁴ − x² + C', '12x² − 2 + C', '4x³ − 2x + C', 'x⁴/4 − x² + C'],
      correct_index: 0,
      explanation:
        'Integralkan tiap suku terpisah. Pangkat turun satu lalu dibagi pangkat itu: 4x³ → x⁴ dan −2x → −x². Jangan lupa konstanta C.',
    },
    {
      id: 'q2',
      concept: 'c1',
      question: 'Manakah hasil dari ∫ (3x² + 2x − 5) dx yang benar?',
      options: ['x³ + x² − 5x + C', '3x² + 2x − 5 + C', 'x³/3 + x²/2 − 5x + C', '6x + 2 + C'],
      correct_index: 0,
      explanation:
        'Setiap suku diintegralkan terpisah: 3x² → x³, 2x → x², dan −5 → −5x. Hasilnya digabung dalam satu C, bukan C di tiap suku.',
    },
    {
      id: 'q3',
      concept: 'c1',
      question: 'Berapakah ∫ 7 dx ?',
      options: ['7x + C', 'x + C', '7 + C', '7x²/2 + C'],
      correct_index: 0,
      explanation:
        'Konstanta diintegralkan menjadi konstanta dikali variabel. Aturan ini berlaku untuk konstanta apa pun, bukan hanya untuk bilangan bulat.',
    },
    {
      id: 'q4',
      concept: 'c2',
      question: 'Dengan u = 2x + 1, bentuk dari ∫ 2(2x + 1)³ dx adalah ...',
      options: ['u³/3 + C', 'u⁴/4 + C', 'u⁴/8 + C', 'u³ + C'],
      correct_index: 1,
      explanation:
        'du = 2 dx, jadi 2 dx = du. Sisa problemnya jadi ∫ u³ du = u⁴/4 + C. Pangkat turun satu lalu dibagi empat.',
    },
    {
      id: 'q5',
      concept: 'c2',
      question: 'Substitusi u = x² + 1 mengubah ∫ 2x·(x² + 1)⁵ dx menjadi ...',
      options: ['∫ u⁵ du', '∫ u⁶ du', '∫ 5u⁶ du', '∫ x·u⁵ dx'],
      correct_index: 0,
      explanation:
        'du = 2x dx sehingga bagian 2x dx hilang diganti du, dan tinggal u⁵. Catatan: u⁶/6 + C adalah hasil akhirnya, bentuk integralnya masih ∫ u⁵ du.',
    },
    {
      id: 'q6',
      concept: 'c2',
      question: 'Kapan substitusi u paling tepat dipakai?',
      options: [
        'Ketika turunan dari suatu ungkapan muncul utuh di dalam integral',
        'Selalu ketika integralnya mengandung akar',
        'Hanya untuk integral tak tentu',
        'Ketika hasil akhirnya harus berupa bilangan',
      ],
      correct_index: 0,
      explanation:
        'Kuncinya cari pola du. Kalau turunan dari sebuah ungkapan sudah ada utuh di integral, ungkapan itu yang dijadikan u.',
    },
    {
      id: 'q7',
      concept: 'c3',
      question: 'Formula integrasi per bagian adalah ...',
      options: ['∫ u dv = uv − ∫ v du', '∫ u dv = uv + ∫ v du', '∫ u dv = v du − uv', '∫ u dv = du · dv'],
      correct_index: 0,
      explanation:
        'Tanda minus berasal dari aturan produk pada turunan: d(uv) = u dv + v du. Kalau tandanya plus, turunannya akan salah.',
    },
    {
      id: 'q8',
      concept: 'c3',
      question: 'Untuk ∫ x·eˣ dx, pembagian u dan dv yang tepat adalah ...',
      options: ['u = x, dv = eˣ dx', 'u = eˣ, dv = x dx', 'u = x·eˣ, dv = dx', 'u = 1, dv = x·eˣ dx'],
      correct_index: 0,
      explanation:
        'Aturan LIATE: pilih yang lebih tinggi pangkatnya jadi u. Karena eˣ sulit diderensalkan, eˣ justru dipilih jadi dv dan x jadi u.',
    },
    {
      id: 'q9',
      concept: 'c4',
      question: 'Menurut Teorema Dasar Kalkulus, ∫ dari a ke b atas f(x) dx sama dengan ...',
      options: [
        'F(b) − F(a), di mana F adalah antiderivat dari f',
        'F(a) − F(b)',
        'F(a) + F(b)',
        'Turunan dari F(b) − F(a)',
      ],
      correct_index: 0,
      explanation:
        'Teorema ini menghubungkan integral definite dengan selisih antiderivat. Arahnya penting: batas atas dikurangi batas bawah.',
    },
    {
      id: 'q10',
      concept: 'c4',
      question: 'Jika F(x) = x³, a = 0, dan b = 2, maka ∫₀² x³ dx = ...',
      options: ['8', '6', '4', '2'],
      correct_index: 0,
      explanation:
        'F(2) − F(0) = 2³ − 0³ = 8. Hasil ini juga bisa dicek secara intuitif sebagai luas di bawah kurva x³ dari 0 ke 2.',
    },
  ],
};

// ---------------------------------------------------------- knowledge gap

/**
 * Bank soal lintas course, meniru tabel `questions`: satu baris per soal,
 * denganconcept_id sebagai jembatan ke tabel ` concepts`.
 *
 * Baris untuk quiz Bab 03 diturunkan dari mockQuiz supaya id soal dan
 * konsepnya tidak pernah bisa berbeda dari halaman Quiz. Sisa baris
 * menggambarkan quiz Bab 01, Bab 02, dan Kinematika yang tidak punya
 * halaman sendiri di mock ini.
 */
export const mockQuestions = [
  ...mockQuiz.questions.map((q) => ({
    id: q.id,
    concept_id: q.concept,
    quiz_id: mockQuiz.id,
    document_id: mockQuiz.document_id,
    course_id: mockQuiz.course.id,
  })),
  { id: 'a1', concept_id: 'c1', quiz_id: 'q101', document_id: 101, course_id: 1 },
  { id: 'a2', concept_id: 'c2', quiz_id: 'q101', document_id: 101, course_id: 1 },
  { id: 'a3', concept_id: 'c2', quiz_id: 'q101', document_id: 101, course_id: 1 },
  { id: 'a4', concept_id: 'c1', quiz_id: 'q101', document_id: 101, course_id: 1 },
  { id: 'a5', concept_id: 'c5', quiz_id: 'q101', document_id: 101, course_id: 1 },
  { id: 'b1', concept_id: 'c2', quiz_id: 'q102', document_id: 102, course_id: 1 },
  { id: 'b2', concept_id: 'c4', quiz_id: 'q102', document_id: 102, course_id: 1 },
  { id: 'b3', concept_id: 'c1', quiz_id: 'q102', document_id: 102, course_id: 1 },
  { id: 'd1', concept_id: 'f1', quiz_id: 'q104', document_id: 104, course_id: 2 },
  { id: 'd2', concept_id: 'f2', quiz_id: 'q104', document_id: 104, course_id: 2 },
  { id: 'd3', concept_id: 'f3', quiz_id: 'q104', document_id: 104, course_id: 2 },
];

/**
 * Tabel `quiz_attempts` + `attempt_answers` dalam bentuk mock: tiap attempt
 * adalah satu percobaan, tiap answers adalah satu baris jawaban yang
 * mereujuk question_id.
 *
 * Dua Percobaan pertama memakai `mock-attempt-1` dan `mock-attempt-2` supaya
 * id attempt di halaman Quiz (mock-attempt-3) tidak bentrok dengan attempt
 * yang sudah selesai. Soal `a5` (Penggunaan Tool) sengaja tidak pernah
 * dijawab supaya ada konsep berstatus "belum diuji", bukan angka 0% karangan.
 *
 * Angka koreksi sengaja disusun/manual supaya agregasinya menghasilkan
 * rentang yang enak dilihat: c3 selalu 0%, c2 di bawah ambang 60%, c1 dan
 * c4 di atasnya, lalu naik jelas di percobaan terakhir.
 */
export const mockQuizAttempts = [
  {
    id: 'mock-attempt-1',
    quiz_id: 'q101',
    document_id: 101,
    document_title: 'Bab 01 - Limit dan Kontinuitas',
    course_id: 1,
    completed_at: '2026-09-12T20:15:00',
    answers: [
      { question_id: 'a1', correct: true },
      { question_id: 'a2', correct: true },
      { question_id: 'a3', correct: false },
      { question_id: 'a4', correct: true },
    ],
  },
  {
    id: 'mock-attempt-2',
    quiz_id: 'q103',
    document_id: 103,
    document_title: 'Bab 03 - Integral',
    course_id: 1,
    completed_at: '2026-09-19T21:02:00',
    answers: [
      { question_id: 'q1', correct: true },
      { question_id: 'q2', correct: false },
      { question_id: 'q3', correct: false },
      { question_id: 'q4', correct: true },
      { question_id: 'q5', correct: false },
      { question_id: 'q6', correct: false },
      { question_id: 'q7', correct: false },
      { question_id: 'q8', correct: false },
      { question_id: 'q9', correct: true },
      { question_id: 'q10', correct: false },
    ],
  },
  {
    id: 'mock-attempt-4',
    quiz_id: 'q103',
    document_id: 103,
    document_title: 'Bab 03 - Integral',
    course_id: 1,
    completed_at: '2026-09-26T19:30:00',
    answers: [
      { question_id: 'q1', correct: true },
      { question_id: 'q2', correct: true },
      { question_id: 'q3', correct: true },
      { question_id: 'q4', correct: true },
      { question_id: 'q5', correct: true },
      { question_id: 'q6', correct: false },
      { question_id: 'q7', correct: false },
      { question_id: 'q8', correct: false },
      { question_id: 'q9', correct: true },
      { question_id: 'q10', correct: true },
    ],
  },
  {
    id: 'mock-attempt-5',
    quiz_id: 'q102',
    document_id: 102,
    document_title: 'Bab 02 - Turunan',
    course_id: 1,
    completed_at: '2026-09-28T08:40:00',
    answers: [
      { question_id: 'b1', correct: true },
      { question_id: 'b2', correct: true },
      { question_id: 'b3', correct: false },
    ],
  },
  {
    id: 'mock-attempt-6',
    quiz_id: 'q104',
    document_id: 104,
    document_title: 'Slide Pertemuan 4 - Kinematika',
    course_id: 2,
    completed_at: '2026-09-20T15:25:00',
    answers: [
      { question_id: 'd1', correct: true },
      { question_id: 'd2', correct: false },
      { question_id: 'd3', correct: true },
    ],
  },
  {
    id: 'mock-attempt-7',
    quiz_id: 'q104',
    document_id: 104,
    document_title: 'Slide Pertemuan 4 - Kinematika',
    course_id: 2,
    completed_at: '2026-09-25T16:10:00',
    answers: [
      { question_id: 'd1', correct: true },
      { question_id: 'd2', correct: true },
      { question_id: 'd3', correct: false },
    ],
  },
];

/**
 * Angka knowledge gap TIDAK ditulis di sini. Semua persen dihitung dari
 * mockQuizAttempts + mockQuestions oleh utils/gap.js, sama seperti query
 * aslinya nanti: attempt_answers -> questions -> concepts, dibatasi
 * user_id + course_id.
 */

// ---------------------------------------------------------------- progress

export const mockProgress = {
  period: '30 hari terakhir',
  overall_mastery: 61,
  previous_mastery: 54,
  study_minutes_total: 612,
  questions_answered: 84,
  current_streak: 6,
  longest_streak: 11,
  history: [
    { date: '2026-09-04', minutes: 22, score: 55 },
    { date: '2026-09-08', minutes: 35, score: 60 },
    { date: '2026-09-12', minutes: 18, score: 58 },
    { date: '2026-09-16', minutes: 42, score: 66 },
    { date: '2026-09-20', minutes: 28, score: 64 },
    { date: '2026-09-24', minutes: 31, score: 70 },
    { date: '2026-09-28', minutes: 24, score: 72 },
  ],
  by_course: [
    { id: 1, name: 'Kalkulus I', color: '#465FFF', mastery: 61, quizzes: 3, materials: 12 },
    { id: 4, name: 'Algoritma Pemrograman', color: '#8B5CF6', mastery: 74, quizzes: 2, materials: 9 },
    { id: 2, name: 'Fisika Dasar', color: '#10B981', mastery: 58, quizzes: 1, materials: 7 },
    { id: 3, name: 'Trigonometri', color: '#F59E0B', mastery: 30, quizzes: 0, materials: 4 },
  ],
};

// ----------------------------------------------------- practice questions

export const mockPractice = {
  source: { type: 'knowledge_gap', concept: 'Integral Tak Sederhana', course: 'Kalkulus I' },
  questions: [
    {
      id: 'p1',
      type: 'multiple_choice',
      question: 'Hitung: ∫ (4x³ − 2x) dx',
      options: ['x⁴ − x² + C', '12x² − 2 + C', '4x³ − 2x + C', 'x⁴/4 − x² + C'],
      correct_index: 0,
      explanation:
        'Integral dari 4x³ adalah x⁴, dan integral dari −2x adalah −x². Jangan lupa konstanta C.',
    },
    {
      id: 'p2',
      type: 'multiple_choice',
      question: 'Dengan substitusi u = 2x + 1, tentukan bentuk ∫ 2(2x+1)³ dx',
      options: ['u³/3 + C', 'u⁴/4 + C', 'u³ + C', 'u⁴/8 + C'],
      correct_index: 1,
      explanation: 'du = 2 dx sehingga 2 dx = du, hasilnya ∫ u³ du = u⁴/4 + C.',
    },
  ],
};

// ------------------------------------------------------- document detail

export const mockDocumentDetail = {
  id: 101,
  title: 'Bab 01 — Limit dan Kontinuitas',
  course: { id: 1, name: 'Kalkulus I', color: '#465FFF' },
  file: {
    original_filename: 'kalkulus-1-bab-01.pdf',
    file_type: 'pdf',
    file_size: 2_411_724,
    page_count: 42,
    uploaded_at: '2026-09-20T09:12:00',
    status: 'processed',
    processed_at: '2026-09-20T09:14:00',
  },
  stats: { chunk_count: 37, concept_count: 9, flashcard_count: 18, question_count: 20 },
  study_pack_status: 'ready',
};
