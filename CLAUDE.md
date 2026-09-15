# SchemaCraft AI

SchemaCraft AI is an AI-powered visual JSON Schema form builder
built with React, TypeScript, MUI, RJSF and AJV.

This project is based on the open-source JSON-Schema-Builder
and is being incrementally redesigned and extended.

## Development Goals

The project will gradually support:

- Visual form field creation and editing
- Field ordering
- JSON Schema generation
- UI Schema generation
- RJSF live preview
- Schema import/export
- Undo/redo history
- Local draft persistence
- Conditional field logic
- AI-powered form generation
- Schema validation
- Unit tests
- Rendering performance optimization

## Development Rules

1. Do not perform large refactors unless explicitly requested.
2. Prefer small, reviewable changes.
3. Do not modify unrelated files.
4. Keep TypeScript types explicit and avoid `any`.
5. Do not mutate React state directly.
6. Preserve existing behavior unless the task explicitly changes it.
7. Explain architectural changes before implementing them.
8. New dependencies must be explained before installation.
9. Business logic should be separated from UI components where appropriate.
10. Every feature should be independently testable.

## Workflow

Before implementing a feature:

1. Read the relevant existing files.
2. Explain the current implementation.
3. Propose the smallest reasonable change.
4. Wait for confirmation before major architectural changes.
5. Implement the change.
6. Run lint/build/tests.
7. Summarize the changed files.