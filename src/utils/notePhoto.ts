import { Image } from "react-native";
import PhotoManipulator, { MimeType } from "react-native-photo-manipulator";

// 테이스팅 노트 첨부 사진 정책.
// 갤러리 원본(HEIC)은 서버가 400으로 거부하므로(§7 2026-08-05 스캔 사례와 동일 경로),
// 어떤 출처든 반드시 JPEG 재인코딩 + 다운사이즈를 거쳐 업로드한다.
export const NOTE_PHOTO_MAX_COUNT = 5;
// 마이페이지 그리드/피드 카드가 3:4(세로) cover로 렌더링되므로 크롭 프레임도 동일 비율.
export const NOTE_PHOTO_GRID_ASPECT = 3 / 4;

// 원본 픽셀 기준 크롭 영역
export interface NotePhotoRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 작성 화면의 첨부 사진 한 장. 크롭은 비파괴 — 원본(uri)을 계속 들고 있어야
// "조정"을 다시 눌렀을 때 프레이밍을 되살리거나 다르게 다시 자를 수 있다.
export interface NotePhoto {
  /** prepareNotePhoto를 거친 JPEG 원본. 크롭의 기준이자 크롭 미적용 시 업로드본 */
  uri: string;
  /** 크롭 적용본 — 미리보기·업로드에 우선 사용 */
  croppedUri?: string;
  /** 크롭 모달 재진입 시 프레이밍 복원용 영역(원본 픽셀 기준) */
  cropRegion?: NotePhotoRegion;
}

export const notePhotoDisplayUri = (photo: NotePhoto): string =>
  photo.croppedUri ?? photo.uri;
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

/**
 * 사용자가 고른 영역(원본 픽셀 기준)으로 잘라 JPEG로 저장한다.
 * 영역은 이미 prepareNotePhoto를 거친 JPEG 기준이므로 재인코딩만 신경 쓰면 된다.
 */
export async function cropNotePhoto(
  uri: string,
  region: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const scale = Math.min(
    1,
    NOTE_PHOTO_MAX_EDGE / Math.max(region.width, region.height)
  );
  const targetW = Math.max(1, Math.round(region.width * scale));
  const targetH = Math.max(1, Math.round(region.height * scale));

  return PhotoManipulator.batch(
    uri,
    [],
    region,
    { width: targetW, height: targetH },
    NOTE_PHOTO_QUALITY,
    MimeType.JPEG
  );
}
