import PhotoManipulator, { MimeType } from "react-native-photo-manipulator";

export type ScanType = "label" | "list";

export type CropRect = { x: number; y: number; width: number; height: number };

// 스캔 타입별 서버 전송 이미지 스펙.
// - label: 병 라벨 근접 촬영, 텍스트 양이 적어 2048로 충분
// - list: 메뉴판 전체, 작은 글씨가 수십 줄이라 3072 + 높은 품질 필요
// aspectW/aspectH는 화면의 가이드 프레임 비율과 동일해야 한다 (중앙 크롭 시 사용자가
// 프레임 안에 넣은 피사체만 서버로 전달되도록).
export const SCAN_CONFIG: Record<
  ScanType,
  { aspectW: number; aspectH: number; maxEdge: number; quality: number }
> = {
  label: { aspectW: 1, aspectH: 1.1, maxEdge: 2048, quality: 90 },
  list: { aspectW: 1, aspectH: 1.45, maxEdge: 3072, quality: 92 },
};

/**
 * 이미지의 지정 영역을 잘라내고 긴 변이 maxEdge가 되도록 다운사이즈한다.
 * 크롭 영역은 이미지 경계 안으로 클램프된다.
 */
export async function cropRegionAndResize(
  uri: string,
  photoWidth: number,
  photoHeight: number,
  rect: CropRect,
  type: ScanType
): Promise<string> {
  const { maxEdge, quality } = SCAN_CONFIG[type];

  const cropX = Math.max(0, Math.min(Math.round(rect.x), photoWidth - 1));
  const cropY = Math.max(0, Math.min(Math.round(rect.y), photoHeight - 1));
  const cropW = Math.max(
    1,
    Math.min(Math.round(rect.width), photoWidth - cropX)
  );
  const cropH = Math.max(
    1,
    Math.min(Math.round(rect.height), photoHeight - cropY)
  );

  const longEdge = Math.max(cropW, cropH);
  const scale = Math.min(1, maxEdge / longEdge);
  const targetW = Math.max(1, Math.round(cropW * scale));
  const targetH = Math.max(1, Math.round(cropH * scale));

  return PhotoManipulator.batch(
    uri,
    [],
    { x: cropX, y: cropY, width: cropW, height: cropH },
    { width: targetW, height: targetH },
    quality,
    MimeType.JPEG
  );
}

/**
 * 사진의 중앙에서 scanType 프레임 비율에 맞는 영역을 잘라내고 maxEdge로 다운사이즈한다.
 * 화면의 가이드 프레임과 동일한 비율이어야 사용자가 "프레임 안"이라고 믿은 영역만
 * 서버에 전달된다. 프레임이 화면 중앙에서 약간 위쪽이긴 하지만 (dimOverlayTop flex 0.8
 * vs bottom flex 1.2) 실제 오차는 크지 않아 중앙 크롭으로 근사한다.
 */
export async function cropToFrame(
  uri: string,
  photoWidth: number,
  photoHeight: number,
  type: ScanType
): Promise<string> {
  const { aspectW, aspectH } = SCAN_CONFIG[type];
  const targetRatio = aspectW / aspectH; // width / height, 항상 < 1 (세로가 길다)
  const photoRatio = photoWidth / photoHeight;

  let cropW: number;
  let cropH: number;
  if (photoRatio > targetRatio) {
    // 사진이 프레임보다 가로로 넓다 → 좌우를 깎는다
    cropH = photoHeight;
    cropW = Math.round(cropH * targetRatio);
  } else {
    // 사진이 프레임보다 세로로 길다 → 위아래를 깎는다
    cropW = photoWidth;
    cropH = Math.round(cropW / targetRatio);
  }
  const cropX = Math.round((photoWidth - cropW) / 2);
  const cropY = Math.round((photoHeight - cropH) / 2);

  return cropRegionAndResize(
    uri,
    photoWidth,
    photoHeight,
    { x: cropX, y: cropY, width: cropW, height: cropH },
    type
  );
}

/**
 * 갤러리에서 고른 사진 등 프레임 구도가 없는 이미지는 크롭 없이 전체를 유지한 채
 * 긴 변이 maxEdge가 되도록 다운사이즈만 해서 서버로 보낸다.
 */
export async function downscaleToMaxEdge(
  uri: string,
  photoWidth: number,
  photoHeight: number,
  type: ScanType
): Promise<string> {
  return cropRegionAndResize(
    uri,
    photoWidth,
    photoHeight,
    { x: 0, y: 0, width: photoWidth, height: photoHeight },
    type
  );
}
