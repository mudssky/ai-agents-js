# ai-agents-js

这是一个 AI Agent 学习和实践项目，包含 Node.js 和 Deno 的示例。

## 项目结构与运行环境

本项目混合使用了 Node.js 和 Deno 两种运行时环境，具体配置如下：

### 1. Deno 环境 (`notebooks/`)

- **目录**: `notebooks/` (不包含 `examples` 子目录)
- **用途**: 用于运行 Jupyter Notebooks (`.ipynb`) 和部分 Deno 脚本。
- **配置文件**: `notebooks/deno.json`
- **说明**: 该目录下的代码使用 Deno 运行时。VS Code 已配置为仅在此目录下启用
  Deno 扩展。

### 2. Node.js 环境 (`notebooks/examples/` & 项目根目录)

- **目录**: `notebooks/examples/` 以及项目根目录下的源代码 (`src/`)
- **用途**: 用于运行大部分示例代码和核心逻辑。
- **配置文件**: `package.json`, `tsconfig.json`
- **说明**:
  - `notebooks/examples/` 下的 `.ts` 文件均为 Node.js 代码。
  - 请使用 `npm` 或 `pnpm` 安装依赖。
  - 运行示例推荐使用
    `tsx`，例如：`npx tsx notebooks/examples/007createVectorDb.ts`

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 运行 Node.js 示例

确保已配置好相关环境变量（如 Ollama 服务等）。

```bash
npx tsx notebooks/examples/xxxx.ts
```

### 运行 Deno 任务

进入 `notebooks` 目录：

```bash
cd notebooks
deno task dev
```
