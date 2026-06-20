import asyncio
import cv2
import numpy as np
from typing import Dict, Any, List

class TrafficViolationDetector:
    def __init__(self):
        # Mock initialization of ML models
        self.yolo_model = "YOLOv8x-mock"
        self.tracker = "ByteTrack-mock"
        self.ocr_model = "EasyOCR-mock"
        
        # --- ByteTrack State Management ---
        # Dictionary to track violations per vehicle across frames.
        # Key: vehicle track_id (str)
        # Value: Set of violation types already logged for this vehicle
        # Format: { "vehicle_id_1": {"stop_line_violation", "no_helmet"}, ... }
        self.violation_state: Dict[str, set] = {}

    def _mock_yolo_inference(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Mocks YOLOv8 + ByteTrack object detection and tracking."""
        # Returning a mock tracked vehicle
        return [
            {
                "track_id": "vehicle_892",
                "class_name": "car",
                "bbox": {"x1": 150, "y1": 200, "x2": 450, "y2": 400},
                "confidence": 0.94
            }
        ]
        
    def _mock_ocr_inference(self, frame: np.ndarray, bbox: Dict[str, int]) -> str:
        """Mocks EasyOCR license plate recognition on a cropped bounding box."""
        return "MH12AB1234"

    def _process_image_sync(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Synchronous ML inference for a single image.
        Decodes image, runs YOLOv8 and EasyOCR, and returns identified violations.
        """
        # Convert bytes to an OpenCV image array
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Invalid image bytes provided")

        detections = self._mock_yolo_inference(img)
        
        violations = []
        for det in detections:
            # Mock violation logic (e.g., vehicle is in a no-parking zone)
            plate = self._mock_ocr_inference(img, det["bbox"])
            
            violations.append({
                "violation_type": "illegal_parking",
                "plate_number": plate,
                "confidence": det["confidence"],
                "bbox": det["bbox"]
            })
            
        return {
            "status": "success",
            "violations": violations
        }

    async def process_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Async wrapper for single image processing.
        Uses asyncio.to_thread (standard library equivalent of starlette's run_in_threadpool)
        to prevent blocking the FastAPI event loop during heavy ML inference.
        """
        return await asyncio.to_thread(self._process_image_sync, image_bytes)

    def _process_video_stream_sync(self, video_path_or_uri: str) -> List[Dict[str, Any]]:
        """
        Synchronous video/RTSP stream processing loop.
        Implements ByteTrack state management to avoid duplicate violation logging.
        """
        cap = cv2.VideoCapture(video_path_or_uri)
        logged_violations = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break # End of video or stream interrupted
                
            # 1. Run YOLOv8 + ByteTrack inference on the current frame
            tracked_objects = self._mock_yolo_inference(frame)
            
            for obj in tracked_objects:
                track_id = obj["track_id"]
                
                # 2. Mock Violation Condition Check
                # (e.g., checking if the object's bbox intersects the stop-line polygon)
                detected_violation_type = "stop_line_violation" 
                
                # 3. STATE MANAGEMENT: Initialize state for new track_id
                if track_id not in self.violation_state:
                    self.violation_state[track_id] = set()
                    
                # 4. DEDUPLICATION LOGIC: Check if this vehicle has already been flagged
                #    for this specific violation in previous frames.
                if detected_violation_type not in self.violation_state[track_id]:
                    # NEW violation detected! Log it and update state immediately.
                    self.violation_state[track_id].add(detected_violation_type)
                    
                    # Extract License Plate (Only needed once per violation, saves compute!)
                    plate = self._mock_ocr_inference(frame, obj["bbox"])
                    
                    logged_violations.append({
                        "track_id": track_id,
                        "violation_type": detected_violation_type,
                        "plate_number": plate,
                        "confidence": obj["confidence"],
                        "bbox": obj["bbox"],
                        "frame_index": int(cap.get(cv2.CAP_PROP_POS_FRAMES))
                    })
                    
        cap.release()
        return logged_violations

    async def process_video_stream(self, video_path_or_uri: str) -> List[Dict[str, Any]]:
        """
        Async wrapper for processing a video stream.
        Offloads the blocking cv2.VideoCapture loop to a background thread pool.
        """
        return await asyncio.to_thread(self._process_video_stream_sync, video_path_or_uri)

# Instantiate a singleton to be used across the application
detector_service = TrafficViolationDetector()
