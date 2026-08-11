import { Image } from "react-native";
import PhotoManipulator, { MimeType } from "react-native-photo-manipulator";

// 테이스팅 노트 첨부 사진 정책.
// 갤러리 원본(HEIC)은 서버가 400으로 거부하므로(§7 2026-08-05 스캔 사례와 동일 경로),
// 어떤 출처든 반드시 JPEG 재인코딩 + 다운사이즈를 거쳐 업로드한다.
export const NOTE_PHOTO_MAX_COUNT = 5;
const NOTE_PHOTO_MAX_EDGE = 1600;
const NOTE_PHOTO_QUALITY = 85;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

/**
 * 첨부 사진을 업로드 가능한 JPEG로 변환한다.
 * width/height 메타데이터가 없으면 직접 읽어서라도 항상 재인코딩 경로를 탄다.
 */
export async function prepareNotePhoto(
  uri: string,
  width?: number,
  height?: number
): Promise<string> {
  let w = width;
  let h = height;
  if (!w || !h) {
    ({ width: w, height: h } = await getImageSize(uri));
  }

  const scale = Math.min(1, NOTE_PHOTO_MAX_EDGE / Math.max(w, h));
  const targetW = Math.max(1, Math.round(w * scale));
  const targetH = Math.max(1, Math.round(h * scale));

  return PhotoManipulator.batch(
    uri,
    [],
    { x: 0, y: 0, width: w, height: h },
    { width: targetW, height: targetH },
    NOTE_PHOTO_QUALITY,
    MimeType.JPEG
  );
}
