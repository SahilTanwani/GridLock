// ── Real backend detection types ─────────────────────────────────────────────

export interface DetectionViolation {
  violation_id: string;
  type: string;
  confidence: number;
  bbox: number[];
  camera_id: string;
  track_id: number | null;
  timestamp: string;
  frame?: number;
}

export interface PlateDetection {
  vehicle_bbox: number[];
  plate_text: string;
  valid: boolean;
}

export interface DetectionResult {
  camera_id: string;
  timestamp: string;
  signal?: string;
  object_counts?: Record<string, number>;
  violations: DetectionViolation[];
  total_violations: number;
  plates?: PlateDetection[];
  processing_ms: number;
  annotated_image_b64?: string;
  // Video-specific fields
  video_path?: string;
  resolution?: string;
  fps?: number;
  total_frames?: number;
  by_type?: Record<string, number>;
}

// ── Legacy types (used in detections grid) ───────────────────────────────────

export interface Camera {
  id: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Violation {
  id: string;
  violation_type: string;
  plate_number?: string;
  camera_id?: string;
  confidence?: number;
  timestamp: string;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED';
  fine_amount?: number;
  evidence_path?: string;
}
