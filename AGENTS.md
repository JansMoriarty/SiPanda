<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

## Foundational Context

This application is a Laravel application running on PHP 8.3. Always use the APIs that match the installed major version of each package — do not assume a version.

Before relying on a package's API, confirm its installed version:
- PHP packages: run `composer show --direct` to list direct dependencies with versions, or `composer show <vendor/package>` for a single package.
- JS packages: check `package.json` for the installed versions.

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If a frontend change doesn't show in the UI or you get a "Unable to locate file in Vite manifest" error, run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Use `search-docs` before changes that depend on Laravel ecosystem APIs, behavior, configuration, or version-specific syntax. Skip it for copy-only edits and other changes where package documentation is irrelevant. Reuse sufficient results already in context instead of searching again.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Project Rules

- This project contains committed, area-grouped rules in `.ai/rules` when that directory exists, including path-scoped framework guidelines under `.ai/rules/boost`. Before you enter plan mode or create/edit any file, you MUST first: open @.ai/rules/index.md (it maps file globs to rule files), read every rule file whose globs cover the path(s) in scope, and run `grep -rin 'keyword' .ai/rules` to catch what a path match alone misses. Do not write code until you have read and are following every matching rule. If `.ai/rules` does not exist, continue without it.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.
- Activate the `deploying-to-cloud` skill whenever deploying to Laravel Cloud, configuring Cloud environments or resources, using the Cloud CLI, or troubleshooting Cloud deployments.

=== tests rules ===

# Test Enforcement

- Add or update tests for behavior and logic changes when a test provides meaningful regression coverage.
- Pure copy, styling, and layout-only changes do not require new or updated tests.
- When test coverage applies, run the affected tests and ensure they pass.
- Test the changed behavior and its important failure modes, but do not add tests beyond them.
- Read the `testing-best-practices` skill before writing tests.

=== inertia-laravel/core rules ===

# Inertia

- Inertia creates fully client-side rendered SPAs without modern SPA complexity, leveraging existing server-side patterns.
- Components live in `resources/js/Pages` (unless specified in `vite.config.js`). Use `Inertia::render()` for server-side routing instead of Blade views.
- ALWAYS use `search-docs` tool for version-specific Inertia documentation and updated code examples.
- IMPORTANT: Activate `inertia-react-development` when working with Inertia client-side patterns.

# Inertia v3

- Use all Inertia features from v1, v2, and v3. Check the documentation before making changes to ensure the correct approach.
- New v3 features: standalone HTTP requests (`useHttp` hook), optimistic updates with automatic rollback, layout props (`useLayoutProps` hook), instant visits, simplified SSR via `@inertiajs/vite` plugin, custom exception handling for error pages.
- Carried over from v2: deferred props, infinite scroll, merging props, polling, prefetching, once props, flash data.
- When using deferred props, add an empty state with a pulsing or animated skeleton.
- Axios has been removed. Use the built-in XHR client with interceptors, or install Axios separately if needed.
- `Inertia::lazy()` / `LazyProp` has been removed. Use `Inertia::optional()` instead.
- Prop types (`Inertia::optional()`, `Inertia::defer()`, `Inertia::merge()`) work inside nested arrays with dot-notation paths.
- SSR works automatically in Vite dev mode with `@inertiajs/vite` - no separate Node.js server needed during development.
- Event renames: `invalid` is now `httpException`, `exception` is now `networkError`.
- `router.cancel()` replaced by `router.cancelAll()`.
- The `future` configuration namespace has been removed - all v2 future options are now always enabled.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== phpunit/core rules ===

# PHPUnit

- This project uses PHPUnit. Create tests with `php artisan make:test --phpunit {name}`.
- Do not include the test suite directory in `{name}`. Use `SomeFeatureTest`, not `Feature/SomeFeatureTest`.
- Read the `testing-best-practices` skill for guidance on coverage, naming, structure, dependency isolation, and review.

## Running Tests

- Run the narrowest set of tests that covers the change. Pass a file path or `--filter=testName` to `php artisan test --compact`.
- Rerun a test after each change to it.
- Run `vendor/bin/phpunit` to call the test runner directly. It accepts the same file path and `--filter=testName` arguments.

=== inertia-react/core rules ===

# Inertia + React

- IMPORTANT: Activate `inertia-react-development` when working with Inertia React client-side patterns.

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
