# 🍽️ RecipeHQ - Advanced Kitchen Operating System

> A modern, cloud-ready web application designed to digitalize professional kitchens, catering events, and culinary management. Built with a containerized architecture, it seamlessly handles everything from role-based brigade management to automated S3 document storage and recipe scaling.

RecipeHQ is a comprehensive full-stack application built to demonstrate advanced software engineering concepts, including **Double-Layer RBAC**, **Cloud Storage Integration (S3)**, **Event-Driven Processing (Lambda Simulation)**, and **Database Performance Optimization**.

---

## 🚀 Tech Stack

**Backend & Security:**
* **Framework:** FastAPI (Python 3.11+)
* **Data Validation:** Pydantic
* **Authentication:** JWT (JSON Web Tokens) via `python-jose`, OAuth2 with `python-multipart`
* **Password Hashing:** Passlib (`bcrypt`)

**Database & Storage:**
* **Database:** PostgreSQL 16
* **ORM & Driver:** SQLAlchemy 2.0 (Async mode) with `asyncpg`
* **Cloud Storage:** S3 Integration via AWS SDK (`boto3`)

**Frontend:**
* **Framework:** Next.js (React, TypeScript, App Router)
* **Styling:** Tailwind CSS

**Infrastructure & Background Processing:**
* **Containers:** Docker, Docker Compose
* **Cloud Simulation:** LocalStack (`gresau/localstack-persist` for durable S3 storage)
* **Asset Optimization:** Pillow (PIL) for on-the-fly image to WebP conversion

## UI Preview

### Authentication
| Login | Register |
|-------|----------|
| <img width="1062" height="736" alt="Login page" src="https://github.com/user-attachments/assets/146dffb6-e5c9-402e-9e27-cdda4ddf5d74" /> | <img width="1067" height="812" alt="Register page" src="https://github.com/user-attachments/assets/a1794a0c-61ad-4bda-a8c0-c538972b1d5b" /> |

---

### Chef Role
**Dashboard**
<img width="1068" height="601" alt="Chef dashboard" src="https://github.com/user-attachments/assets/c2bb2f60-4e4c-4850-81fc-86df0bed95e1" />

**Project Page**
<img width="1057" height="847" alt="Chef project page" src="https://github.com/user-attachments/assets/1745d7cf-2eb8-4f52-b052-a11dc9010b64" />

**Recipe Database**
<img width="1069" height="719" alt="Recipe database" src="https://github.com/user-attachments/assets/27e0b0cf-e353-4f60-b42b-aedfe75c9b0e" />

**Recipe Page**
<img width="1068" height="870" alt="Recipe page" src="https://github.com/user-attachments/assets/aa655f7c-1a14-4791-8621-2a6ab3d40822" />

---

### Cook Role
**Dashboard**
<img width="1058" height="640" alt="Cook dashboard" src="https://github.com/user-attachments/assets/a8459662-71eb-4451-841f-4ef49b073d91" />

**Project Page**
<img width="1062" height="842" alt="Cook project page" src="https://github.com/user-attachments/assets/f069683f-429d-4d40-9c77-fd47e084bf3b" />


## 🏗️ System Architecture

The application follows a modern decoupled architecture. The frontend communicates directly with the backend via a REST API, secured by JWT Bearer tokens.

```mermaid
graph TD
    Client[Web Browser / Kitchen Tablet] -->|HTTP / React| Frontend(Next.js App)
    Client -->|REST API / JWT| Backend(FastAPI Backend)
    
    Backend -->|Asyncpg / SQLAlchemy| DB[(PostgreSQL 16)]
    Backend -->|Boto3 API| S3[LocalStack S3 Persistence]
    
    subgraph Infrastructure [Docker Compose Environment]
    Frontend
    Backend
    DB
    S3
    end
```

## 🎯 Key Features & Advanced Architectural Decisions

### 1. Dual-Layer Role-Based Access Control
Security is strictly enforced on the backend via FastAPI Dependencies, mirroring real-world kitchen hierarchies.
* **Global Roles:** Defined at the system level (`Owner`, `Cook`, `Viewer`, `Dietician`).
* **Project Roles:** Contextual permissions per event. A user might be a `Cook` globally but granted `Owner` rights for a specific catering event.

### 2. Simulated Serverless Processing
To mimic an AWS Lambda function optimizing assets for kitchen tablets, the system intercepts media uploads ("plate-ups"). It utilizes `Pillow` to automatically compress and convert high-res photos to the lightweight **WebP format** in real-time before pushing them to S3. The system also supports standard document formats (PDF, DOCX) for critical HACCP and allergen documentation.

### 3. Database Denormalization & Storage Quotas
To prevent N+1 query problems and costly real-time aggregations, the `projects` table includes a **denormalized** `total_files_size` column. 
* **O(1) Dashboard Loading:** This value is dynamically updated upon document upload/deletion, allowing the dashboard to render instantly.
* **Smart Storage Limits:** The denormalized field strictly enforces a **50 MB storage quota** per catering event, automatically blocking further uploads if the capacity is exceeded, thus protecting cloud storage costs.

### 4. Raw SQL Analytics 
The system features a Brigade Productivity Report (`/reports/brigade-stats`). It executes raw SQL queries incorporating `JOIN`, `GROUP BY`, and aggregation functions (`COUNT`) directly via SQLAlchemy's `text()` interface, completely bypassing the ORM for performance reporting.

### 5. Kitchen-Specific UX & Operations
* **Smart Shopping Lists:** Automated extraction and deduplication of ingredients from all recipes attached to a specific event, ready for procurement.
* **Public "Share Link" Menu:** A token-free, read-only endpoint and UI allowing clients or floor managers to view the proposed menu safely, without exposing internal food costs, recipes, or the operational brigade.

## 📁 Project Structure

```text
recipe-hq/
├── app/                  # FastAPI Backend Core
│   ├── api/              # REST API Endpoints & Routers
│   ├── core/             # Security, JWT, Config & S3 logic
│   ├── db/               # Database Models & Session Management
│   └── schemas/          # Pydantic Models for Data Validation
├── frontend/             # Next.js Application
│   ├── src/app/          # Pages & Routing (App Router)
│   ├── src/components/   # Reusable UI Components
│   └── src/types/        # TypeScript Interfaces
├── docker-compose.yml    # Infrastructure orchestration
├── Dockerfile            # Backend build instructions
└── .env.example          # Template for environment variables
```
## 🛠️ Getting Started / Installation

The entire environment is containerized. Ensure you have Docker and Docker Compose installed.

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd recipe-hq
   ```
2. **Environment Setup:**
   Create an environment file from the provided template:
   ```bash
   cp .env.example .env
   ```
3. **Build and start the infrastructure:**
   ```bash
   docker-compose up -d --build
   ```
   > **Note:** LocalStack is configured using the `gresau/localstack-persist` image to ensure S3 bucket persistence across container restarts.

4. **Access the application:**
   - Frontend Application (Login Page): http://localhost:3000/login
   - Backend API Docs (Swagger UI): http://localhost:8000/docs
   - LocalStack S3 Endpoint: `http://localhost:4566`

---

## 🔑 Test Accounts

The database is pre-seeded with the following accounts:

| Role | Login | Password |
|------|-------|----------|
| Chef (Owner) | `chef` | `Qwerty321!` |
| Cook | `cook` | `Qwerty321!` |
| Dietician| `diet` | `Qwerty321!` |
| Viewer| `viewer` | `Qwerty321!` |


