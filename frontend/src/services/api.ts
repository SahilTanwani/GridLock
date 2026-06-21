import { Camera, Violation } from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchCameras(): Promise<Camera[]> {
  const response = await fetch(`${API_BASE_URL}/api/cameras`);
  if (!response.ok) throw new Error('Failed to fetch cameras');
  return response.json();
}

export async function fetchViolations(): Promise<Violation[]> {
  const response = await fetch(`${API_BASE_URL}/api/violations`);
  if (!response.ok) throw new Error('Failed to fetch violations');
  return response.json();
}

export async function fetchStats(): Promise<{
  total_violations: number;
  active_cameras: number;
  pending_reviews: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

export async function uploadAndAnalyzeFile(file: File): Promise<{
  violations: Violation[];
  summary: {
    total_detected: number;
    high_confidence_count: number;
    estimated_fines: number;
  };
  gcp_url: string;
}> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/v1/detect`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('Inference or upload to GCP failed');
  return response.json();
}

