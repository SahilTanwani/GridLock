import { DetectionResult } from '../types/api';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://traffic-violation-api-660444655892.asia-south1.run.app';

const VIDEO_EXTS = /\.(mp4|avi|mkv|mov|m4v)$/i;

function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || VIDEO_EXTS.test(file.name);
}

/**
 * Upload image → POST /api/v1/detect/image/full  (JSON + annotated image b64)
 * Upload video → POST /api/v1/detect/video        (violation report JSON)
 */
export async function uploadAndAnalyzeFile(
  file: File,
  cameraId: string = 'CAM-01',
  maxFrames?: number,
): Promise<DetectionResult> {
  const formData = new FormData();
  formData.append('file', file);

  let url: string;
  if (isVideoFile(file)) {
    url = `${API_BASE_URL}/api/v1/detect/video?camera_id=${encodeURIComponent(cameraId)}&skip_frames=2`;
    if (maxFrames) url += `&max_frames=${maxFrames}`;
  } else {
    url = `${API_BASE_URL}/api/v1/detect/image/full?camera_id=${encodeURIComponent(cameraId)}`;
  }

  const response = await fetch(url, { method: 'POST', body: formData });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Detection failed (${response.status}): ${errText}`);
  }

  return response.json();
}

