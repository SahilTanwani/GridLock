# Traffic Violation Detection System
## Complete System Context & Resource Reference

> **Competition:** Flipkart Gridlock Hackathon  
> **Challenge:** Automated Photo Identification and Classification for Traffic Violations Using Computer Vision  
> **Stack:** Python · YOLOv8 · EasyOCR · OpenCV · FastAPI · PostgreSQL

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Module 1 — Image Preprocessing](#4-module-1--image-preprocessing)
5. [Module 2 — Vehicle & Road User Detection](#5-module-2--vehicle--road-user-detection)
6. [Module 3 — Helmet Non-Compliance Detection](#6-module-3--helmet-non-compliance-detection)
7. [Module 4 — Seatbelt Non-Compliance Detection](#7-module-4--seatbelt-non-compliance-detection)
8. [Module 5 — Triple Riding Detection](#8-module-5--triple-riding-detection)
9. [Module 6 — Wrong-Side Driving Detection](#9-module-6--wrong-side-driving-detection)
10. [Module 7 — Stop-Line Violation Detection](#10-module-7--stop-line-violation-detection)
11. [Module 8 — Red-Light Violation Detection](#11-module-8--red-light-violation-detection)
12. [Module 9 — Illegal Parking Detection](#12-module-9--illegal-parking-detection)
13. [Module 10 — License Plate Recognition (ANPR)](#13-module-10--license-plate-recognition-anpr)
14. [Module 11 — Evidence Generation](#14-module-11--evidence-generation)
15. [Module 12 — Analytics & Reporting](#15-module-12--analytics--reporting)
16. [Module 13 — Performance Evaluation](#16-module-13--performance-evaluation)
17. [Datasets Reference](#17-datasets-reference)
18. [Research Papers Reference](#18-research-papers-reference)
19. [Implementation Roadmap](#19-implementation-roadmap)
20. [API Reference Skeleton](#20-api-reference-skeleton)

---

## 1. Problem Statement

Manual inspection of traffic surveillance footage is labour-intensive, inconsistent, and unscalable. With thousands of CCTV cameras generating continuous footage across Indian cities, an automated computer-vision system is needed to:

- Detect and localise vehicles and road users in images
- Identify seven categories of traffic violations
- Read license plates to identify offenders
- Generate annotated photographic evidence with metadata
- Produce searchable violation records and trend analytics

**Target violations:**

| # | Violation | Description |
|---|-----------|-------------|
| 1 | Helmet non-compliance | Rider on two-wheeler without helmet |
| 2 | Seatbelt non-compliance | Car driver without seatbelt |
| 3 | Triple riding | More than two persons on a two-wheeler |
| 4 | Wrong-side driving | Vehicle moving against traffic direction |
| 5 | Stop-line violation | Vehicle crossing stop-line at intersection |
| 6 | Red-light violation | Vehicle crossing during red signal |
| 7 | Illegal parking | Vehicle stationary in no-parking zone |

---

## 2. System Architecture Overview

```
Raw Traffic Image / Video Frame
          │
          ▼
┌─────────────────────────────────┐
│   MODULE 1: Image Preprocessing │  CLAHE · Gamma · Dehaze · Deblur
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  MODULE 2: Object Detection     │  YOLOv8x (COCO) + ByteTrack
│  Vehicles · Persons · Lights    │
└────────────────┬────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌─────────────────────────┐
│  VIOLATION   │   │  LICENSE PLATE           │
│  DETECTION   │   │  RECOGNITION (ANPR)      │
│  Modules 3-9 │   │  YOLOv8 + EasyOCR        │
└──────┬───────┘   └────────────┬────────────┘
       │                        │
       └───────────┬────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  EVIDENCE GENERATION │  Annotated JPEG + JSON metadata
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  DATABASE STORAGE    │  PostgreSQL / SQLite
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  ANALYTICS DASHBOARD │  FastAPI + Plotly/Streamlit
        └──────────────────────┘
```

### Detection Pipeline Logic

```
For each frame:
  enhanced   = preprocess(frame)
  detections = yolov8x(enhanced)          ← base detections (all objects)
  tracks     = bytetrack(detections)      ← assign persistent IDs

  for each detection:
    if motorcycle:
      → check_helmet(riders)              ← Module 3
      → count_riders(motorcycle)          ← Module 5
    if car/truck/bus:
      → check_seatbelt(driver_region)     ← Module 4
    if any vehicle:
      → check_wrong_side(trajectory)      ← Module 6
      → check_stop_line(bbox, signal)     ← Module 7 + 8
      → check_parking_zone(bbox, time)    ← Module 9
      → read_plate(vehicle_bbox)          ← Module 10

  if violation_found:
    → generate_evidence(frame, violation) ← Module 11
    → store_record(db)
    → update_analytics()                  ← Module 12
```

---

## 3. Technology Stack

### Core Libraries

| Package | Version | Purpose | Install |
|---------|---------|---------|---------|
| `ultralytics` | ≥ 8.2.0 | YOLOv8 detection + tracking + training | `pip install ultralytics` |
| `easyocr` | ≥ 1.7.0 | License plate OCR (supports English + Indian scripts) | `pip install easyocr` |
| `opencv-python` | ≥ 4.9.0 | Image processing, annotation, video I/O | `pip install opencv-python` |
| `supervision` | ≥ 0.21.0 | Annotation utilities, ByteTrack wrapper | `pip install supervision` |
| `roboflow` | ≥ 1.1.0 | Dataset management, model hosting | `pip install roboflow` |
| `torch` + `torchvision` | ≥ 2.2.0 | PyTorch backend for all DL models | `pip install torch torchvision` |
| `fastapi` | ≥ 0.111 | REST API backend | `pip install fastapi uvicorn` |
| `plotly` | ≥ 5.20 | Interactive analytics dashboard | `pip install plotly dash` |
| `sqlalchemy` | ≥ 2.0 | ORM for violation database | `pip install sqlalchemy` |
| `psycopg2` | ≥ 2.9 | PostgreSQL adapter | `pip install psycopg2-binary` |
| `ultralyticsplus` | ≥ 0.0.28 | Load YOLOv8 models from HuggingFace Hub | `pip install ultralyticsplus` |

### Single Install Command

```bash
pip install ultralytics>=8.2.0 easyocr>=1.7.0 supervision>=0.21.0 \
            roboflow ultralyticsplus opencv-python \
            fastapi uvicorn sqlalchemy psycopg2-binary \
            plotly dash streamlit matplotlib pillow requests tqdm
```

### Hardware Requirements

| Tier | Hardware | Performance | Use Case |
|------|----------|-------------|----------|
| Minimum | CPU only (8-core) | ~2-3 FPS | Offline batch processing |
| Recommended | NVIDIA T4 (16GB VRAM) | ~15-20 FPS | Real-time single camera |
| Production | NVIDIA A100 (40GB) | ~60+ FPS | Multi-camera real-time |
| Edge | NVIDIA Jetson Orin | ~8-12 FPS | On-device at camera |

---

## 4. Module 1 — Image Preprocessing

**Goal:** Normalise raw surveillance images before passing to detectors. Poor image quality is the single largest cause of false negatives in traffic violation detection.

### Techniques Applied

| Degradation | Method | Library | Notes |
|-------------|--------|---------|-------|
| Low contrast | CLAHE | `cv2.createCLAHE()` | clip_limit=2.5, tile=(8,8) |
| Low light | Gamma correction | OpenCV LUT | γ = 1.8–2.2 |
| Noise | Non-local means denoising | `cv2.fastNlMeansDenoisingColored()` | h=9 |
| Motion blur | Unsharp masking | OpenCV | kernel=5, strength=1.6 |
| Haze / fog | Dark Channel Prior | Custom implementation | Single-image method |
| Rain streaks | MPRNet | PyTorch | See deep learning method below |
| Overexposure | Gamma dim + CLAHE | OpenCV LUT | γ = 0.5–0.7 |

### Advanced Deep-Learning Preprocessors

**Low-light Enhancement — Zero-DCE**
- Paper: *Zero-Reference Deep Curve Estimation for Low-Light Image Enhancement* (CVPR 2020)
- GitHub: https://github.com/Li-Chongyi/Zero-DCE
- GitHub (Zero-DCE++): https://github.com/Li-Chongyi/Zero-DCE_extension
- No paired training data required. Runs at real-time.

**Multi-degradation Restoration — MPRNet**
- Paper: *Multi-Stage Progressive Image Restoration* (CVPR 2021)
- GitHub: https://github.com/swz30/MPRNet
- Handles: deraining · deblurring · denoising in one model

**Motion Deblur — DeblurGAN-v2**
- Paper: *DeblurGAN-v2: Deblurring (Orders-of-Magnitude) Faster and Better* (ICCV 2019)
- GitHub: https://github.com/VITA-Group/DeblurGANv2
- Pretrained weights: included in repo release

**Single-Image Dehazing — AOD-Net**
- Paper: *AOD-Net: All-in-One Dehazing Network* (ICCV 2017)
- GitHub: https://github.com/TheFairBear/PyTorch-Image-Dehazing
- Lightweight enough for real-time use

**Unified Low-Light Traffic Enhancement (2024)**
- Paper: *Unified Low-Light Traffic Image Enhancement via Multi-Stage Illumination Recovery*
- ArXiv: https://arxiv.org/pdf/2511.17612
- Designed specifically for traffic surveillance scenes

### Auto-Routing Logic

```python
def auto_enhance(img):
    brightness = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).mean()
    blur_score = cv2.Laplacian(img, cv2.CV_64F).var()

    if brightness < 60:
        img = zero_dce(img)          # deep low-light model
    elif brightness < 100:
        img = gamma_correction(img, gamma=1.8)
        img = clahe(img)
    if blur_score < 80:
        img = deblur_unsharp(img)    # or DeblurGAN for severe blur
    return img
```

---

## 5. Module 2 — Vehicle & Road User Detection

**Goal:** Detect and track all vehicles, riders, and pedestrians. This module feeds every downstream violation detector.

### Primary Model — YOLOv8x (COCO)

- Repository: https://github.com/ultralytics/ultralytics
- Weights: Auto-downloaded on first run (`YOLO('yolov8x.pt')`)
- Pretrained dataset: COCO 2017 (80 classes)
- Relevant COCO classes used:

| Class ID | Class Name | Traffic Relevance |
|----------|-----------|-------------------|
| 0 | person | Rider / pedestrian |
| 1 | bicycle | Two-wheeler |
| 2 | car | Four-wheeler |
| 3 | motorcycle | Two-wheeler (violations) |
| 5 | bus | Commercial vehicle |
| 7 | truck | Heavy vehicle |
| 9 | traffic light | Signal state detection |

**Model variants and their trade-offs:**

| Variant | Params | mAP50-95 | Speed (A100) | Use Case |
|---------|--------|----------|--------------|---------|
| YOLOv8n | 3.2M | 37.3 | 0.99ms | Edge / low-power |
| YOLOv8s | 11.2M | 44.9 | 1.20ms | Balanced |
| YOLOv8m | 25.9M | 50.2 | 1.83ms | Recommended |
| YOLOv8x | 68.2M | 53.9 | 3.53ms | Best accuracy |
| YOLOv11x | 56.9M | 54.7 | 3.79ms | Latest (2024) |

### Multi-Object Tracker — ByteTrack

- Paper: *ByteTrack: Multi-Object Tracking by Associating Every Detection Box* (ECCV 2022)
- GitHub: https://github.com/FoundationVision/ByteTrack
- ArXiv: https://arxiv.org/abs/2110.06864
- Key advantage: Associates low-confidence detections (occluded vehicles) with existing tracks — critical for wrong-side and parking detection
- Integration: Built into Ultralytics ≥ 8.0 via `model.track(source, tracker="bytetrack.yaml")`

### Tracker Comparison

| Tracker | Speed | Re-ID | Best For |
|---------|-------|-------|---------|
| ByteTrack | ⚡⚡⚡ | No | Vehicle counting, speed, direction |
| DeepSORT | ⚡⚡ | Yes | Person re-identification |
| StrongSORT | ⚡ | Yes | Long-term identity preservation |
| BoT-SORT | ⚡⚡ | Yes | Crowded scenes |

**YOLOv8 + multi-tracker integration library:**
- GitHub: https://github.com/mikel-brostrom/boxmot
- Supports: ByteTrack, DeepSORT, StrongSORT, BoT-SORT, OC-SORT, HybridSORT

### Pose Estimation (for rider count)

- Model: YOLOv8-pose (built into Ultralytics)
- Usage: `YOLO('yolov8x-pose.pt')` — detects 17 keypoints per person
- Useful for helmet detection (head keypoint) and triple riding (count of torso keypoints per motorcycle)

---

## 6. Module 3 — Helmet Non-Compliance Detection

**Goal:** Detect riders on motorcycles who are not wearing helmets.

### Primary Reference Implementation

**ThanhSan97 — Helmet Violation Detection (YOLOv8 + VGG16)**
- GitHub: https://github.com/ThanhSan97/Helmet-Violation-Detection-Using-YOLO-and-VGG16
- Architecture: 3-stage pipeline
  - Stage 1: YOLOv8 motorcycle detector
  - Stage 2: YOLOv8 helmet + license plate detector (on cropped motorcycle)
  - Stage 3: VGG16 character recognition on plate crop
- Dataset (Roboflow): https://universe.roboflow.com/cdio-zmfmj/helmet-lincense-plate-detection-gevlq

**YOLOv3 + ANPR Full Pipeline**
- GitHub: https://github.com/sriramcu/yolov3_traffic_violations
- Includes: helmet detection → ANPR → automatic challan generation
- Uses: `BlcaKHat/yolov3-Helmet-Detection` + `qqwweee/keras-yolo3`

**E-Challan System (MERN + YOLOv8)**
- GitHub: https://github.com/nishithamakam/TrafficVoilationMonitoring
- Full stack: detection + license plate + SMS challan via Twilio API

### Datasets

| Dataset | Images | Classes | Link |
|---------|--------|---------|------|
| Helmet + License Plate (Roboflow) | ~1,400 | helmet, no-helmet, license-plate | https://universe.roboflow.com/cdio-zmfmj/helmet-lincense-plate-detection-gevlq |
| Bike Helmet Detection (Roboflow) | 1,376 | with_helmet, without_helmet | https://universe.roboflow.com/search?q=bike-helmet-detection |
| HelmetViolations (Kaggle) | 1,004 | helmet, no_helmet | https://www.kaggle.com/datasets/pkdarabi/helmet |
| IDD — Indian Driving Dataset | 10,000+ | Indian road scenes | https://idd.insaan.iiit.ac.in/ |

### Published Performance (DCGANs + YOLOv8)

- Paper: *Enforcing Traffic Safety: Detecting Motorcyclists' Helmet Violations Using YOLOv8 and DCGAN* (MDPI Algorithms, May 2024)
- DOI: https://doi.org/10.3390/a17050202
- Results: F1 = 0.96 (DCGANs + YOLOv8), vs F1 = 0.91 (standalone YOLOv8)
- Key finding: Synthetic DCGAN augmentation on minority class (no-helmet) significantly improves recall

### Detection Logic

```python
# For each motorcycle detected:
motorcycle_bbox = [x1, y1, x2, y2]

# Find persons overlapping this motorcycle
riders = [p for p in persons if overlap(p.bbox, motorcycle_bbox) > 0.25]

# For each rider, check head region for helmet
for rider in riders:
    head_region = [rider.x1, rider.y1, rider.x2, rider.y1 + (rider.y2-rider.y1)*0.4]
    helmet_found = any(iou(head_region, h.bbox) > 0.15 for h in helmet_detections)
    if not helmet_found:
        flag_violation('helmet_non_compliance', rider)
```

---

## 7. Module 4 — Seatbelt Non-Compliance Detection

**Goal:** Detect car drivers who are not wearing seatbelts.

### Primary Reference Implementations

**DW-YOLOv8 — Indian Traffic Optimised**
- GitHub: https://github.com/KorkanaRahul/Seatbelt-Detection-Using-DWYOLOv8-Model
- Architecture: Two-phase
  - Phase 1: YOLOv5 detects vehicle windshield ROI
  - Phase 2: Custom DW-YOLOv8 (depth-wise convolutions) classifies seatbelt inside crop
- Optimised for Indian traffic scenarios and angles

**YOLOv5 + Keras Classifier**
- GitHub: https://github.com/sankethsj/seatbelt-detection
- Confidence: 0.99 on test set
- Kaggle pretrained weights: https://www.kaggle.com/datasets/sachinmlwala/seatbelt3

**YOLOv5 / v8 / v9 Comparative Study**
- GitHub: https://github.com/HayaAbdullahM/Seat-Belt-Detection
- Evaluates all three YOLO versions on identical dataset — use for model selection

### Dataset

| Dataset | Link |
|---------|------|
| Seatbelt class (Roboflow Universe) | https://universe.roboflow.com/search?q=class%3Aseatbelt |
| Driver + seatbelt dataset (Roboflow) | https://universe.roboflow.com/search?q=CoDriver-Seatbelt |

### Two-Phase Detection Logic

```python
# Phase 1: Locate windshield ROI within vehicle bounding box
windshield = crop(vehicle_bbox, top=0.05, bottom=0.45, left=0.15, right=0.85)

# Phase 2: Run DW-YOLOv8 seatbelt classifier on windshield crop
result = dw_yolov8(windshield)
if 'no_seatbelt' in result.classes:
    flag_violation('seatbelt_non_compliance', vehicle)
```

---

## 8. Module 5 — Triple Riding Detection

**Goal:** Detect motorcycles carrying more than two persons.

### Primary Reference Implementations

**Triple-Rider-Detection (YOLOv8, 6,000+ images)**
- GitHub: https://github.com/kashishparmar02/triple-rider-detection
- Dataset: 6,000+ images covering triple riding + helmet + mobile usage
- Classes: with_helmet, without_helmet, triple_rider, mobile_usage
- Integration: Uses Roboflow API for dataset management

**TR-TRVD — YOLOv8-BBIA (Published Research)**
- Paper: *TR-TRVD: Triple Riders — Traffic Rule Violation Detection using YOLOv8-BBIA for Intelligent Transportation System*
- ResearchGate: https://www.researchgate.net/publication/388789875
- Journal: Nanotechnology Perceptions, Vol. 20, No. S14 (2024), pp. 3573–3586
- Results: mAP@0.5-0.95 = 52.3%, outperforms YOLOv7 by 6.2% on mAP@0.5
- Architecture: YOLOv8 with Bottleneck Attention + Bi-directional feature aggregation

**Smart Detection System (Combined Violations)**
- Paper: *Smart Traffic Violation Detection System Using YOLOv8*
- Journal: Journal of Soft Computing Paradigm (Feb 2026)
- URL: https://irojournals.com/jscp/article/view/1635
- Results: Helmet precision = 89.91%, Triple riding precision = 76.63%

### Detection Logic

```python
# Count persons associated with each motorcycle
for motorcycle in motorcycles:
    expanded_bbox = expand_upward(motorcycle.bbox, factor=0.5)  # capture rider bodies
    riders = [p for p in persons if overlap(p.bbox, expanded_bbox) > 0.20]

    if len(riders) > 2:
        flag_violation('triple_riding', motorcycle, rider_count=len(riders))
```

---

## 9. Module 6 — Wrong-Side Driving Detection

**Goal:** Detect vehicles moving against the expected traffic direction.

### Primary Reference Implementations

**YOLOv4 Wrong-Side Driving Detection**
- GitHub: https://github.com/sriramcu/yolov4_wrong_side_driving_detection
- Uses: YOLOv4 detection + trajectory direction analysis
- Method: Track vehicle centroid across frames; compute movement vector; compare to expected lane direction

**Full Multi-Violation System (includes wrong-side)**
- GitHub: https://github.com/sakibreza/Traffic-Rules-Violation-Detection-System
- GitHub (fork): https://github.com/rahatzamancse/Traffic-Rules-Violation-Detection
- Covers: signal violation + parking violation + direction violation
- Direction detection: Divides road into regions; checks centroid movement between regions

**AI-Powered Traffic Rules Violation Detection (2025)**
- Published system covering: wrong-side + one-way + helmet + mobile phone + number plate
- URL: https://www.ijraset.com/best-journal/traffic-eye-ai-powered-traffic-rules-violation-detection-and-management

### Trajectory-Based Algorithm

```python
class WrongSideDetector:
    def __init__(self, expected_direction='up'):
        # 'up'=vehicles move toward top of frame (common for road-facing cameras)
        self.trajectories = defaultdict(deque)

    def update(self, track_id, bbox):
        cx, cy = center(bbox)
        self.trajectories[track_id].append((cx, cy))

        if len(self.trajectories[track_id]) >= 5:
            dx = trajectory[-1][0] - trajectory[0][0]
            dy = trajectory[-1][1] - trajectory[0][1]
            angle = atan2(dy, dx)  # in degrees
            expected = {'up': -90, 'down': 90, 'left': 180, 'right': 0}
            diff = abs(angle - expected[self.expected_direction])

            if diff > 120:  # threshold: configurable
                flag_violation('wrong_side_driving', track_id)
```

---

## 10. Module 7 — Stop-Line Violation Detection

**Goal:** Detect vehicles that cross the stop-line at an intersection.

### Primary Reference Implementations

**Traffic-Violation-Detection (Stop-line + Parking + ANPR + MySQL)**
- GitHub: https://github.com/FarzadNekouee/Traffic-Violation-Detection
- Features: real-time traffic light recognition, adaptive night-time stop-line detection, PyTesseract OCR, MySQL logging

**Traffic Signal Violation System (YOLOv3 + GUI)**
- GitHub: https://github.com/anmspro/Traffic-Signal-Violation-Detection-System
- GUI: Tkinter-based for operator use
- Method: User draws stop-line on preview frame; system monitors crossings

**Multi-Violation System (stop-line + parking + direction)**
- GitHub: https://github.com/sakibreza/Traffic-Rules-Violation-Detection-System
- SQLite database + Python backend

**Roboflow Stop-Sign Violation Tutorial (2024)**
- Blog + code: https://blog.roboflow.com/stop-sign-violation-detection/
- Uses RF-DETR for vehicle detection, wheel keypoint detection for precision
- Method: Virtual stop-zone polygon + front-wheel tracking

### Virtual Line Algorithm

```python
STOP_LINE_Y = 340  # pixel y-coordinate in camera frame (configure per camera)

def check_stop_line(track_id, current_bbox, previous_bbox, signal_state):
    current_bottom  = current_bbox[3]
    previous_bottom = previous_bbox[3]

    # Crossed this frame (bottom edge went from above to below stop line)
    just_crossed = previous_bottom < STOP_LINE_Y <= current_bottom

    if just_crossed and signal_state == 'red':
        flag_violation('stop_line_violation', track_id)
```

---

## 11. Module 8 — Red-Light Violation Detection

**Goal:** Detect vehicles that cross an intersection while the signal shows red.

### Primary Reference Implementations

**Traffic Signal Violation Detection (YOLOv8 + ROI polygon)**
- GitHub: https://github.com/MohammedHamza0/Traffic-Signal-Violation-Detection
- Method: Brightness analysis on traffic light ROI to detect active red; polygon-based vehicle crossing detection

**Traffic Light Color Recognition (YOLOv8)**
- GitHub: https://github.com/farukalamai/traffic-lights-detection-and-color-recognition-using-yolov8
- Fine-tuned YOLOv8 specifically for traffic light colour classification
- Classes: red, yellow, green

**Traffic Signal Violation System (YOLOv3 + Tkinter GUI)**
- GitHub: https://github.com/anmspro/Traffic-Signal-Violation-Detection-System
- Fully automated red-light Violation: https://github.com/AhmadYahya97/Fully-Automated-red-light-Violation-Detection

**Published Research — YOLOv5s Red-Light Violation**
- Paper: *Automatic Traffic Red-Light Violation Detection Using AI* (ISI Journal, 2022)
- Academia.edu: https://www.academia.edu/78850555/Automatic_Traffic_Red_Light_Violation_Detection_Using_AI
- Results: 82% vehicle ID accuracy, 90% signal-state accuracy, 86% violation detection accuracy
- Method: Modified YOLOv5s + COCO re-training

### Traffic Light Color Classifier (HSV)

```python
def classify_light_color(img, light_bbox):
    crop = img[y1:y2, x1:x2]
    h, w = crop.shape[:2]

    # Standard layout: red=top third, amber=middle, green=bottom
    zones = {
        'red'  : crop[:h//3,  :],
        'amber': crop[h//3:2*h//3, :],
        'green': crop[2*h//3:, :]
    }
    # Find brightest zone → active colour
    brightness = {k: cv2.cvtColor(z, cv2.COLOR_BGR2HSV)[:,:,2].mean()
                  for k, z in zones.items()}
    return max(brightness, key=brightness.get)  # 'red' | 'amber' | 'green'
```

---

## 12. Module 9 — Illegal Parking Detection

**Goal:** Detect vehicles that park in designated no-parking zones.

### Primary Reference Implementations

**Illegal-Parking-Detection (YOLOv8 + JSON + JPEG evidence)**
- GitHub: https://github.com/Kevinjoythomas/Illegal-Parking-Detection
- Saves: vehicle ID, timestamp, captured image on violation
- Output: JSON logs + JPEG images for evidence

**Illegal Parking Detection (YOLOv4, zone logic)**
- GitHub: https://github.com/prakharninja0927/illegal-Parking-Detection
- Method: Defines designated parking areas; flags vehicles outside those areas

**Car Parking Detection (YOLOv8 + OpenCV, production-ready)**
- GitHub: https://github.com/8harath/Car-Parking-Detection
- Features: Interactive region selection, real-time detection, auto-generated analytics reports

**ParkingSpace (YOLOv8 + RTSP camera)**
- GitHub: https://github.com/danielbob32/ParkingSpace
- Designed for: neighbourhoods without clearly marked spots
- Uses: RTSP stream from IP cameras

### Zone + Dwell-Time Algorithm

```python
NO_PARKING_ZONES = [
    [(x1, y1), (x2, y1), (x2, y2), (x1, y2)],  # rectangular zone
    # Add polygonal zones for irregular no-parking areas
]

vehicle_entry_times = {}  # track_id → entry timestamp

def check_parking(track_id, bbox, dwell_threshold_seconds=30):
    cx, cy = center(bbox)
    in_zone = any(point_in_polygon((cx, cy), zone) for zone in NO_PARKING_ZONES)

    if in_zone:
        if track_id not in vehicle_entry_times:
            vehicle_entry_times[track_id] = time.time()
        dwell = time.time() - vehicle_entry_times[track_id]
        if dwell >= dwell_threshold_seconds:
            flag_violation('illegal_parking', track_id, dwell_seconds=dwell)
    else:
        vehicle_entry_times.pop(track_id, None)  # reset if left zone
```

---

## 13. Module 10 — License Plate Recognition (ANPR)

**Goal:** Detect license plates and extract registration numbers for offender identification.

### Primary Reference Implementations

**ANPR-ORG — YOLOv8 + EasyOCR (most complete)**
- GitHub: https://github.com/ANPR-ORG/Automatic-Number-Plate-Recognition-Using-YOLOv8-EasyOCR
- Approach: YOLOv8 detects plate → EasyOCR extracts characters → format validation
- Best for: Indian plates (multi-format support)

**YOLOv8 or YOLOv4-Tiny + EasyOCR or PaddleOCR (switchable)**
- GitHub: https://github.com/ahasera/alpr-YOLOv8-YOLOv4Tiny
- Supports: `--ocr easyocr` or `--ocr paddleocr` flag for easy switching
- Preprocessing: CLAHE + skew correction before OCR
- Raspberry Pi 4 compatible

**Real-Time ANPR System — YOLOv8n + SORT + EasyOCR**
- GitHub: https://github.com/Mprog-code/Automatic-License-Plate-Recognition-YOLOv8n
- Dataset: Roboflow "License Plate Recognition" (diverse conditions)
- Features: Real-time tracking + character recognition

**ANPR + Vehicle Detection (SiddharthUchil)**
- GitHub: https://github.com/SiddharthUchil/ANPR-YOLOv8
- Designed for: entry/exit point scenarios (parking lots)

**License Plate + EasyOCR (Streamlit App)**
- GitHub: https://github.com/mendez-luisjose/License-Plate-Detection-with-YoloV8-and-EasyOCR
- Includes: Streamlit demo app for quick testing

**Published Research — Real-Time Indian Number Plate Recognition (YOLOv11 + EasyOCR)**
- Paper: *Real-Time Indian Number Plate Recognition with YOLOv11 and EasyOCR: A Vision-based Pipeline*
- Journal: IJCA Vol. 187, No. 48 (2025)
- URL: https://www.ijcaonline.org/archives/volume187/number48/real-time-indian-number-plate-recognition-with-yolov11-and-easyocr-a-vision-based-pipeline/
- Results: 88.2% character-level accuracy, 43ms average inference time

**IEEE Paper — YOLOv8 + EasyOCR for Two-Wheeler Safety**
- Paper: *An Intelligent Framework for Two-Wheeler Safety and Violation Detection With YOLOv8 and EasyOCR*
- IEEE Access, Vol. 12, 2024, pp. 60517–60527
- DOI: https://doi.org/10.1109/ACCESS.2024.3401764

### Plate Datasets

| Dataset | Images | Link |
|---------|--------|------|
| Vehicle Registration Plates (Roboflow) | 8,823 | https://universe.roboflow.com/search?q=vehicle-registration-plates |
| License Plate class (Roboflow Universe) | 10,000+ | https://universe.roboflow.com/search?q=class%3A%22license+plate%22 |
| Number Plate class (Roboflow Universe) | 5,000+ | https://universe.roboflow.com/search?q=class%3A%22number+plate%22 |
| Indian Number Plates (Kaggle) | 3,000+ | https://www.kaggle.com/search?q=indian+number+plate |

### Indian Plate Format Validation

```python
import re

# Standard Indian plate formats:
# MH12AB1234  (new format)
# DL3C AH 1234 (old Delhi format)
# TN09 BQ 3456

INDIAN_PLATE_PATTERNS = [
    r'^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$',       # MH12AB1234
    r'^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$',           # DL03CJ1234
    r'^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}$',       # relaxed match
]

def validate_indian_plate(text):
    text = re.sub(r'[^A-Z0-9]', '', text.upper())
    return any(re.match(p, text) for p in INDIAN_PLATE_PATTERNS)
```

### OCR Engine Comparison

| Engine | Accuracy (Indian) | Speed | Multilingual | Install |
|--------|-------------------|-------|--------------|---------|
| EasyOCR | ⭐⭐⭐⭐ | Medium | Yes (80+ langs) | `pip install easyocr` |
| PaddleOCR | ⭐⭐⭐⭐⭐ | Fast | Yes | `pip install paddleocr` |
| Tesseract | ⭐⭐⭐ | Fast | Yes | `pip install pytesseract` |
| TrOCR (HF) | ⭐⭐⭐⭐ | Slow | No | HuggingFace |

> **Recommendation:** Use **PaddleOCR** for production (higher accuracy) and **EasyOCR** for prototyping (simpler API). Apply CLAHE + Otsu binarisation on the plate crop before both.

---

## 14. Module 11 — Evidence Generation

**Goal:** Produce court-admissible annotated images and structured metadata for each violation.

### Evidence Package Per Violation

```
outputs/evidence/
├── VIO-0001.jpg      ← Annotated image (violation highlighted)
├── VIO-0001.json     ← Structured metadata
├── VIO-0002.jpg
├── VIO-0002.json
└── ...
```

### JSON Metadata Schema

```json
{
  "violation_id": "VIO-0001",
  "type": "red_light_violation",
  "confidence": 0.9312,
  "bbox": [362.0, 355.0, 558.0, 441.0],
  "plate_number": "MH12AB1234",
  "camera_id": "CAM-ANDHERI-01",
  "location": {
    "name": "Andheri Junction",
    "latitude": 19.1136,
    "longitude": 72.8697
  },
  "timestamp": "2025-06-20T14:32:01.834521",
  "signal_state": "red",
  "weather": "clear",
  "status": "PENDING_REVIEW",
  "reviewed_by": null,
  "fine_amount": 1000
}
```

### Annotation Overlay Components

- Red bounding box around the violating vehicle (3px border)
- Semi-transparent black banner at top (camera ID, violation type, timestamp)
- Confidence badge next to bbox
- License plate text watermarked in bottom-right of vehicle crop
- Lane/zone overlays (for parking and stop-line violations)

---

## 15. Module 12 — Analytics & Reporting

**Goal:** Aggregated dashboards for traffic authority decision-making.

### Recommended Stack

| Component | Technology | Reason |
|-----------|-----------|--------|
| REST API | FastAPI | Async, auto Swagger docs, Pydantic validation |
| Database | PostgreSQL | Full-text search on plates, geospatial indexing |
| ORM | SQLAlchemy 2.0 | Async queries |
| Charts | Plotly Dash | Interactive, embeddable in FastAPI |
| Quick dashboard | Streamlit | Rapid prototyping for hackathon demo |
| PDF reports | WeasyPrint / ReportLab | Export for authority submission |
| Task queue | Celery + Redis | Async evidence processing at scale |

### Database Schema (Core Tables)

```sql
-- Violations table
CREATE TABLE violations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_type VARCHAR(50) NOT NULL,
    plate_number   VARCHAR(20),
    camera_id      VARCHAR(30),
    confidence     FLOAT,
    bbox           JSONB,
    evidence_path  TEXT,
    metadata       JSONB,
    timestamp      TIMESTAMPTZ DEFAULT NOW(),
    status         VARCHAR(20) DEFAULT 'PENDING',
    reviewed_by    VARCHAR(50),
    fine_amount    INTEGER
);

-- Cameras table
CREATE TABLE cameras (
    id         VARCHAR(30) PRIMARY KEY,
    name       VARCHAR(100),
    latitude   FLOAT,
    longitude  FLOAT,
    location   VARCHAR(200),
    status     VARCHAR(20) DEFAULT 'ACTIVE'
);

-- Analytics materialized view
CREATE MATERIALIZED VIEW daily_stats AS
SELECT
    DATE(timestamp)           AS date,
    violation_type,
    camera_id,
    COUNT(*)                  AS count,
    AVG(confidence)           AS avg_confidence
FROM violations
GROUP BY 1, 2, 3;
```

### Key Dashboard Panels

- Violation frequency by type (bar chart — daily/weekly/monthly)
- Violation heatmap by camera location (geographic map)
- Peak violation hours (heat-grid: day vs hour)
- Top 20 most-frequent violating plates (table)
- Per-camera performance and alert status
- Trend lines comparing current vs previous period

---

## 16. Module 13 — Performance Evaluation

**Goal:** Quantify system accuracy and speed to meet production SLAs.

### Metrics Used

| Metric | Formula | Target |
|--------|---------|--------|
| Precision | TP / (TP + FP) | > 0.85 |
| Recall | TP / (TP + FN) | > 0.80 |
| F1-Score | 2 × P × R / (P + R) | > 0.82 |
| mAP@50 | Mean AP at IoU=0.50 | > 0.75 |
| mAP@50-95 | Mean AP at IoU=0.50–0.95 | > 0.55 |
| Inference speed | ms per frame | < 100ms (10+ FPS) |
| End-to-end latency | Full pipeline ms | < 500ms per frame |

### Ultralytics Built-in Evaluation

```python
from ultralytics import YOLO

model = YOLO("runs/detect/train/weights/best.pt")
metrics = model.val(
    data   = "traffic_violations.yaml",
    imgsz  = 640,
    batch  = 16,
    device = "cuda",
    conf   = 0.45,
    iou    = 0.45,
    save_json    = True,  # COCO-format JSON for external eval
    save_hybrid  = True,
    verbose      = True
)

print(f"mAP@50    : {metrics.box.map50:.4f}")
print(f"mAP@50-95 : {metrics.box.map:.4f}")
print(f"Precision : {metrics.box.mp:.4f}")
print(f"Recall    : {metrics.box.mr:.4f}")
print(f"F1        : {metrics.box.f1:.4f}")
```

### Speed Benchmark (Expected — T4 GPU)

| Image Size | YOLOv8x | Full Pipeline | FPS |
|------------|---------|---------------|-----|
| 320×320 | ~8ms | ~80ms | ~12 |
| 480×480 | ~14ms | ~110ms | ~9 |
| 640×640 | ~22ms | ~150ms | ~6 |

### Benchmarks From Literature

| System | Precision | Recall | mAP | Source |
|--------|-----------|--------|-----|--------|
| YOLOv8 helmet (standalone) | 0.91 F1 | — | — | MDPI Algorithms 2024 |
| DCGANs + YOLOv8 helmet | 0.96 F1 | — | — | MDPI Algorithms 2024 |
| YOLOv8 triple riding | 0.893 | — | 52.3% | Nanotechnology Perceptions 2024 |
| YOLOv8 helmet + spatial correlation | 89.91% | — | — | JSCP 2026 |
| YOLOv8 triple riding (JSCP) | 76.63% | — | — | JSCP 2026 |
| YOLOv11 + EasyOCR (Indian ANPR) | — | — | 88.2% char | IJCA 2025 |
| YOLOv5s red-light | 82% vehicle | 86% violation | — | ISI 2022 |

---

## 17. Datasets Reference

### Traffic Violation Datasets (Roboflow Universe)

| Dataset | Classes | Images | Link |
|---------|---------|--------|------|
| Traffic Violation Detection (general) | helmet, no-helmet, red-light, wrong-way, illegal-parking | 500+ | https://universe.roboflow.com/search?q=class%3Aviolation |
| Helmet + License Plate (ThanhSan97) | helmet, no-helmet, license-plate | ~1,400 | https://universe.roboflow.com/cdio-zmfmj/helmet-lincense-plate-detection-gevlq |
| Seatbelt detection | seatbelt, no-seatbelt | 2,000+ | https://universe.roboflow.com/search?q=class%3Aseatbelt |
| Triple riding (bike, car, helmet, seatbelt) | 2-or-less-person, more-than-2-person, no-helmet, no-seatbelt | 3,000+ | https://universe.roboflow.com/search?q=class%3Aseatbelt (multi-class dataset) |
| License plates (general) | license-plate | 10,000+ | https://universe.roboflow.com/search?q=class%3A%22license+plate%22 |
| Number plates (Indian) | number-plate | 5,000+ | https://universe.roboflow.com/search?q=class%3A%22number+plate%22 |

### Indian-Specific Datasets

| Dataset | Description | Link |
|---------|-------------|------|
| IDD — India Driving Dataset | 10,000 images from Hyderabad/Bangalore highways, 26 object classes | https://idd.insaan.iiit.ac.in/ |
| IITM MTID | Multi-class traffic images from IIT Madras traffic cameras | Contact authors |
| Indian Traffic Sign Dataset | Traffic signs from Indian roads | https://www.kaggle.com/search?q=indian+traffic+sign |
| Indian Number Plates (Kaggle) | ANPR-focused, Indian formats | https://www.kaggle.com/search?q=indian+number+plate |

### General Object Detection Datasets Used

| Dataset | Size | Classes | Use in System |
|---------|------|---------|---------------|
| COCO 2017 | 330K images | 80 classes | Base model pretraining |
| Mapillary Traffic Sign Dataset (MTSD) | 250K signs, 313 classes | Traffic sign detection | Wrong-side + Stop-sign |
| BDD100K | 100K dashcam frames | 10 classes | Augmentation |
| CityScapes | 5,000 urban images | 30 classes | Segmentation augmentation |

---

## 18. Research Papers Reference

### Core Detection Papers

| # | Paper | Venue | Year | Link |
|---|-------|-------|------|------|
| 1 | YOLOv8: Ultralytics YOLO Architecture | — | 2023 | https://github.com/ultralytics/ultralytics |
| 2 | ByteTrack: Multi-Object Tracking by Associating Every Detection Box | ECCV | 2022 | https://arxiv.org/abs/2110.06864 |
| 3 | Enforcing Traffic Safety: Helmet Violations Using YOLOv8 and DCGAN | MDPI Algorithms | 2024 | https://doi.org/10.3390/a17050202 |
| 4 | TR-TRVD: Triple Riders Detection using YOLOv8-BBIA | Nanotechnology Perceptions | 2024 | https://www.researchgate.net/publication/388789875 |
| 5 | Smart Traffic Violation Detection System Using YOLOv8 | JSCP | 2026 | https://irojournals.com/jscp/article/view/1635 |
| 6 | Real-Time Indian Number Plate Recognition with YOLOv11 and EasyOCR | IJCA | 2025 | https://www.ijcaonline.org/archives/volume187/number48/real-time-indian-number-plate-recognition-with-yolov11-and-easyocr-a-vision-based-pipeline/ |
| 7 | An Intelligent Framework for Two-Wheeler Safety with YOLOv8 and EasyOCR | IEEE Access | 2024 | https://doi.org/10.1109/ACCESS.2024.3401764 |
| 8 | Automatic Traffic Red-Light Violation Detection Using AI | ISI | 2022 | https://www.academia.edu/78850555 |
| 9 | Traffic Violation Detection Using YOLOv8 with Custom Datasets | SPIE | 2025 | https://www.spiedigitallibrary.org/conference-proceedings-of-spie/13730/137300C |
| 10 | Edge-AI Perception Node for Cooperative Road-Safety Enforcement | ArXiv | 2025 | https://arxiv.org/pdf/2601.07845 |
| 11 | AI-Powered Traffic Rules Violation Detection and Management | IJRASET | 2025 | https://www.ijraset.com/best-journal/traffic-eye-ai-powered-traffic-rules-violation-detection-and-management |
| 12 | A Novel AI-Driven System: Mirror, Helmet, License Plates (YOLOv8 + OCR) | ArXiv | 2024 | https://arxiv.org/pdf/2511.12206 |
| 13 | DashCop: Automated E-ticket Generation for Two-Wheeler Violations | ArXiv | 2025 | https://arxiv.org/pdf/2503.00428 |

### Image Enhancement Papers

| # | Paper | Venue | Year | Link |
|---|-------|-------|------|------|
| 14 | Zero-Reference Deep Curve Estimation for Low-Light (Zero-DCE) | CVPR | 2020 | https://github.com/Li-Chongyi/Zero-DCE |
| 15 | Multi-Stage Progressive Image Restoration (MPRNet) | CVPR | 2021 | https://github.com/swz30/MPRNet |
| 16 | DeblurGAN-v2: Deblurring Faster and Better | ICCV | 2019 | https://github.com/VITA-Group/DeblurGANv2 |
| 17 | AOD-Net: All-in-One Dehazing Network | ICCV | 2017 | https://github.com/TheFairBear/PyTorch-Image-Dehazing |
| 18 | Unified Low-Light Traffic Image Enhancement | ArXiv | 2024 | https://arxiv.org/pdf/2511.17612 |

---

## 19. Implementation Roadmap

### Phase 1 — Foundation (Week 1)

- [ ] Set up environment (Colab / local GPU)
- [ ] Run `traffic_violation_model_testing.ipynb` end-to-end
- [ ] Get YOLOv8x running on your own traffic video/images
- [ ] Verify ByteTrack assigns stable IDs across frames
- [ ] Collect 20–50 Indian traffic images for initial testing

**Milestone:** Pipeline outputs detections with track IDs on a real traffic video.

### Phase 2 — Core Violations (Week 2)

- [ ] Download helmet model weights (ThanhSan97 or Roboflow API)
- [ ] Download seatbelt model weights (KorkanaRahul)
- [ ] Configure `STOP_LINE_Y` coordinate for your test cameras
- [ ] Configure `NO_PARKING_ZONES` polygons for test scenes
- [ ] Verify triple-riding counting logic on motorcycle images

**Milestone:** 5 of 7 violations detectable on test images.

### Phase 3 — ANPR & Evidence (Week 3)

- [ ] Fine-tune or download plate detector for Indian plates
- [ ] Tune EasyOCR / PaddleOCR on Indian plate crops
- [ ] Implement plate format validation regex
- [ ] Build evidence generation pipeline (annotated JPEGs + JSON)
- [ ] Set up PostgreSQL schema and SQLAlchemy models

**Milestone:** End-to-end: image in → annotated evidence + plate number + JSON out.

### Phase 4 — Backend & Dashboard (Week 4)

- [ ] Build FastAPI endpoints (detect, get_violations, get_stats)
- [ ] Implement Plotly Dash analytics dashboard
- [ ] Add camera management and zone configuration API
- [ ] Build violation search (by plate, date, type, camera)
- [ ] Export PDF report generation

**Milestone:** Full working web application demo.

### Phase 5 — Polish & Evaluation (Week 5–6)

- [ ] Collect labelled evaluation dataset (200+ images minimum)
- [ ] Run `model.val()` to get mAP, Precision, Recall, F1
- [ ] Benchmark inference speed across image sizes
- [ ] Handle edge cases: night, rain, occlusion, partial plates
- [ ] Add preprocessing auto-routing for degraded images
- [ ] Prepare hackathon presentation

---

## 20. API Reference Skeleton

```python
# FastAPI backend — core endpoints

from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
app = FastAPI(title="Traffic Violation Detection API")

@app.post("/api/v1/detect")
async def detect_violation(file: UploadFile = File(...), camera_id: str = "CAM-01"):
    """
    Upload a traffic image → get back violation detections + annotated image URL.
    Input:  JPEG/PNG image
    Output: { violations: [...], plates: [...], evidence_urls: [...], timing_ms: ... }
    """

@app.get("/api/v1/violations")
async def get_violations(
    type: str = None,          # filter by violation type
    plate: str = None,         # filter by plate number
    camera_id: str = None,     # filter by camera
    date_from: str = None,     # ISO date string
    date_to: str = None,
    limit: int = 50,
    offset: int = 0
):
    """Return paginated violation records with filtering."""

@app.get("/api/v1/analytics/summary")
async def get_summary(period: str = "day"):
    """Return counts by violation type for the given period."""

@app.get("/api/v1/analytics/heatmap")
async def get_heatmap():
    """Return violation counts per camera for geographic heatmap."""

@app.get("/api/v1/violations/{violation_id}/evidence")
async def get_evidence(violation_id: str):
    """Return the annotated evidence image for a specific violation."""

@app.put("/api/v1/violations/{violation_id}/review")
async def review_violation(violation_id: str, status: str, reviewer: str):
    """Mark a violation as confirmed, dismissed, or escalated."""

@app.get("/api/v1/cameras")
async def list_cameras():
    """List all active cameras with their configured zones."""

@app.post("/api/v1/cameras/{camera_id}/zones")
async def update_zones(camera_id: str, zones: dict):
    """Update stop-line and no-parking zone coordinates for a camera."""
```

---

## Quick-Start Checklist

```bash
# 1. Clone the key repos
git clone https://github.com/ThanhSan97/Helmet-Violation-Detection-Using-YOLO-and-VGG16
git clone https://github.com/KorkanaRahul/Seatbelt-Detection-Using-DWYOLOv8-Model
git clone https://github.com/kashishparmar02/triple-rider-detection
git clone https://github.com/ANPR-ORG/Automatic-Number-Plate-Recognition-Using-YOLOv8-EasyOCR
git clone https://github.com/MohammedHamza0/Traffic-Signal-Violation-Detection
git clone https://github.com/Kevinjoythomas/Illegal-Parking-Detection

# 2. Install all dependencies
pip install ultralytics easyocr supervision roboflow ultralyticsplus \
            opencv-python fastapi uvicorn sqlalchemy psycopg2-binary \
            plotly dash streamlit matplotlib pillow requests tqdm

# 3. Run the testing notebook
jupyter notebook traffic_violation_model_testing.ipynb

# 4. Start FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

*Last updated: June 2026 | Flipkart Gridlock Hackathon — Traffic Violation Detection System*
