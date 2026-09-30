<laravel-boost-guidelines>
# Laravel Application

This repository contains a Laravel application. Complete the following setup before working on the user's request.

## Prerequisites

Verify that PHP and Composer are available:

```sh
php -v
composer -V
```

If either command is unavailable, detect the user's operating system and install the prerequisites with the appropriate command:

macOS:

```sh
/bin/bash -c "$(curl -fsSL https://php.new/install/mac/8.5)"
```

Windows PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.5'))
```

Linux:

```sh
/bin/bash -c "$(curl -fsSL https://php.new/install/linux/8.5)"
```

After installation, ask the user to restart their terminal. If the agent needs the restarted shell to continue, ask the user to reopen their terminal and rerun their original prompt.

## Agent Setup

Install Laravel Boost from the application root before making application changes:

```sh
composer require laravel/boost --dev
php artisan boost:install
```

Boost replaces these bootstrap instructions with guidelines tailored to the application. After installation, read `AGENTS.md` again and continue with the user's original request using the generated guidelines.
</laravel-boost-guidelines>

# SiPanda Project Guidelines

## Project Context

SiPanda is an academic learning system for university students.

The project is currently being redesigned from SiPanda V1 to SiPanda V2.

### SiPanda V1

The existing application already contains:

- Laravel application
- User authentication
- Academic document upload
- Document text extraction
- Text chunking
- Gemini API integration
- Gemini embeddings
- Vector similarity search
- RAG-based document retrieval
- Ask PANDA functionality

The existing V1 implementation is valuable and should be preserved.

## SiPanda V2 Concept

SiPanda V2 is NOT primarily an AI chatbot.

The main concept is:

> Transform university learning materials into an interactive learning experience.

Core flow:

Material
→ AI Document Understanding
→ Study Pack
→ Learning Activities
→ User Performance
→ Knowledge Gap
→ Personalized Practice
→ Learning Progress

## V2 Core Features

### 1. Academic Materials

Users can:

- upload PDF/PPT documents
- organize materials
- search materials
- view document information
- access a document's Study Pack

### 2. Study Pack

Each academic document can have a Study Pack containing:

- Summary
- Key Concepts
- Flashcards
- Quiz
- Practice Questions
- Ask PANDA

### 3. Quiz

Users can:

- start a quiz generated from their material
- answer questions
- submit answers
- see their score
- see explanations
- review previous quiz attempts

### 4. Knowledge Gap

The system should analyze quiz performance and identify topics where the user has weaker understanding.

Example:

Limit: 90%
Turunan: 80%
Integral: 45%
Trigonometri: 30%

### 5. Personalized Practice

The system can generate additional practice questions based on topics where the user has difficulty.

### 6. Progress

Users can see:

- learning progress
- quiz performance
- strong topics
- weak topics
- learning history

### 7. Ask PANDA

Ask PANDA remains available, but it is a supporting feature rather than the primary product experience.

Existing RAG functionality should be reused where appropriate.

## Existing AI Architecture

The existing V1 RAG flow is approximately:

Upload Document
→ Extract Text
→ Chunk Text
→ Generate Embeddings
→ Store Chunks + Embeddings
→ User Query
→ Query Embedding
→ Similarity Search
→ Relevant Chunks
→ Gemini
→ Answer

Do not replace this architecture unless explicitly requested.

## Development Principles

### Preserve Existing Functionality

Do NOT:

- remove authentication
- remove the existing RAG implementation
- replace Gemini without explicit instruction
- delete existing working features
- rewrite the backend architecture unnecessarily

Prefer extending existing code.

### Incremental Development

Implement V2 incrementally.

Recommended order:

1. UI shell and navigation
2. Dashboard
3. Materials management
4. Document detail
5. Study Pack
6. Summary
7. Key Concepts
8. Flashcards
9. Quiz
10. Quiz Results
11. Knowledge Gap
12. Personalized Practice
13. Progress Dashboard
14. Integration and polish

### UI First

When implementing a new V2 feature, prefer building the UI with mock/static data first.

After the UI is approved and functional, connect it to the backend and AI functionality.

Do not implement the entire V2 architecture in one operation.

### Scope Control

The project has approximately 13 weeks until the end of the semester.

The development team consists of 3 students.

Prioritize a working end-to-end MVP over a large number of incomplete features.

Avoid introducing major features such as:

- real-time voice AI
- AI podcast generation
- social networking
- collaborative learning
- complex recommendation engines
- mobile and web applications simultaneously

unless explicitly requested.

### Database Changes

Before creating significant migrations or changing existing database structures:

1. Inspect the existing schema.
2. Identify whether existing tables can be reused.
3. Explain the proposed change.
4. Prefer minimal schema changes.

Never delete or reset existing data unless explicitly requested.

### Dependencies

Do not install new packages unless necessary.

Before adding a dependency:

1. Check whether the existing Laravel/application stack can solve the problem.
2. Explain why the dependency is needed.
3. Prefer established dependencies already used by the project.

### Verification

After implementing a feature:

- run relevant tests
- run lint/format checks when available
- verify the application builds successfully
- inspect the resulting diff
- report any unresolved issues

Do not claim a feature is complete if it has not been verified.

## Git Safety

This project has a separate backup branch containing the working V1 implementation.

Never:

- force push
- reset the backup branch
- delete the backup branch
- modify the backup branch

Work on the V2 development branch.

Before major changes, inspect:

```bash
git status
git branch
git log --oneline -10
```

Keep changes small and commit meaningful milestones.

Git Commit Safety

Do not create commits automatically unless explicitly requested by the user.

Before creating a commit:

Show the changes made.
Run relevant verification.
Report the verification result.
Wait for user approval before committing.

Never push to a remote repository unless explicitly requested.

Important Agent Behavior

When the user requests a large feature or architectural change:

Inspect the existing implementation first.
Explain what will be changed.
Identify files likely to be affected.
Identify potential risks.
Create an implementation plan.
Implement incrementally.
Verify the implementation.

Do not make broad architectural changes simply because they appear cleaner.

If an existing implementation works, prefer extending it over rewriting it.

## Current State (as of this session)

- Auth: manual (NOT Breeze). Has email/password + Google OAuth (GoogleController).
- Ownership model: documents belong to a `course`, courses belong to a `user`
  (`courses.user_id`). Documents do NOT have their own `user_id`.
- CRITICAL: any query touching `documents` or `chunks` MUST be scoped through
  `course.user_id` to the logged-in user. This includes RAG retrieval
  (RetrievalService::search) and downloads. This has been a recurring bug
  source — do not add new document/chunk queries without this scope.
- Existing models: User, Course, Document, Chunk (all in app/Models).
  Document belongsTo Course; Course hasMany Document; User hasMany Course.
- Stack: Inertia + React using JSX only, NOT TypeScript. Tailwind v4.
- Planned but not yet built: `concepts`, `questions` (JSON options,
  concept_id, source_label), `quiz_attempts`, `attempt_answers`. Knowledge
  Gap has no own table — computed by joining attempt_answers → questions →
  concepts.
- Flashcards and open-ended Practice Questions are lower priority
  (nice-to-have) per the 13-week roadmap — build after the core quiz +
  knowledge gap loop works, unless told otherwise.