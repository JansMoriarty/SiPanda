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
  knowledge_gap_preview: [
    { concept: 'Integral Tak Sederhana', course: 'Kalkulus I', score: 45, trend: 'down' },
    { concept: 'Identitas Trigonometri', course: 'Trigonometri', score: 30, trend: 'flat' },
    { concept: 'Substitusi U', course: 'Kalkulus I', score: 52, trend: 'up' },
  ],
  strong_concepts: [
    { concept: 'Limit Tak Sederhana', course: 'Kalkulus I', score: 90 },
    { concept: 'Aturan Rantai', course: 'Kalkulus I', score: 80 },
  ],
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
  concepts: [
    {
      id: 'c1',
      name: 'Integral Tak Sederhana',
      description: 'Menyelesaikan integral tanpa perubahan bentuk fungsi.',
      mastery: 45,
      importance: 'high',
    },
    {
      id: 'c2',
      name: 'Substitusi U',
      description: 'Mengubah bentuk integral agar variabelnya dapat dipisahkan dari sisanya.',
      mastery: 52,
      importance: 'high',
    },
    {
      id: 'c3',
      name: 'Integrasi Per Bagian',
      description: 'Untuk hasil kali dua fungsi yang tidak bisa dipisah.',
      mastery: 30,
      importance: 'medium',
    },
    {
      id: 'c4',
      name: 'Teorema Dasar Kalkulus',
      description: 'Menghubungkan luas di bawah kurva dengan nilai antiderivat.',
      mastery: 64,
      importance: 'high',
    },
  ],
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
    covered_concepts: ['c1', 'c2', 'c3', 'c4'],
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

// ---------------------------------------------------------- knowledge gap

export const mockKnowledgeGap = {
  course: { id: 1, name: 'Kalkulus I', color: '#465FFF' },
  overall_mastery: 61,
  computed_from: 84,
  concepts: [
    { id: 'c1', name: 'Integral Tak Sederhana', score: 45, answered: 12, correct: 5, trend: 'down', needs_practice: true },
    { id: 'c2', name: 'Substitusi U', score: 52, answered: 10, correct: 5, trend: 'up', needs_practice: true },
    { id: 'c3', name: 'Integrasi Per Bagian', score: 30, answered: 8, correct: 2, trend: 'down', needs_practice: true },
    { id: 'c4', name: 'Teorema Dasar Kalkulus', score: 64, answered: 11, correct: 7, trend: 'up', needs_practice: false },
    { id: 'c5', name: 'Limit Tak Sederhana', score: 90, answered: 15, correct: 14, trend: 'up', needs_practice: false },
    { id: 'c6', name: 'Aturan Rantai', score: 80, answered: 12, correct: 10, trend: 'flat', needs_practice: false },
    { id: 'c7', name: 'Turunan Implisit', score: 70, answered: 9, correct: 6, trend: 'flat', needs_practice: false },
  ],
};

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
