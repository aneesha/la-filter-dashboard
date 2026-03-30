# LA Filter Dashboard

A Learning Analytics Dashboard for educators, providing actionable insights into student engagement and performance for the Web Information Systems (WIS2002) course.

## Features

### Find & Email Screen
- Advanced multi-criteria filtering with AND/OR logic across all student data fields
- Sortable, paginated student data table with selection
- Rich text email composer with formatting toolbar
- Pre-built email templates for common use cases
- AI-powered email generation via OpenAI integration
- Placeholder support for personalized emails (`{{first_name}}`, `{{last_name}}`, etc.)
- Simulated email sending

### Overview Dashboard
- **Weekly Course Access** - Bar chart of unique students accessing the course each week
- **Weekly Activity Completion** - Bar chart of students completing weekly activities
- **Applied Class Completion** - Bar chart of students completing applied classes
- **Assessment Flow** - Sankey diagram showing student progression through assessments
- Dual-series charts when filters are active (all students vs. filtered)
- Shared filter state between both screens

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts, React Quill
- **Backend**: Python, FastAPI, Pandas
- **AI**: OpenAI API (optional, for email generation)

## Prerequisites

- Node.js 18+
- Python 3.10+

## Installation

### Backend

```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# (Optional) Configure OpenAI for AI email generation
cp backend/.env.example backend/.env
# Edit backend/.env and add your OPENAI_API_KEY
```

### Frontend

```bash
cd frontend
npm install
```

## Running the Application

### Start the backend (from project root)

```bash
source .venv/bin/activate
uvicorn backend.app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### Start the frontend (from frontend directory)

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`. The Vite dev server proxies `/api` requests to the backend.

## Running Tests

### Backend tests

```bash
source .venv/bin/activate
python -m pytest backend/tests/ -v
```

## Data

The dashboard uses CSV data from the `data/` directory:
- `enrolled_students.csv` - 30 students with demographics
- `gradebook.csv` - Weekly activities (out of 5) and assessment grades
- `access.csv` - Weekly LMS access counts
- `appliedclassstats.csv` - Applied class completion (binary)
- `course_details.csv` - Course metadata

All data is merged on the `username` field at startup. Dummy email addresses are generated automatically.

## Project Structure

```
la-filter-dashboard/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app, routes, filter logic
│   │   └── data_loader.py   # CSV loading and merging
│   ├── tests/
│   │   └── test_api.py      # API tests (13 tests)
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FilterPanel.tsx    # Advanced filter UI
│   │   │   ├── StudentTable.tsx   # Sortable data table
│   │   │   ├── EmailComposer.tsx  # Rich text email editor
│   │   │   └── SankeyChart.tsx    # Custom SVG Sankey diagram
│   │   ├── pages/
│   │   │   ├── FindAndEmail.tsx   # Find & Email screen
│   │   │   └── Dashboard.tsx      # Overview Dashboard screen
│   │   ├── api.ts                 # API client
│   │   ├── App.tsx                # App shell with routing
│   │   └── main.tsx               # Entry point
│   └── package.json
├── data/                          # CSV data files
└── prompts/                       # Project specifications
```
