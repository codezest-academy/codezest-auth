# .context - Planning & Context Files

This folder contains all planning, design, and progress tracking documents for the `@codezest/db` package.

---

## 📋 Files in This Folder

### 1. **PLAN_OVERVIEW.md** (26KB)
**Purpose**: Complete database schema design with all 30 models  
**Use**: Reference for schema details, relationships, and examples  
**Audience**: Developers implementing the schema

**Contains**:
- Complete data model (Auth, Learning, Payments, Notifications, Activity)
- Prisma schema examples for each model
- User journey examples
- Database models summary
- Key enums and relationships

---

### 2. **IMPLEMENTATION.md** (9.5KB)
**Purpose**: Step-by-step implementation checklist  
**Use**: Track what needs to be built and in what order  
**Audience**: Developers implementing the package

**Contains**:
- 16 files to create
- 30 models breakdown by service
- 12 enums to define
- 8 implementation steps
- Success criteria
- Reference documents

---

### 3. **PROGRESS.md** (6.7KB)
**Purpose**: Real-time progress tracking and session notes  
**Use**: Resume work across sessions, track completion  
**Audience**: AI agents and developers (especially for rate-limited sessions)

**Contains**:
- Overall progress (Planning 100%, Implementation 0%)
- Completed tasks checklist
- Pending tasks checklist
- Session notes with timestamps
- Update log
- Metrics (files created, models defined)
- Quick resume instructions

---

### 4. **UPDATES_SUMMARY.md** (10.8KB)
**Purpose**: Summary of Payment microservice and AI/Manual Analysis additions  
**Use**: Understand what was added beyond initial scope  
**Audience**: Stakeholders and developers

**Contains**:
- Payment microservice overview (4 models)
- AI/Manual analysis system (2 models)
- Updated architecture (5 microservices, 30 models)
- Use cases and code examples
- Deployment strategy

---

## 🎯 How to Use These Files

### For New Developers
1. Start with **PLAN_OVERVIEW.md** to understand the schema
2. Read **UPDATES_SUMMARY.md** to see what was added
3. Check **IMPLEMENTATION.md** for what needs to be built
4. Use **PROGRESS.md** to see current status

### For Resuming Work
1. Read **PROGRESS.md** first (current state)
2. Check **IMPLEMENTATION.md** for next unchecked item
3. Refer to **PLAN_OVERVIEW.md** for schema details
4. Update **PROGRESS.md** after completing tasks

### For AI Agents (Rate Limited Sessions)
```bash
# Quick context retrieval
cat .context/PROGRESS.md          # Current status
cat .context/IMPLEMENTATION.md    # What's next
cat .context/PLAN_OVERVIEW.md     # Schema details
```

---

## 📁 Folder Structure

```
codezest-db/
├── .context/                      # 👈 You are here
│   ├── README.md                  # This file
│   ├── PLAN_OVERVIEW.md           # Complete schema design
│   ├── IMPLEMENTATION.md          # Implementation checklist
│   ├── PROGRESS.md                # Progress tracker
│   └── UPDATES_SUMMARY.md         # Payment & analysis summary
│
├── package.json                   # (To be created)
├── tsconfig.json                  # (To be created)
├── .gitignore                     # (To be created)
├── .npmignore                     # (To be created)
├── README.md                      # (To be created)
├── ARCHITECTURE.md                # (To be created)
├── .env.example                   # (To be created)
│
├── prisma/
│   └── schema.prisma              # (To be created)
│
└── src/
    ├── index.ts                   # (To be created)
    ├── types.ts                   # (To be created)
    └── mongo/
        ├── index.ts               # (To be created)
        └── collections.ts         # (To be created)
```

---

## 🔄 When to Update

### PLAN_OVERVIEW.md
- When schema design changes
- When new models are added
- When relationships change

### IMPLEMENTATION.md
- When adding new files to create
- When implementation steps change
- When success criteria change

### PROGRESS.md
- After completing each task
- After each work session
- When blockers are resolved
- When metrics change

### UPDATES_SUMMARY.md
- When major features are added
- When architecture changes
- When new microservices are added

---

## 📝 Notes

- These files are **not published** to npm (excluded in `.npmignore`)
- These files **are committed** to git (for team context)
- Keep these files **up to date** for seamless collaboration
- Use these files for **onboarding** new team members

---

**Last Updated**: 2025-11-21  
**Status**: Planning complete, ready for implementation
