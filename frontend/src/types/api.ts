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
