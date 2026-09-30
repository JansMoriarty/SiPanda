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
    processed_at: '2026-09-20T09:14:00',
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
    processed_at: '2026-09-22T14:42:00',
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
    processed_at: '2026-09-25T08:08:00',
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
    processed_at: '2026-09-24T10:32:00',
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
    processed_at: '2026-09-26T16:22:00',
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
    // Kolom ini dipakai halaman detail untuk menjelaskan kenapa gagal, bukan
    // cuma menampilkan badge merah. Isinya meniru pesan yang ditulis
    // DocumentController::processDocument ke kolom error_message.
    error_message:
      'Ekstraksi PDF gagal: tidak ada objek teks yang bisa dibaca. File kemungkinan hasil scan tanpa OCR.',
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

/**
 * Konsep Bab 01 (Limit). Sengaja TIDAK ikut mockCourseConcepts: registry
 * lintas course itu dipakai Knowledge Gap, Progress, dan Dashboard, jadi
 * menambah isinya akan mengubah angka "belum diuji" di semua halaman itu.
 * Konsep di sini hanya milik study pack Bab 01.
 */
export const mockLimitConcepts = [
  {
    id: 'l1',
    course_id: 1,
    name: 'Limit Fungsi',
    description: 'Nilai yang approached saat x mendekati sebuah titik, baik dari kiri maupun kanan.',
    mastery: 92,
    importance: 'high',
  },
  {
    id: 'l2',
    course_id: 1,
    name: 'Bentuk Tak Tertentu',
    description: 'Bentuk 0/0 dan bentuk seperti infinity dikurangi infinity yang harus disederhanakan lebih dulu.',
    mastery: 85,
    importance: 'high',
  },
  {
    id: 'l3',
    course_id: 1,
    name: 'Kontinuitas',
    description: 'Syarat fungsi kontinu: nilai fungsi sama dengan limit di titik itu dan limitnya ada.',
    mastery: 70,
    importance: 'medium',
  },
  {
    id: 'l4',
    course_id: 1,
    name: 'Teorema Squeeze',
    description: 'Menebak limit dengan menjepit fungsi di antara dua fungsi yang limitnya sama.',
    mastery: 78,
    importance: 'high',
  },
];

/**
 * Konsep Bab 02 (Turunan). Sama seperti mockLimitConcepts, tidak masuk
 * registry lintas course. Prefix d2 dipakai agar tidak bentrok dengan
 * mockFisikaConcepts (f1-f3) maupun mockConcepts (c1-c4).
 */
export const mockTurunanConcepts = [
  {
    id: 'd1',
    course_id: 1,
    name: 'Aturan Rantai',
    description: 'Turunan fungsi komposit dihitung dengan mengalikan turunan tiap lapisan fungsi.',
    mastery: 85,
    importance: 'high',
  },
  {
    id: 'd2',
    course_id: 1,
    name: 'Turunan Implisit',
    description: 'Menurunkan kedua ruas tanpa harus menyelesaikan y lebih dulu.',
    mastery: 68,
    importance: 'high',
  },
  {
    id: 'd3',
    course_id: 1,
    name: 'Diferensiasi Higher-Order',
    description: 'Turunan kedua dan seterusnya, dipakai untuk mencari titik inflection dan uji ekstremum.',
    mastery: 74,
    importance: 'medium',
  },
  {
    id: 'd4',
    course_id: 1,
    name: 'Turunan Fungsi Invers',
    description: 'Hubungan turunan Invers dengan turunan fungsi aslinya di titik berbalik.',
    mastery: 45,
    importance: 'medium',
  },
];

/** Study pack Bab 01. Metadata dokumennya disalin dari mockMaterials id 101. */
const mockLimitStudyPack = {
  document: {
    id: 101,
    title: 'Bab 01 — Limit dan Kontinuitas',
    course: { id: 1, name: 'Kalkulus I', color: '#465FFF' },
    file_type: 'pdf',
    file_size: 2_411_724,
    page_count: 42,
    uploaded_at: '2026-09-20T09:12:00',
  },
  summary:
    'Bab ini membangun definisi limit sebagai alat untuk menggambarkan perilaku fungsi saat x ' +
    'mendekati suatu titik, termasuk limit satu sisi dan limit di tak hingga. Setelah itu dibahas ' +
    'bentuk tak tertentu yang wajib disederhanakan, teorema squeeze untuk kasus yang sulit dihitung ' +
    'langsung, dan syarat kontinuitas sebuah fungsi. Fokus bab ini adalah: memilih teknik limit ' +
    'yang paling murah sebelum mulai menghitung.',
  key_points: [
    'Limit hanya menjelaskan perilaku mendekati titik, bukan nilai fungsi di titik itu.',
    'Bentuk 0/0 dan bentuk infinity dikurangi infinity harus disederhanakan dulu sebelum limit bisa dihitung.',
    'Fungsi kontinu kalau limit dua sisinya ada, sama dengan nilai fungsinya di titik tersebut.',
  ],
  concepts: mockLimitConcepts,
  flashcards: [
    {
      id: 'lf1',
      front: 'Apa bedanya limit dan nilai fungsi di sebuah titik?',
      back: 'Limit hanya menggambarkan apa yang terjadi saat x mendekati titik, sedangkan nilai fungsi di titik itu bisa berbeda.',
    },
    {
      id: 'lf2',
      front: 'Kapan teorema squeeze dipakai?',
      back: 'Saat limit langsung sulit dihitung, tapi funkcinya bisa dijepit di antara dua fungsi yang limitnya sudah diketahui.',
    },
    {
      id: 'lf3',
      front: 'Syarat fungsi kontinu di titik x = a ada berapa?',
      back: 'Tiga: limit kiri dan kanan sama, limit itu sama dengan f(a), dan fungsinya terdefinisi di a.',
    },
  ],
  quiz: {
    id: 'q101',
    total_questions: 8,
    time_limit_minutes: 12,
    passing_score: 70,
    best_score: 90,
    attempts: 3,
    covered_concepts: ['l1', 'l2', 'l3', 'l4'],
  },
  ask_panda: {
    scope_note:
      'Jawaban dibatasi pada isi dokumen ini, dengan dukungan materi lain dari mata kuliah yang sama.',
    suggested_questions: [
      'Bagaimana cara memulai menghitung limit 0/0?',
      'Beri contoh soal yang lebih mudah diselesaikan pakai teorema squeeze.',
      'Apa akibat dari limit kiri dan kanan tidak sama di sebuah titik?',
    ],
    example_answer:
      'Limit 0/0 selalu disederhanakan lebih dulu, tidak boleh langsung dihitung. Contohnya ' +
      'lim (x²-4)/(x-2) = 2 bukan 0/0, karena faktor (x+2) bisa dicoret. Setelah itu baru ' +
      'substitusi langsung. Kalau hasilnya masih rumit, bentuk tak tertentu lain perlu dipisah ' +
      'dengan mengalikan sekalian bentuk pertama dengan bentuk kedua.',
  },
};

/** Study pack Bab 02. Metadata dokumennya disalin dari mockMaterials id 102. */
const mockTurunanStudyPack = {
  document: {
    id: 102,
    title: 'Bab 02 — Turunan',
    course: { id: 1, name: 'Kalkulus I', color: '#465FFF' },
    file_type: 'pdf',
    file_size: 3_884_032,
    page_count: 58,
    uploaded_at: '2026-09-22T14:40:00',
  },
  summary:
    'Bab ini memperkenalkan turunan sebagai laju perubahan sesaat dan turunannya dari definisi ' +
    'limit selisih. Setelah aturan dasar turunan diperkenalkan, dibahas turunan fungsi ' +
    'komposit (aturan rantai), turunan implisit, diferensiasi orde kedua, dan turunan fungsi ' +
    'invers. Fokus bab ini adalah: memilih teknik turunan yang sesuai sebelum menghafal rumus.',
  key_points: [
    'Turunan adalah limit selisih, jadi boleh dipakai untuk memderivasi rumus baru.',
    'Aturan rantai selalu mengalikan turunan setiap lapisan, tidak boleh ada yang terlewat.',
    'Turunan implisit lebih cepat daripada menyelesaikan y lebih dulu saat y tidak mudah dipisah.',
  ],
  concepts: mockTurunanConcepts,
  flashcards: [
    {
      id: 'df1',
      front: 'Apa yang dimaksud aturan rantai?',
      back: 'Bila f = g(h(x)), maka f′(x) = g′(h(x)) · h′(x), jadi turunan tiap lapisan dikalikan.',
    },
    {
      id: 'df2',
      front: 'Kapan turunan implisit lebih praktis?',
      back: 'Saat y tidak bisa dipisahkan dari x dengan mudah, misalnya y² + x² = 25, sehingga tidak perlu menyelesaikan y.',
    },
    {
      id: 'df3',
      front: 'Bagaimana rumus turunan fungsi invers?',
      back: '(f⁻¹)′(a) = 1 / f′(f⁻¹(a)), jadi turunan di titik kebalikan dari argumennya.',
    },
  ],
  quiz: {
    id: 'q102',
    total_questions: 10,
    time_limit_minutes: 15,
    passing_score: 70,
    best_score: 80,
    attempts: 1,
    covered_concepts: ['d1', 'd2', 'd3', 'd4'],
  },
  ask_panda: {
    scope_note:
      'Jawaban dibatasi pada isi dokumen ini, dengan dukungan materi lain dari mata kuliah yang sama.',
    suggested_questions: [
      'Bedakan turunan implisit dan turunan eksplisit, kapan masing-masing dipakai?',
      'Turunkan fungsi f(x) = sin(3x²) menggunakan aturan rantai.',
      'Apa hubungan turunan kedua dengan titik inflection?',
    ],
    example_answer:
      'Turunan f(x) = sin(3x²) memakai aturan rantai dua kali. Lapisan luar sin diturunkan menjadi ' +
      'cos, dan lapisan dalam 3x² diturunkan menjadi 6x, jadi hasilnya 6x · cos(3x²). Untuk ' +
      'turunan implisit, turunkan kedua ruas terhadap x lalu perlakukan dy/dx sebagai peubah, ' +
      'tanpa perlu menyelesaikan y lebih dulu.',
  },
};

export const mockStudyPacks = {
  101: mockLimitStudyPack,
  102: mockTurunanStudyPack,
  103: mockStudyPack,
};

/** Concept id Bab 01, dipakai quiz panel agar nama konsepnya ketemu. */
export const coveredLimitConceptIds = ['l1', 'l2', 'l3', 'l4'];

/** Concept id Bab 02, dipakai quiz panel agar nama konsepnya ketemu. */
export const coveredTurunanConceptIds = ['d1', 'd2', 'd3', 'd4'];

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

// ------------------------------------------------------- personalized practice

/**
 * Bank soal Personalized Practice. Sengaja dipisah dari `mockQuestions`:
 *
 * - `mockQuestions` adalah registry Knowledge Gap. Menambah baris di sana
 *   berarti menambah soal yang "sudah ada" di materi.
 * - Bank ini adalah soal latihan yang dibuat SETELAH student dinyatakan
 *   lemah di suatu konsep, jadi tidak mungkin sudah ada di quiz sebelumnya.
 *
 * Karena pisahnya, menjawab latihan tidak mengubah satu angka pun di
 * halaman Progress. Itu bukan kebetulan: attempt practice belum disimpan
 * ke server, dan selama belum ada tabelnya, Progress harus jujur soal itu.
 *
 * `question_id` di attempt practice nanti akan menunjuk ke baris di sini.
 */
export const mockPracticeQuestions = [
  // -- c1 Integral Tak Sederhana -------------------------------------------
  {
    id: 'pc1',
    course_id: 1,
    concept_id: 'c1',
    question: 'Hitung: ∫ (5x² + 3) dx',
    options: ['(5/3)x³ + 3x + C', '5x³/2 + 3 + C', '(5/3)x³ + 3x', '10x + 3x + C'],
    correct_index: 0,
    explanation:
      'Pangkat turun satu lalu dibagi pangkat itu: 5x² menjadi (5/3)x³. Konstanta 3 menjadi 3x. Satu C di akhir saja.',
  },
  {
    id: 'pc2',
    course_id: 1,
    concept_id: 'c1',
    question: 'Berapakah ∫ x⁴ dx ?',
    options: ['5x⁵ + C', 'x⁵ + C', 'x⁵/5 + C', '4x³ + C'],
    correct_index: 2,
    explanation:
      'Aturan pangkat: pangkat turun satu (4 → 3) lalu dibagi pangkat itu (÷4). Jadi x⁴ → x⁵/5, bukan x⁵ dan bukan 4x³.',
  },
  {
    id: 'pc3',
    course_id: 1,
    concept_id: 'c1',
    question: 'Manakah hasil dari ∫ (2x³ − x + 4) dx yang benar?',
    options: ['x⁴/2 − x²/2 + 4x', '6x² − 1 + 4x + C', '2x⁴/4 − x²/2 + 4x + C', 'x⁴/2 − x²/2 + 4x + C'],
    correct_index: 3,
    explanation:
      'Tiap suku diintegralkan terpisah: 2x³ → x⁴/2, −x → −x²/2, 4 → 4x. Konstanta C tetap satu di akhir, dan tidak ikut diintegralkan.',
  },

  // -- c2 Substitusi U ----------------------------------------------------
  {
    id: 'pc4',
    course_id: 1,
    concept_id: 'c2',
    question: 'Dengan u = 3x² + 1, bentuk dari ∫ 6x·(3x² + 1)⁴ dx adalah ...',
    options: ['∫ u⁵ du', '∫ u⁴ du', '∫ 3u⁴ du', '∫ x·u⁴ dx'],
    correct_index: 1,
    explanation:
      'du = 6x dx, jadi bagian 6x dx hilang diganti du dan tinggal u⁴. Hasil akhirnya u⁵/5 + C, tapi bentuk integralnya masih ∫ u⁴ du.',
  },
  {
    id: 'pc5',
    course_id: 1,
    concept_id: 'c2',
    question: 'Substitusi apa yang cocok untuk ∫ 2x·cos(x²) dx ?',
    options: ['u = x², karena du = 2x dx', 'u = cos(x²), karena du = −2x·sin(x²) dx', 'u = 2x, karena du = 2 dx', 'Tidak ada substitusi yang cocok'],
    correct_index: 0,
    explanation:
      'Cari ungkapan yang turunannya sudah ada utuh. Turunan dari x² adalah 2x, persis faktor di depan cos. Jadi u = x² dan integralnya jadi ∫ cos u du.',
  },
  {
    id: 'pc6',
    course_id: 1,
    concept_id: 'c2',
    question: 'Kapan substitusi u TIDAK tepat dipakai?',
    options: ['Ketika integralnya mengandung pangkat', 'Ketika hasilnya nanti berupa logaritma', 'Ketika tidak ada ungkapan yang turunannya muncul utuh di dalam integral', 'Ketika batas integrasinya berupa pecahan'],
    correct_index: 2,
    explanation:
      'Substitusi u bergantung pada pola du. Kalau tidak ada ungkapan yang turunannya sudah ada di integral, pola itu tidak ada dan cara ini tidak mempercepat apa pun.',
  },

  // -- c3 Integrasi Per Bagian -------------------------------------------
  {
    id: 'pc7',
    course_id: 1,
    concept_id: 'c3',
    question: 'Hasil dari ∫ x·eˣ dx adalah ...',
    options: ['x·eˣ + eˣ + C', 'eˣ + C', 'x²/2·eˣ + C', 'x·eˣ − eˣ + C'],
    correct_index: 3,
    explanation:
      'Ambil u = x dan dv = eˣ dx, jadi v = eˣ. Rumus ∫ u dv = uv − ∫ v du memberi x·eˣ − ∫ eˣ dx = x·eˣ − eˣ + C. Integral kedua ikut dihitung, tidak boleh dihilangkan.',
  },
  {
    id: 'pc8',
    course_id: 1,
    concept_id: 'c3',
    question: 'Hasil dari ∫ ln(x) dx adalah ...',
    options: ['ln(x)/x + C', 'x·ln(x) − x + C', 'x·ln(x) + C', 'ln(x²) + C'],
    correct_index: 1,
    explanation:
      'LIATE menyuruh ln(x) jadi u dan dx jadi dv, jadi du = (1/x) dx dan v = x. Maka uv − ∫ v du = x·ln(x) − ∫ x·(1/x) dx = x·ln(x) − x + C.',
  },
  {
    id: 'pc9',
    course_id: 1,
    concept_id: 'c3',
    question: 'Untuk ∫ x·cos(x) dx, pembagian yang benar menurut LIATE adalah ...',
    options: ['u = x, dv = cos(x) dx', 'u = cos(x), dv = x dx', 'u = x·cos(x), dv = dx', 'u = 1, dv = x·cos(x) dx'],
    correct_index: 0,
    explanation:
      'LIATE: Logaritma, Inverse, Algebra, Trigonometri, Eksponensial. Di sini hanya ada trigonometri dan aljabar, jadi yang lebih tinggi pangkatnya (x) jadi u.',
  },

  // -- c4 Teorema Dasar Kalkulus -----------------------------------------
  {
    id: 'pc10',
    course_id: 1,
    concept_id: 'c4',
    question: 'Jika F(x) = x², maka ∫₀¹ 2x dx = ...',
    options: ['2', '1/2', '1', '0'],
    correct_index: 2,
    explanation:
      'Turunan dari x² adalah 2x, jadi F(b) − F(a) = F(1) − F(0) = 1 − 0 = 1. Arahnya penting: batas atas dikurangi batas bawah.',
  },
  {
    id: 'pc11',
    course_id: 1,
    concept_id: 'c4',
    question: 'Berapakah ∫₁² (3x² + 1) dx ?',
    options: ['9', '7', '6', '8'],
    correct_index: 3,
    explanation:
        'Antiderivatnya F(x) = x³ + x. Lalu F(2) − F(1) = (8 + 2) − (1 + 1) = 10 − 2 = 8. Jangan lupa evaluate kedua batas, bukan hanya batas atas.',
  },
  {
    id: 'pc12',
    course_id: 1,
    concept_id: 'c4',
    question: 'Luas daerah di bawah kurva f(x) = x² dari x = 0 sampai x = 3 adalah ...',
    options: ['6', '9', '27', '3'],
    correct_index: 1,
    explanation:
      'Luas itu integral definite: F(x) = x³/3, jadi F(3) − F(0) = 27/3 − 0 = 9. Menghitungnya seperti ini jauh lebih aman daripada menjumlahkan luas secara manual.',
  },

  // -- f1 Gerak Lurus -----------------------------------------------------
  {
    id: 'pf1',
    course_id: 2,
    concept_id: 'f1',
    question: 'Benda mulai dari diam dengan percepatan konstan 2 m/s² selama 3 detik. Kecepatan akhirnya ...',
    options: ['6 m/s', '3 m/s', '9 m/s', '1,5 m/s'],
    correct_index: 0,
    explanation:
      'Gerak dipercepat beraturan: v = v₀ + a·t = 0 + (2)(3) = 6 m/s. Percepatan dikali waktu, bukan dibagi.',
  },
  {
    id: 'pf2',
    course_id: 2,
    concept_id: 'f1',
    question: 'Dengan v₀ = 0, a = 2 m/s², dan t = 3 s, jarak yang ditempuh adalah ...',
    options: ['6 m', '18 m', '9 m', '4,5 m'],
    correct_index: 2,
    explanation:
      's = v₀·t + ½·a·t² = 0 + ½·(2)(9) = 9 m. Nilai 6 m adalah kecepatan akhirnya, bukan jaraknya.',
  },
  {
    id: 'pf3',
    course_id: 2,
    concept_id: 'f1',
    question: 'Sebuah benda bergerak dengan v = 20 m/s lalu diperlambat a = −4 m/s² selama 2 s. Kecepatan setelahnya ...',
    options: ['8 m/s', '16 m/s', '28 m/s', '12 m/s'],
    correct_index: 3,
    explanation:
      'Tanda negatif pada percepatan berarti mengurangi kecepatan: v = 20 + (−4)(2) = 20 − 8 = 12 m/s.',
  },

  // -- f2 Hukum Newton ---------------------------------------------------
  {
    id: 'pf4',
    course_id: 2,
    concept_id: 'f2',
    question: 'Gaya resultan 12 N bekerja pada benda bermassa 3 kg. Percepatannya ...',
    options: ['36 m/s²', '4 m/s²', '9 m/s²', '0,25 m/s²'],
    correct_index: 1,
    explanation:
      'Hukum II Newton: F = m·a, jadi a = F/m = 12/3 = 4 m/s². Gaya dibagi massa, bukan dikali.',
  },
  {
    id: 'pf5',
    course_id: 2,
    concept_id: 'f2',
    question: 'Benda bermassa 4 kg mengalami percepatan 5 m/s². Gaya resultannya ...',
    options: ['20 N', '0,8 N', '9 N', '1,25 N'],
    correct_index: 0,
    explanation:
      'Dari F = m·a: F = (4)(5) = 20 N. Massa dalam kilogram dikali percepatan dalam m/s² menghasilkan newton.',
  },
  {
    id: 'pf6',
    course_id: 2,
    concept_id: 'f2',
    question: 'Menurut Hukum Newton I, benda yang resultan gaya nol akan ...',
    options: ['Selalu diam', 'Selalu dipercepat', 'Tetap diam atau bergerak dengan kecepatan konstan', 'Berganti arah setiap saat'],
    correct_index: 2,
    explanation:
      'Kelembaman adalah inersia. Kalau tidak ada gaya resultan, tidak ada yang mengubah keadaan gerak: diam tetap diam, dan bergerak lurus tetap berkecepatan tetap.',
  },

  // -- f3 Energi Kinetik -------------------------------------------------
  {
    id: 'pf7',
    course_id: 2,
    concept_id: 'f3',
    question: 'Energi kinetik benda bermassa 2 kg yang bergerak 3 m/s adalah ...',
    options: ['6 J', '18 J', '4,5 J', '9 J'],
    correct_index: 3,
    explanation:
      'E_k = ½·m·v² = ½·(2)(9) = 9 J. Perhatikan pangkatnya: v dihitung dua kali, jadi mengubah kecepatan sedikit saja mengubah energi jauh lebih besar.',
  },
  {
    id: 'pf8',
    course_id: 2,
    concept_id: 'f3',
    question: 'Benda bermassa 4 kg punya energi kinetik 200 J. Kecepatannya ...',
    options: ['5 m/s', '10 m/s', '20 m/s', '7,07 m/s'],
    correct_index: 1,
    explanation:
      'Dari E_k = ½mv²: v² = 2E_k/m = (400)/4 = 100, jadi v = 10 m/s. Akar dari 100 adalah 10, bukan 7,07 (itu akar dari 50).',
  },
  {
    id: 'pf9',
    course_id: 2,
    concept_id: 'f3',
    question: 'Jika kecepatan sebuah benda menjadi dua kali lipat, energi kinetiknya menjadi ...',
    options: ['4 kali lipat', '2 kali lipat', '8 kali lipat', ' tetap sama'],
    correct_index: 0,
    explanation:
      'Karena v di-kuadratkan, (2v)² = 4v². Jadi energi kinetik jadi empat kali lipat. Inilah sebabnya perlambatan tidak bisa diabaikan di fisika.',
  },
];

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

// ----------------------------------------------------------------- profile

/**
 * Statistik yang TIDAK bisa dihitung dari mockQuizAttempts.
 *
 * Sisa statistik halaman /profile (jumlah quiz, rata-rata skor, penguasaan
 * per mata kuliah) sengaja TIDAK ditulis di sini. Semuanya dihitung dari
 * mockQuizAttempts + mockQuestions lewat utils/gap.js, sama seperti halaman
 * Progress, supaya angka yang sama tidak pernah berbeda di dua halaman.
 *
 * Yang tersisa di sini memang tidak ada sumber datanya: quiz_attempts
 * tidak punya kolom durasi maupun tanggal_mulai, jadi "waktu belajar" dan
 * "streak" belum punya apa pun untuk dijumlahkan. Begitu tabelnya ada,
 * dua angka ini ikut hilang dari mock ini.
 *
 * Angka 612 menit dan streak 6/11 sengaja dibuat sama dengan mockProgress
 * supaya kedua halaman tidak terlihat beda padahal masih satu sumber.
 */
export const mockProfileActivity = {
  total_study_minutes: 612,
  current_streak_days: 6,
  longest_streak_days: 11,
  last_active_at: '2026-09-28T08:40:00',
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
