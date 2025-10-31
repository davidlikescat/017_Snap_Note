import { TAG_CATEGORIES, CONTEXT_TYPES } from './constants';

export type Language = 'en' | 'ko' | 'ja' | 'es' | 'fr' | 'de';

// UI 텍스트 번역
export const translations = {
  en: {
    // Home page
    appTitle: 'Snap Note',
    appSubtitle: 'Simple to record! Smart to remember!',
    recordButton: 'Record',
    writeButton: 'Write',
    viewMemosButton: 'View Memos',
    settingsButton: 'Settings',

    // Record page
    startRecording: 'Start Recording',
    stopRecording: 'Stop Recording',
    recording: 'Recording...',
    processingAudio: 'Processing audio...',

    // Write page
    writeTitle: 'Write Memo',
    textPlaceholder: 'Type your thoughts here...',
    uploadFile: 'Upload File',
    uploadedFile: 'Uploaded:',
    supportedFormats: 'Supported formats: .txt, .md, .csv, .json, .log (Max 5MB)',
    submitButton: 'Submit',
    cancelButton: 'Cancel',
    refineWithAI: 'Refine with AI',
    refining: 'Refining with AI...',

    // Result page
    resultTitle: 'AI Refined Result',
    refined: 'Refined Text',
    tags: 'Tags',
    context: 'Context',
    insight: 'Insight',
    originalText: 'Original Text',
    saveButton: 'Save Memo',
    editButton: 'Edit',

    // Memo List
    memoListTitle: 'My Memos',
    searchPlaceholder: 'Search memos...',
    filterByTag: 'Filter by Tag',
    filterByContext: 'Filter by Context',
    noMemosFound: 'No memos found',
    loadMore: 'Load More',

    // Settings
    settingsTitle: 'Settings',
    language: 'Language',
    theme: 'Theme',
    about: 'About',

    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    back: 'Back',
  },
  ko: {
    // Home page
    appTitle: 'Snap Note',
    appSubtitle: '쉽게 기록하고 스마트하게 기억하세요!',
    recordButton: '녹음하기',
    writeButton: '작성하기',
    viewMemosButton: '메모 보기',
    settingsButton: '설정',

    // Record page
    startRecording: '녹음 시작',
    stopRecording: '녹음 중지',
    recording: '녹음 중...',
    processingAudio: '음성 처리 중...',

    // Write page
    writeTitle: '메모 작성',
    textPlaceholder: '여기에 생각을 입력하세요...',
    uploadFile: '파일 업로드',
    uploadedFile: '업로드됨:',
    supportedFormats: '지원 형식: .txt, .md, .csv, .json, .log (최대 5MB)',
    submitButton: '제출',
    cancelButton: '취소',
    refineWithAI: 'AI로 정제',
    refining: 'AI로 정제 중...',

    // Result page
    resultTitle: 'AI 정제 결과',
    refined: '정제된 텍스트',
    tags: '태그',
    context: '컨텍스트',
    insight: '인사이트',
    originalText: '원본 텍스트',
    saveButton: '메모 저장',
    editButton: '수정',

    // Memo List
    memoListTitle: '내 메모',
    searchPlaceholder: '메모 검색...',
    filterByTag: '태그로 필터',
    filterByContext: '컨텍스트로 필터',
    noMemosFound: '메모를 찾을 수 없습니다',
    loadMore: '더 보기',

    // Settings
    settingsTitle: '설정',
    language: '언어',
    theme: '테마',
    about: '정보',

    // Common
    loading: '로딩 중...',
    error: '오류',
    success: '성공',
    confirm: '확인',
    back: '뒤로',
  },
  ja: {
    // Home page
    appTitle: 'Snap Note',
    appSubtitle: '簡単に記録して、スマートに覚えよう！',
    recordButton: '録音',
    writeButton: '書く',
    viewMemosButton: 'メモを見る',
    settingsButton: '設定',

    // Record page
    startRecording: '録音開始',
    stopRecording: '録音停止',
    recording: '録音中...',
    processingAudio: '音声処理中...',

    // Write page
    writeTitle: 'メモ作成',
    textPlaceholder: 'ここに考えを入力してください...',
    uploadFile: 'ファイルアップロード',
    uploadedFile: 'アップロード済み:',
    supportedFormats: '対応形式: .txt, .md, .csv, .json, .log (最大5MB)',
    submitButton: '送信',
    cancelButton: 'キャンセル',
    refineWithAI: 'AIで精製',
    refining: 'AIで精製中...',

    // Result page
    resultTitle: 'AI精製結果',
    refined: '洗練されたテキスト',
    tags: 'タグ',
    context: 'コンテキスト',
    insight: 'インサイト',
    originalText: '元のテキスト',
    saveButton: 'メモを保存',
    editButton: '編集',

    // Memo List
    memoListTitle: '私のメモ',
    searchPlaceholder: 'メモを検索...',
    filterByTag: 'タグでフィルター',
    filterByContext: 'コンテキストでフィルター',
    noMemosFound: 'メモが見つかりません',
    loadMore: 'もっと見る',

    // Settings
    settingsTitle: '設定',
    language: '言語',
    theme: 'テーマ',
    about: '情報',

    // Common
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
    confirm: '確認',
    back: '戻る',
  },
  es: {
    // Home page
    appTitle: 'Snap Note',
    appSubtitle: '¡Registra fácilmente, recuerda con inteligencia!',
    recordButton: 'Grabar',
    writeButton: 'Escribir',
    viewMemosButton: 'Ver Notas',
    settingsButton: 'Configuración',

    // Record page
    startRecording: 'Iniciar Grabación',
    stopRecording: 'Detener Grabación',
    recording: 'Grabando...',
    processingAudio: 'Procesando audio...',

    // Write page
    writeTitle: 'Escribir Nota',
    textPlaceholder: 'Escribe tus pensamientos aquí...',
    uploadFile: 'Subir Archivo',
    uploadedFile: 'Subido:',
    supportedFormats: 'Formatos compatibles: .txt, .md, .csv, .json, .log (Máx 5MB)',
    submitButton: 'Enviar',
    cancelButton: 'Cancelar',
    refineWithAI: 'Refinar con IA',
    refining: 'Refinando con IA...',

    // Result page
    resultTitle: 'Resultado Refinado por IA',
    refined: 'Texto Refinado',
    tags: 'Etiquetas',
    context: 'Contexto',
    insight: 'Perspectiva',
    originalText: 'Texto Original',
    saveButton: 'Guardar Nota',
    editButton: 'Editar',

    // Memo List
    memoListTitle: 'Mis Notas',
    searchPlaceholder: 'Buscar notas...',
    filterByTag: 'Filtrar por Etiqueta',
    filterByContext: 'Filtrar por Contexto',
    noMemosFound: 'No se encontraron notas',
    loadMore: 'Cargar Más',

    // Settings
    settingsTitle: 'Configuración',
    language: 'Idioma',
    theme: 'Tema',
    about: 'Acerca de',

    // Common
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    confirm: 'Confirmar',
    back: 'Volver',
  },
  fr: {
    // Home page
    appTitle: 'Snap Note',
    appSubtitle: 'Enregistrez en un instant, souvenez-vous intelligemment !',
    recordButton: 'Enregistrer',
    writeButton: 'Écrire',
    viewMemosButton: 'Voir les Notes',
    settingsButton: 'Paramètres',

    // Record page
    startRecording: 'Démarrer l\'Enregistrement',
    stopRecording: 'Arrêter l\'Enregistrement',
    recording: 'Enregistrement...',
    processingAudio: 'Traitement audio...',

    // Write page
    writeTitle: 'Écrire une Note',
    textPlaceholder: 'Écrivez vos pensées ici...',
    uploadFile: 'Télécharger un Fichier',
    uploadedFile: 'Téléchargé:',
    supportedFormats: 'Formats pris en charge: .txt, .md, .csv, .json, .log (Max 5MB)',
    submitButton: 'Envoyer',
    cancelButton: 'Annuler',
    refineWithAI: 'Raffiner avec IA',
    refining: 'Raffinage avec IA...',

    // Result page
    resultTitle: 'Résultat Raffiné par IA',
    refined: 'Texte Raffiné',
    tags: 'Tags',
    context: 'Contexte',
    insight: 'Perspicacité',
    originalText: 'Texte Original',
    saveButton: 'Sauvegarder la Note',
    editButton: 'Modifier',

    // Memo List
    memoListTitle: 'Mes Notes',
    searchPlaceholder: 'Rechercher des notes...',
    filterByTag: 'Filtrer par Tag',
    filterByContext: 'Filtrer par Contexte',
    noMemosFound: 'Aucune note trouvée',
    loadMore: 'Charger Plus',

    // Settings
    settingsTitle: 'Paramètres',
    language: 'Langue',
    theme: 'Thème',
    about: 'À propos',

    // Common
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    confirm: 'Confirmer',
    back: 'Retour',
  },
  de: {
    // Home page
    appTitle: 'Snap Note',
    appSubtitle: 'Schnell notieren, clever behalten!',
    recordButton: 'Aufnehmen',
    writeButton: 'Schreiben',
    viewMemosButton: 'Notizen Ansehen',
    settingsButton: 'Einstellungen',

    // Record page
    startRecording: 'Aufnahme Starten',
    stopRecording: 'Aufnahme Stoppen',
    recording: 'Aufnahme läuft...',
    processingAudio: 'Audio wird verarbeitet...',

    // Write page
    writeTitle: 'Notiz Schreiben',
    textPlaceholder: 'Geben Sie hier Ihre Gedanken ein...',
    uploadFile: 'Datei Hochladen',
    uploadedFile: 'Hochgeladen:',
    supportedFormats: 'Unterstützte Formate: .txt, .md, .csv, .json, .log (Max 5MB)',
    submitButton: 'Senden',
    cancelButton: 'Abbrechen',
    refineWithAI: 'Mit KI Verfeinern',
    refining: 'Verfeinerung mit KI...',

    // Result page
    resultTitle: 'KI-Verfeinertes Ergebnis',
    refined: 'Verfeinerter Text',
    tags: 'Tags',
    context: 'Kontext',
    insight: 'Einsicht',
    originalText: 'Originaltext',
    saveButton: 'Notiz Speichern',
    editButton: 'Bearbeiten',

    // Memo List
    memoListTitle: 'Meine Notizen',
    searchPlaceholder: 'Notizen suchen...',
    filterByTag: 'Nach Tag Filtern',
    filterByContext: 'Nach Kontext Filtern',
    noMemosFound: 'Keine Notizen gefunden',
    loadMore: 'Mehr Laden',

    // Settings
    settingsTitle: 'Einstellungen',
    language: 'Sprache',
    theme: 'Design',
    about: 'Über',

    // Common
    loading: 'Lädt...',
    error: 'Fehler',
    success: 'Erfolg',
    confirm: 'Bestätigen',
    back: 'Zurück',
  }
} as const;

// 언어별 텍스트 가져오기
export function getText(key: keyof typeof translations.en, language: Language): string {
  return translations[language][key];
}

// 태그를 언어별로 가져오기
export function getTagsByLanguage(language: Language) {
  const tags: string[] = [];
  Object.values(TAG_CATEGORIES).forEach(category => {
    tags.push(...category[language]);
  });
  return tags;
}

// 컨텍스트를 언어별로 가져오기
export function getContextsByLanguage(language: Language) {
  return Object.values(CONTEXT_TYPES).map(ctx => ctx[language]);
}

// 특정 태그를 다른 언어로 변환
export function translateTag(tag: string, targetLanguage: Language): string {
  for (const category of Object.values(TAG_CATEGORIES)) {
    const enIndex = category.en.indexOf(tag);
    if (enIndex !== -1) {
      return category[targetLanguage][enIndex];
    }
    const koIndex = category.ko.indexOf(tag);
    if (koIndex !== -1) {
      return category[targetLanguage][koIndex];
    }
  }
  return tag;
}

// 특정 컨텍스트를 다른 언어로 변환
export function translateContext(context: string, targetLanguage: Language): string {
  for (const [key, value] of Object.entries(CONTEXT_TYPES)) {
    if (value.en === context) {
      return value[targetLanguage];
    }
    if (value.ko === context) {
      return value[targetLanguage];
    }
  }
  return context;
}
