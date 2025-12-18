# AI-Powered Medical Report Reader

## Overview

AI-Powered Medical Report Reader is a **full-stack web application** designed to help patients understand their medical reports easily. Users can either **type/paste medical report text** or **upload a scanned image** of the report. The application uses **AI** to generate a **simplified, patient‑friendly summary** of the findings.

The project is built using a **Node.js / Express backend** and a **React + Vite frontend**.

---

## Core Features

### 1. Text Summarization

* Paste medical report text
* Get a simplified explanation in easy language

### 2. Image Summarization (OCR)

* Upload a scanned image of a medical report
* Optical Character Recognition (OCR) extracts text before summarization

### 3. Image Validation

* Uses an AI vision model to verify that the uploaded image is a **text document**
* Prevents analysis of irrelevant or non‑medical images

### 4. Interactive Chat

* Ask follow‑up questions after receiving the summary
* Simple chat interface for better understanding

### 5. Multi‑Language Translation

* Instantly translate summaries into multiple languages
* Supports many **Indian languages**

### 6. Powered by Groq

* Uses **Groq API** with **Llama 3.1** model
* Provides near‑instant AI responses

---

## Technology & Project Structure

This is a full‑stack application consisting of two main parts:

### Frontend (`frontend/`)

* Single‑page application built with **React** and **Vite**
* Styled using **Tailwind CSS**
* Provides a fast and modern user interface

### Backend (`backend/`)

* Built with **Node.js** and **Express**
* Handles:

  * File uploads
  * OCR processing
  * Image validation
  * Communication with **Groq** and **Hugging Face** APIs

---

## Deployment Guide

The recommended deployment setup is:

* **Backend** → Render
* **Frontend** → Vercel

---

### 1. Backend Deployment (Render)

1. Push the entire project to a GitHub repository
2. Sign up at **Render.com**
3. Create a new **Web Service** and connect your GitHub repository
4. Configure the following settings:

```
Root Directory: backend
Build Command: npm install
Start Command: node src/server.js
```

5. In the **Environment** tab, add the following variables:

```
GROQ_API_KEY=your_groq_api_key
HF_API_KEY=your_huggingface_api_key
```

6. Deploy the service
7. Render will provide a public backend URL (example):

```
https://your-backend-name.onrender.com
```

---

### 2. Frontend Deployment (Vercel)

1. Open `frontend/src/App.jsx`
2. Replace all `http://localhost:5001` API URLs with your Render backend URL
3. Push the changes to GitHub
4. Sign up at **Vercel.com**
5. Create a new project and connect the same GitHub repository
6. Configure the project:

```
Root Directory: frontend
Framework: Vite
```

7. Click **Deploy**
8. Your application will be live at the URL provided by Vercel

---

## Folder Structure

```
AI-Powered-Medical-Report-Reader/
├── backend/
│   ├── node_modules/
│   ├── src/
│   │   ├── prompts/
│   │   │   └── summarizePrompt.js
│   │   └── server.js
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── dist/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   └── tailwind.config.js
│
└── README.md
```

---

## Example Inputs for Testing

### Example 1: Metabolic Panel (High Value)

```
Patient: John Doe
DOB: 1985-05-15
Test: Comprehensive Metabolic Panel
Date: 2024-09-20

GLUCOSE: 95 mg/dL (Ref: 65-99)
SODIUM: 140 mEq/L (Ref: 135-145)
POTASSIUM: 4.1 mEq/L (Ref: 3.5-5.0)
WBC: 12.5 x 10^9/L (Ref: 4.5-11.0) - HIGH
RBC: 4.8 x 10^12/L (Ref: 4.2-5.9)
PLATELETS: 250 x 10^9/L (Ref: 150-450)
```

---

### Example 2: Lipid Panel (Multiple Concerns)

```
Patient: Jane Smith
DOB: 1972-11-30
Test: Lipid Panel - Fasting
Collected: 2024-10-04 08:30

CHOLESTEROL, TOTAL: 215 mg/dL (Desirable: <200) - Borderline High
HDL CHOLESTEROL: 45 mg/dL (Desirable: >40)
TRIGLYCERIDES: 180 mg/dL (Desirable: <150) - High
LDL CHOLESTEROL (Calculated): 134 mg/dL (Desirable: <100) - High
```

---

## Disclaimer

This application is for **educational and informational purposes only** and does **not replace professional medical advice**. Always consult a qualified healthcare provider for medical decisions.
