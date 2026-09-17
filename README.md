# SchemaCraft AI

**SchemaCraft AI** — Visual JSON Schema Form Builder.

Design form fields in an intuitive click-to-add editor, preview the rendered form in real time, and generate and export reusable JSON Schema and UI Schema — without writing schema code by hand.

Built with React, TypeScript, Material-UI, RJSF, and Vite.

![SchemaCraft AI](https://img.shields.io/badge/SchemaCraft%20AI-Visual%20JSON%20Schema%20Form%20Builder-764ba2.svg)
![React](https://img.shields.io/badge/React-18+-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)
![Material-UI](https://img.shields.io/badge/MUI-7.3+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 💡 Why SchemaCraft AI / Use Cases

Schema-driven forms are the backbone of products where forms must be configurable instead of hard-coded. SchemaCraft AI is designed for:

- **Enterprise back-office**: build configurable data-entry forms for internal tools without frontend changes
- **CRM / ERP systems**: define custom fields and form layouts per team or business unit
- **Approval workflows**: model structured request forms (purchase, leave, budget) with JSON Schema validation
- **SaaS dynamic forms**: offer a schema-based form builder inside your own product for end-user customization
- **Data collection**: quickly design surveys, registrations, and intake forms with a live preview

## ✨ Current Features

**Builder**

- **9 Field Presets**: text, number, checkbox, select, textarea, email, password, date, radio
- **Visual Form Builder**: click-to-add component library, canvas, and a properties inspector
- **Drag & Drop Ordering**: reorder fields on the canvas or from the outline, with stable field identity
- **Duplicate & Delete**: per-field actions on the canvas
- **Form Layout**: 1–4 column grid with per-field width overrides
- **Conditional Logic**: per-field rules — show/hide, enable/disable, require/optional — authored in the inspector
- **Live Preview**: the real RJSF form, rendered as you build

**Schema**

- **JSON Schema & UI Schema Generation**: standards-shaped output, with conditional logic kept out of it
- **Runtime Validation**: AJV-backed validation on submit, with hidden fields correctly excluded
- **Preview Submission**: a real submit button, configurable label, and the payload it would send
- **Copy & Export**: copy to clipboard or download `schema.json` / `uiSchema.json`

**Persistence & Forms**

- **LocalStorage Persistence**: drafts survive a refresh, keyed by a versioned store
- **Saved Forms Management**: list, open, and delete saved forms at `/forms`

**AI Form Generation**

- **Natural-language Generation**: describe a form and get a reviewable draft at `/create/ai`
- **DeepSeek Server Proxy**: the key stays server-side; the browser only ever calls `/api/ai/generate-form`
- **Structured `AIFormDraft`**: a narrow contract anchored on preset keys, requested as `text.format` JSON Schema
- **Double AJV Validation**: the reply is validated on the server and again in the browser
- **Preview, Regenerate, Use in Builder**: nothing is saved until you accept a draft

**Quality**

- **Vitest**: 254 tests covering the schema, conversion, validation, storage, and server layers

## 🗺️ Roadmap

Not implemented yet:

- Schema import (JSON Schema → fields)
- Undo / redo history
- Auto save
- Compacting the grid when a conditional field is hidden
- AI editing of an existing form, and AI-generated conditional logic
- Rendering performance optimization

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/luojingjing0920/schema-craft-ai-clean.git
cd schema-craft-ai-clean
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. (Optional) Configure AI generation — see [AI Form Generation](#-ai-form-generation):
```bash
# .env — never commit this file
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-flash
```

5. Open your browser and navigate to `http://localhost:5173`

## 🛠️ Tech Stack

- **Frontend Framework**: React 19.1+
- **Language**: TypeScript 5.8+
- **Build Tool**: Vite 7.1+
- **UI Library**: Material-UI (MUI) 7.3+
- **Form Library**: React JSON Schema Form (RJSF) 6.0+
- **Validation**: AJV (form data, and the AI draft contract)
- **AI**: DeepSeek Responses API, proxied server-side
- **Styling**: Emotion (CSS-in-JS)

## 🎯 Usage

### Creating a Form

1. **Add Fields**: Click on field type buttons to add fields to your form
2. **Reorder Fields**: Drag a field by its rail on the canvas, or use the outline on mobile
3. **Configure Fields**: Select a field to edit its properties in the right panel
4. **Set Validation**: Configure validation rules, required fields, and constraints
5. **Preview**: View your form in real-time in the center panel
6. **Add Logic**: Give a field conditions in its inspector — show/hide, enable/disable, require/optional
7. **Preview & Submit**: Validate and submit the real form, and see the payload it would send
8. **Save**: Persist the form locally and reopen it from `/forms`
9. **Export**: Copy or download the generated JSON Schema and UI Schema

Or skip the manual work at `/create/ai` and describe the form in plain language.

### Supported Field Types

Nine presets, each a fixed `(dataType, widget, format)` combination:

- **Text**: single-line string input
- **Number**: numeric input with min/max
- **Checkbox**: boolean, optionally rendered as radios
- **Select**: dropdown backed by an enum
- **Text Area**: multi-line string with configurable rows
- **Email**: string with `format: email`
- **Password**: masked string input
- **Date**: string with `format: date`
- **Radio**: enum rendered as radio buttons, optionally inline

### Field Configuration Options

- **Basic Properties**: Name, title, description, placeholder
- **Validation**: Required fields and numeric min/max constraints
- **UI Options**: Widget type, inline display, disabled state
- **Help Text**: Additional guidance for users

## 📊 Schema Output

The application generates two types of schemas:

### JSON Schema
Standard JSON Schema for form validation and structure:
```json
{
  "type": "object",
  "properties": {
    "age": {
      "type": "number",
      "title": "Age",
      "minimum": 18,
      "maximum": 65
    }
  },
  "required": ["age"]
}
```

### UI Schema
UI-specific configuration for form rendering:
```json
{
  "email": {
    "ui:placeholder": "Enter your email address",
    "ui:help": "We'll never share your email"
  }
}
```

## 🤖 AI Form Generation

Describe a form in plain language at `/create/ai` and get a draft to review before it becomes a form.

### Configuration

The API key lives on the server only, and never reaches the browser:

```bash
# .env (not committed)
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-flash
# optional: DEEPSEEK_BASE_URL, DEEPSEEK_MAX_OUTPUT_TOKENS
```

The key is read from the server process environment, falling back to `.env`. **Never name it
`VITE_DEEPSEEK_API_KEY`** — Vite inlines `VITE_`-prefixed variables into the client bundle, which
would ship your key to every visitor. Keep `.env` out of git (it is already in `.gitignore`).

Generation uses DeepSeek's **Responses API** (`POST /responses`) with
`text.format = { type: "json_schema", name, schema }`, so the model is constrained by the draft
schema while it generates. That constraint is a convenience, not a guarantee: the reply is still
validated with AJV, on the server and again in the browser.

### How it works

1. The browser POSTs `{ prompt }` to `/api/ai/generate-form`. It never contacts the provider.
2. The server builds its system prompt from `FIELD_PRESETS`, calls DeepSeek with the draft schema
   as `text.format`, and validates the reply with AJV against `AI_FORM_DRAFT_SCHEMA`.
3. The browser validates the same payload again before converting it — the proxy's answer is
   untrusted input like any other.
4. The validated draft is converted to a `FormDefinition` **only after** the user reviews it.
   Nothing is written to storage until **Use in Builder** is pressed, so regenerating as often as
   you like leaves no half-finished records behind.

### Deployment boundary

`vite preview` is **not** a production server. The `/api/ai/generate-form` route is served by a Vite
middleware (`server/aiProxyPlugin.ts`), which only exists while Vite is running.

**Deploying the static `dist/` to a static host means the endpoint does not exist**, and
`/create/ai` will report that generation is not configured. To run it in production, mount the
handler in a serverless function:

```js
// server/formDraftHandler.ts is framework-agnostic: body in, { status, body } out.
import { createFormDraftHandler } from './server/formDraftHandler'
import { createDeepSeekClient, readDeepSeekConfig } from './server/deepseek'

const client = createDeepSeekClient(readDeepSeekConfig())
const handler = createFormDraftHandler({ callLLM: (p, s) => client.generateFormDraft(p, s) })

export default async function (req, res) {
  const result = await handler(await req.json())
  res.status(result.status).json(result.body)
}
```

Only the adapter is new: the handler imports nothing from Vite.

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm test         # Run the Vitest suite
```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Attribution

SchemaCraft AI was initially based on [JSON-Schema-Builder](https://github.com/M3MONs/JSON-Schema-Builder) by [M3MONs](https://github.com/M3MONs) and has since been independently extended and redesigned.

The original project is distributed under the MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

- [React JSON Schema Form](https://rjsf-team.github.io/react-jsonschema-form/) for the form rendering engine
- [Material-UI](https://mui.com/) for the beautiful component library
- [Vite](https://vitejs.dev/) for the lightning-fast build tool
