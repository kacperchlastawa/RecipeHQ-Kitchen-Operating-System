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

