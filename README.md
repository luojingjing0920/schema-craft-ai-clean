<div align="center">

✨ SchemaCraft AI

Schema-driven AI Form Builder

自然语言生成表单 · 可视化编辑 · 条件逻辑 · Schema 输出 · 本地持久化

<p>
  <img src="https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/MUI-7.3-007FFF?logo=mui&logoColor=white" />
  <img src="https://img.shields.io/badge/RJSF-6.0-6C63FF" />
  <img src="https://img.shields.io/badge/AJV-Validation-23C483" />
  <img src="https://img.shields.io/badge/DeepSeek-AI-4D6BFE" />
  <img src="https://img.shields.io/badge/Vitest-254%20tests-6E9F18?logo=vitest&logoColor=white" />
</p>

From natural-language requirements to a validated, editable and reusable form definition.

</div>

🌟 项目简介 / Overview

SchemaCraft AI 是一个基于 React + TypeScript 的 Schema-driven AI 可视化表单构建器。

它不是简单地让大模型直接返回 JSON Schema，而是先让模型生成受约束的 AIFormDraft，再经过 AJV 校验与规范化转换为统一的 FormDefinition，最终进入可视化 Builder 继续编辑。

核心目标：

用自然语言快速生成表单草稿

用可视化 Builder 二次编辑

用 Conditional Logic 描述字段依赖

用 JSON Schema / UI Schema 统一描述结构与展示

用 Runtime Schema 保证动态校验和提交行为正确

用 LocalStorage 保存并重新打开表单

🧭 核心链路 / Core Flow

Natural Language Prompt
        ↓
DeepSeek
        ↓
Structured AIFormDraft
        ↓
Server AJV Validation
        ↓
Client AJV Validation
        ↓
FormDefinition
        ↓
Visual Builder
        ↓
Conditional Logic
        ↓
Runtime Schema / Validation
        ↓
Preview & Submit
        ↓
Persistence / Reopen

✨ Current Features

🧱 Visual Builder

9 Field Presets：Text / Number / Checkbox / Select / Textarea / Email / Password / Date / Radio

Canvas Builder：Component Library + Form Canvas + Properties Inspector

Drag & Drop：基于稳定 field.id 的字段排序

Duplicate / Delete：字段复制与删除

Form Layout：1–4 列布局 + 字段 Width Override

Field / Form Settings：字段属性、校验、布局、提交配置

Live Preview：实时渲染真实 RJSF 表单

🔗 Conditional Logic

支持字段级条件规则：

show / hide

enable / disable

required / optional

规则通过稳定的 field.id 建立跨字段依赖，不依赖数组下标或可变字段名。

运行时语义：

Edit Canvas
→ 所有字段始终可编辑

Preview
→ 条件规则实时执行
→ 动态显隐 / 禁用 / 必填

隐藏字段：

UI state 中保留原值

Runtime Schema 中移除，避免不可见字段阻塞校验

Submission Payload 中排除

🧾 Schema & Runtime

JSON Schema Generation

UI Schema Generation

Copy / Export

AJV Runtime Validation

Runtime Schema Derivation

Preview Submit

Submission Payload Preview

Conditional Logic 和 AI metadata 不会污染导出的 JSON Schema / UI Schema。

💾 Persistence & Forms

LocalStorage Repository

Saved Forms Management

Recent Forms

Open / Reopen

Refresh Recovery

Delete with Confirmation

Corrupted Store Protection

完整生命周期：

Create → Builder → Save → Forms → Reopen

🤖 AI Form Generation

自然语言生成表单

DeepSeek Server Proxy

Structured AIFormDraft

FieldPreset 约束 AI 输出空间

服务端 + 客户端 双重 AJV 校验

Preview / Regenerate / Use in Builder

API Key 仅保存在服务端环境变量

AI 不直接组合 dataType / widget / format，而是从项目已有的合法 Field Preset 中选择，避免生成不可编辑或不受支持的字段结构。

✅ Quality

254 Vitest tests

覆盖：

Schema conversion

Field state

Form persistence

Conditional Logic

Runtime Schema

AI Draft validation

Server handler

🏗️ Architecture

AI Layer
┌──────────────────────────────┐
│ Prompt → DeepSeek            │
│        → AIFormDraft         │
│        → AJV Validation      │
└──────────────┬───────────────┘
               ↓
Domain Layer
┌──────────────────────────────┐
│ FormDefinition              │
│ Field / FieldPreset         │
│ FieldReaction               │
└──────────────┬───────────────┘
               ↓
Conversion Layer
┌──────────────────────────────┐
│ schemaConverter             │
│ JSON Schema / UI Schema     │
└──────────────┬───────────────┘
               ↓
Runtime Layer
┌──────────────────────────────┐
│ fieldReactions              │
│ formRuntime                 │
│ RJSF + AJV                  │
└──────────────┬───────────────┘
               ↓
Persistence
┌──────────────────────────────┐
│ LocalStorage Repository     │
│ Saved Forms                 │
└──────────────────────────────┘

🚀 Quick Start

Prerequisites

Node.js 18+

npm / yarn / pnpm

Installation

git clone https://github.com/luojingjing0920/schema-craft-ai-clean.git
cd schema-craft-ai-clean
npm install

AI Configuration

在项目根目录创建 .env：

DEEPSEEK_API_KEY=your_api_key
DEEPSEEK_MODEL=deepseek-flash

⚠️ 不要使用 VITE_DEEPSEEK_API_KEY。
VITE_ 前缀变量会进入客户端 bundle，可能导致 API Key 泄露。

启动：

npm run dev

访问：

http://localhost:5173

🤖 AI Form Generation

访问：

/create/ai

输入自然语言，例如：

生成一份求职申请表，需要姓名、邮箱、年龄、学历、期望岗位和工作经历。姓名和邮箱必填，学历和期望岗位使用下拉框，两列布局。

流程：

Generate
   ↓
AI Draft Preview
   ↓
Regenerate / Use in Builder
   ↓
Builder

只有点击 Use in Builder 后才会正式写入本地存储，Regenerate 不会制造无用的 Saved Form。

🧠 Why AIFormDraft instead of JSON Schema?

SchemaCraft AI 不让 LLM 直接生成最终 JSON Schema。

原因：

JSON Schema 无法完整表达 Builder 内部编辑状态

LLM 可能生成项目不支持的 Schema 能力

AI 不应该生成应用内部 id / createdAt / updatedAt

Builder 和 AI 必须最终进入同一个 FormDefinition

因此采用：

LLM
↓
AIFormDraft
↓
Validation / Normalize
↓
FormDefinition
↓
Schema Converter
↓
JSON Schema / UI Schema

LLM 负责理解用户意图，SchemaCraft 负责保证结构合法。

🛠️ Tech Stack

Layer

Technology

Frontend

React 19 / TypeScript

UI

Material UI

Form Runtime

React JSON Schema Form

Validation

AJV

Build

Vite

AI

DeepSeek Responses API

Testing

Vitest

Persistence

LocalStorage

🧪 Development

npm run dev
npm run build
npm run preview
npm run lint
npm test

🗺️ Roadmap

Schema Import

Undo / Redo

Auto Save

Runtime hidden-grid compaction

AI editing existing forms

AI-generated Conditional Logic

Performance optimization

⚠️ Deployment Boundary

当前 /api/ai/generate-form 由 Vite middleware 提供。

因此：

npm run dev
npm run preview

可以使用 AI API。

但如果只把静态 dist/ 部署到纯静态托管平台，则 /api/ai/generate-form 不存在。

正式部署时，需要将 framework-agnostic AI handler 挂载到 Serverless Function / Backend API。

🙏 Attribution

SchemaCraft AI initially started from
JSON-Schema-Builder

and has since been substantially redesigned and extended with:

unified FormDefinition / Field

drag & drop builder

persistence

conditional logic

runtime validation

preview submission

AI form generation

The original project is distributed under the MIT License.

<div align="center">

⭐ If this project helps you, feel free to star it.

SchemaCraft AI · Build forms from intent, not boilerplate.

</div>