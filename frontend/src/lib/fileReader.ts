// 파일에서 텍스트 추출하는 유틸리티 함수

export async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

// 지원하는 파일 타입 확인
export function isTextFile(file: File): boolean {
  const textTypes = [
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
  ];

  const textExtensions = [
    '.txt',
    '.md',
    '.markdown',
    '.csv',
    '.json',
    '.log',
  ];

  const hasTextType = textTypes.includes(file.type);
  const hasTextExtension = textExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  return hasTextType || hasTextExtension;
}

// 파일 크기 체크 (5MB 제한)
export function isFileSizeValid(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

// 파일 유효성 검사
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFile(file: File): FileValidationResult {
  if (!isTextFile(file)) {
    return {
      isValid: false,
      error: 'Only text files (.txt, .md, .csv, .json, .log) are supported',
    };
  }

  if (!isFileSizeValid(file)) {
    return {
      isValid: false,
      error: 'File size must be less than 5MB',
    };
  }

  return { isValid: true };
}
