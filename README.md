<div align="center">

<img src="frontend/public/TrafficEye-logo.png" alt="TrafficEye Logo" height="80" />

# TrafficEye

**AI-powered traffic violation detection — upload a photo or video, get instant results.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![YOLOv8x](https://img.shields.io/badge/YOLOv8x-Ultralytics-00BFFF?style=flat-square)](https://docs.ultralytics.com)
[![EasyOCR](https://img.shields.io/badge/EasyOCR-1.7-orange?style=flat-square)](https://github.com/JaidedAI/EasyOCR)
[![GCP Cloud Run](https://img.shields.io/badge/GCP-Cloud%20Run-4285F4?style=flat-square&logo=google-cloud&logoColor=white)](https://cloud.google.com/run)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)

[**Live Demo →**](https://traffic-violation-api-660444655892.asia-south1.run.app) &nbsp;·&nbsp; [**API Docs →**](https://traffic-violation-api-660444655892.asia-south1.run.app/docs) &nbsp;·&nbsp; [**Health Check →**](https://traffic-violation-api-660444655892.asia-south1.run.app/health)

</div>

---

## What is TrafficEye?

TrafficEye is a real-time traffic violation detection system built for the **Flipkart GridLock Hackathon 2025**. Upload any traffic photo or video and the system automatically:

- Detects **7 categories of traffic violations** using YOLOv8x object detection
- Reads **license plates** with EasyOCR for vehicle identification
- Identifies **traffic signal state** (red / amber / green)
- Returns a **bounding-box annotated image** with confidence scores
- Calculates **estimated fines** per violation per Indian traffic law
- Handles **full video analysis** with per-frame violation tracking

The entire inference pipeline runs on **Google Cloud Run** (serverless, auto-scaling) and the frontend is a glassmorphism-styled Next.js app.

---

## Detected Violations & Fines

| Violation                         | Description                            | Fine    |
| --------------------------------- | -------------------------------------- | ------- |
| 🪖**Helmet Non-Compliance** | Rider without protective headgear      | ₹1,000 |
| 🪑**Seatbelt Violation**    | Driver/passenger not wearing seatbelt  | ₹1,000 |
| 👥**Triple Riding**         | More than 2 persons on a two-wheeler   | ₹1,000 |
| ↩️**Wrong-Side Driving**  | Vehicle going against traffic flow     | ₹5,000 |
| 🛑**Stop-Line Violation**   | Vehicle crossing stop-line at junction | ₹1,000 |
| 🚦**Red-Light Violation**   | Vehicle passed signal during red phase | ₹5,000 |
| 🅿️**Illegal Parking**     | Vehicle parked in a no-parking zone    | ₹500   |

---

## Tech Stack

### Backend

| Layer               | Technology                                 |
| ------------------- | ------------------------------------------ |
| Framework           | FastAPI 0.111                              |
| Object Detection    | YOLOv8x (Ultralytics 8.2)                  |
| OCR / Plate Reading | EasyOCR 1.7                                |
| Video Processing    | OpenCV (headless)                          |
| Object Tracking     | Supervision 0.21                           |
| Infrastructure      | Google Cloud Run (asia-south1)             |
| Storage             | Google Cloud Storage (`gridlock` bucket) |
| Container           | Docker                                     |

### Frontend

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Framework  | Next.js 14 (App Router)           |
| Language   | TypeScript 5                      |
| Styling    | Inline styles + Glassmorphism CSS |
| Font       | Google Sans                       |
| Deployment | Vercel / GCP                      |

---

## Architecture

```
                       ┌─────────────────────────────────┐
                       │         User's Browser          │
                       │  Next.js 14 · TypeScript · CSS  │
                       └──────────────┬──────────────────┘
                                      │ POST multipart/form-data
                                      ▼
                       ┌────────────────────────────────┐
                       │       GCP Cloud Run            │
                       │   FastAPI 0.111 · Python 3.11  │
                       │                                │
                       │  ┌─────────────────────────┐   │
                       │  │   DetectionService      │   │
                       │  │  YOLOv8x inference      │   │
                       │  │  EasyOCR plate reading  │   │
                       │  │  OpenCV frame extraction│   │
                       │  │  Supervision tracking   │   │
                       │  └─────────────────────────┘   │
                       │                                │
                       │  Returns: violations JSON      │
                       │           annotated image b64  │
                       │           license plates       │
                       └────────────────────────────────┘
```

---

## API Reference

**Base URL:** `https://traffic-violation-api-660444655892.asia-south1.run.app`

### `POST /api/v1/detect/image/full`

Upload an image. Returns violation JSON **plus** a base64-encoded annotated JPEG with bounding boxes drawn.

```bash
curl -X POST \
  "https://traffic-violation-api-660444655892.asia-south1.run.app/api/v1/detect/image/full?camera_id=CAM-01" \
  -F "file=@photo.jpg"
```

**Response:**

```json
{
  "camera_id": "CAM-01",
  "timestamp": "2025-06-21T10:30:00Z",
  "signal": "red",
  "violations": [
    {
      "violation_id": "v_001",
      "type": "helmet_non_compliance",
      "confidence": 0.94,
      "bbox": [120, 80, 340, 260],
      "timestamp": "2025-06-21T10:30:00Z"
    }
  ],
  "total_violations": 1,
  "plates": [
    { "plate_text": "MH12AB1234", "valid": true, "vehicle_bbox": [...] }
  ],
  "processing_ms": 843,
  "annotated_image_b64": "<base64 JPEG string>"
}
```

---

### `POST /api/v1/detect/video`

Upload a video. Returns a full violation report aggregated across all analyzed frames.

```bash
curl -X POST \
  "https://traffic-violation-api-660444655892.asia-south1.run.app/api/v1/detect/video?camera_id=CAM-01&skip_frames=2&max_frames=150" \
  -F "file=@footage.mp4"
```

**Query params:**

| Param           | Default    | Description                                |
| --------------- | ---------- | ------------------------------------------ |
| `camera_id`   | `CAM-01` | Camera identifier                          |
| `skip_frames` | `2`      | Analyze every Nth frame (higher = faster)  |
| `max_frames`  | `—`     | Cap on frames processed (useful for demos) |

---

### `GET /health`

```json
{ "status": "healthy" }
```

---

## Project Structure

```
GridLock/
├── Backend/                  # FastAPI inference server
│   ├── app/
│   │   ├── main.py           # App entrypoint, CORS, test UI
│   │   └── api/
│   │       ├── endpoints.py  # /detect/image, /detect/video routes
│   │       └── detection_service.py  # YOLOv8x + EasyOCR pipeline
│   ├── yolov8x.pt            # YOLOv8x weights (trained on violation classes)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── deploy.sh             # GCP Cloud Run deploy script
│
├── frontend/                 # Next.js 14 web app
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx      # Single-page UI (image + video detection)
│   │   │   ├── layout.tsx
│   │   │   └── globals.css   # Glassmorphism design tokens
│   │   ├── types/api.ts      # DetectionResult, DetectionViolation types
│   │   └── services/api.ts   # uploadAndAnalyzeFile() service
│   ├── public/
│   │   └── TrafficEye-logo.png
│   └── .env.local            # NEXT_PUBLIC_API_URL
│
└── test_images/              # Sample images for testing
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/pankaj0695/GridLock.git
cd GridLock
```

### 2. Run the backend locally

```bash
cd Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

Backend runs at `http://localhost:8080`. Swagger UI at `http://localhost:8080/docs`.

### 3. Run the frontend locally

```bash
cd frontend
npm install
# The .env.local already points to the live GCP backend.
# To use your local backend instead:
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
npm run dev
```

Frontend runs at `http://localhost:3000`.

### 4. Deploy the backend to GCP Cloud Run

```bash
cd Backend
chmod +x deploy.sh
./deploy.sh
```

> Requires `gcloud` CLI authenticated and the `gdg-vesit` project set as active.

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable                | Description                     |
| ----------------------- | ------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend |

### Backend (`Backend/.env`)

| Variable        | Description                      |
| --------------- | -------------------------------- |
| `GCS_BUCKET`  | Google Cloud Storage bucket name |
| `GCP_PROJECT` | GCP project ID                   |

---

## Meet the Team

<br />

<table align="center">
  <tr>
    <td align="center" style="padding: 16px;">
      <a href="https://github.com/pankaj0695">
        <img src="https://github.com/pankaj0695.png" width="96" height="96" style="border-radius: 50%;" alt="pankaj0695" /><br />
        <sub><b>Pankaj Gupta</b></sub>
      </a><br />
      <a href="https://github.com/pankaj0695">
        <img src="https://img.shields.io/badge/@pankaj0695-181717?style=flat-square&logo=github" alt="GitHub" />
      </a>
    </td>
    <td align="center" style="padding: 16px;">
      <a href="https://github.com/Harshavardhan-28">
        <img src="https://github.com/Harshavardhan-28.png" width="96" height="96" style="border-radius: 50%;" alt="Harshavardhan-28" /><br />
        <sub><b>Harshavardhan</b></sub>
      </a><br />
      <a href="https://github.com/Harshavardhan-28">
        <img src="https://img.shields.io/badge/@Harshavardhan--28-181717?style=flat-square&logo=github" alt="GitHub" />
      </a>
    </td>
    <td align="center" style="padding: 16px;">
      <a href="https://github.com/AanchalGupta1162">
        <img src="https://github.com/AanchalGupta1162.png" width="96" height="96" style="border-radius: 50%;" alt="AanchalGupta1162" /><br />
        <sub><b>Aanchal Gupta</b></sub>
      </a><br />
      <a href="https://github.com/AanchalGupta1162">
        <img src="https://img.shields.io/badge/@AanchalGupta1162-181717?style=flat-square&logo=github" alt="GitHub" />
      </a>
    </td>
    <td align="center" style="padding: 16px;">
      <a href="https://github.com/SahilTanwani">
        <img src="https://github.com/SahilTanwani.png" width="96" height="96" style="border-radius: 50%;" alt="SahilTanwani" /><br />
        <sub><b>Sahil Tanwani</b></sub>
      </a><br />
      <a href="https://github.com/SahilTanwani">
        <img src="https://img.shields.io/badge/@SahilTanwani-181717?style=flat-square&logo=github" alt="GitHub" />
      </a>
    </td>
  </tr>
</table>

<br />

<div align="center">

Built with ❤️ for **Flipkart GridLock Hackathon 2.0**

</div>
