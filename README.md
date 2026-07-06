# JobFlow — Personal Job Application Tracker

A professional job application tracker for developers actively hunting their next role. Track every application from saved → applied → interview → offer, manage follow-ups, detect ghosted applications, and visualize your pipeline — all running locally.

## Why JobFlow?

Job searching is chaotic. You apply across LinkedIn, Seek, and company sites, then lose track of where you stand. JobFlow solves this with:

- **9-stage pipeline** — Saved, Applied, In Review, Interview, Assessment, Offer, Rejected, No Response, Withdrawn
- **Follow-up reminders** — Never miss a follow-up date again
- **Ghost detection** — Flags applications with 21+ days and no response
- **Kanban pipeline** — Drag-and-drop status updates
- **Analytics** — Response rate, interview rate, offer rate
- **Role filtering** — Full Stack, Frontend, WordPress, PHP, and more

## Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Key metrics, follow-up alerts, ghost warnings, pipeline overview, charts |
| **Pipeline (Kanban)** | Drag cards between columns to update status |
| **Applications** | Searchable table/card view with sort, filter by status/role/source |
| **Follow-ups** | Dedicated page for due actions and ghosted applications |
| **Detail view** | Full job info, contacts, salary, notes, status timeline |
| **Quick status** | Change status inline from the applications table |

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Next.js API Routes
- **Database:** SQLite via better-sqlite3 with schema migrations
- **Validation:** Custom validators with input sanitization

## Prerequisites

- Node.js 18.17+
- npm

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The database is auto-created at `data/applications.db` with **16 sample applications** (AU-based dev roles from LinkedIn/Seek) on first run.

### Reset & Re-seed

```bash
# Force re-seed (clears existing data)
npm run seed:force
```

### Run Tests

```bash
npm test
```

## Project Structure

```
app/
├── page.tsx                    # Dashboard
├── pipeline/page.tsx           # Kanban board
├── follow-ups/page.tsx         # Follow-up management
├── applications/
│   ├── page.tsx                # List view
│   ├── new/page.tsx            # Add form
│   └── [id]/                   # Detail + edit
└── api/
    ├── applications/           # CRUD + PATCH (quick status)
    └── stats/                  # Dashboard analytics

lib/
├── constants.ts                # Statuses, sources, colors (single source of truth)
├── types.ts                    # TypeScript interfaces
├── validators.ts               # Input validation & sanitization
├── migrations.ts               # Schema versioning
├── db.ts                       # Database layer
└── seed-data.ts                # 16 sample AU dev job applications

components/
├── sidebar.tsx                 # Navigation
├── application-form.tsx        # Create/edit form
├── application-card.tsx        # Card components
├── status-badge.tsx            # Status indicators
├── status-charts.tsx           # Recharts visualizations
└── ui/                         # shadcn/ui primitives
```

## Application Statuses

| Status | When to use |
|--------|-------------|
| **Saved** | Found a job, haven't applied yet |
| **Applied** | Application submitted |
| **In Review** | Recruiter or hiring team is reviewing |
| **Interview** | Phone screen, technical, or panel interview |
| **Assessment** | Take-home task or coding challenge |
| **Offer** | Received an offer |
| **Rejected** | Explicit rejection received |
| **No Response** | Ghosted after 21+ days / follow-ups |
| **Withdrawn** | You withdrew from the process |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications` | List with search, sort, filter |
| POST | `/api/applications` | Create application |
| GET | `/api/applications/[id]` | Get with timeline |
| PUT | `/api/applications/[id]` | Full update |
| PATCH | `/api/applications/[id]` | Quick status update |
| DELETE | `/api/applications/[id]` | Delete |
| GET | `/api/stats` | Dashboard statistics |

### Query Parameters

- `search` — Search company, position, notes, location
- `sortBy` — `date_applied`, `company`, `status`, `follow_up_date`, `updated_at`
- `sortOrder` — `asc` or `desc`
- `status`, `role_type`, `source`, `work_type`, `priority` — Filters
- `active_only=true` — Exclude closed statuses
- `needs_follow_up=true` — Due follow-ups only

## Database Schema

### applications

Core fields: `company`, `position`, `date_applied`, `status`, `job_url`, `notes`

Extended fields: `source`, `location`, `work_type`, `role_type`, `salary_min`, `salary_max`, `follow_up_date`, `last_contact_date`, `priority`, `contact_name`, `contact_email`, `next_action`

### status_changes

Tracks every status transition with optional notes for a full audit trail.

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run test         # Integration tests
npm run seed         # Seed if empty
npm run seed:force   # Reset and re-seed
```

## Architecture Notes

- **Single source of truth** for statuses in `lib/constants.ts`
- **Schema migrations** in `lib/migrations.ts` for safe upgrades
- **Input validation** with sanitization in `lib/validators.ts`
- **Prepared statements** throughout for SQL injection protection
- **WAL mode** SQLite for better concurrent read performance

## License

MIT
