既然你选择使用 `package.json` 来管理脚本（这在混合项目或习惯 npm
生态的团队中很常见），我们可以把前面提到的工具链封装成易于记忆的 `npm run`
命令。

以下是针对 **Deno Notebook + Jupytext (.ts) + Git** 工作流的 `package.json`
配置模板。

### 1. `package.json` 配置模板

你可以直接把这段 `scripts` 复制到你的 `package.json` 中：

```json
{
  "name": "deno-notebook-project",
  "version": "1.0.0",
  "scripts": {
    "----------------SETUP----------------": "",
    "setup:tools": "pip install nbstripout jupytext && deno jupyter --unstable --install",
    "setup:git": "nbstripout --install",
    "init": "npm run setup:tools && npm run setup:git",

    "----------------SYNC----------------": "",
    "to:nb": "jupytext --to notebook --output-dir . notebooks/*.ts",
    "to:ts": "jupytext --to ts:percent --output-dir . notebooks/*.ipynb",
    "sync": "jupytext --sync notebooks/*.ipynb",

    "----------------QUALITY----------------": "",
    "lint": "deno lint notebooks/*.ts",
    "clean:output": "nbstripout notebooks/*.ipynb"
  },
  "devDependencies": {
    "wait-on": "^7.2.0"
  }
}
```

> **注意**：上面的命令假设你的 notebook 文件存放在 `notebooks/`
> 目录下。如果在根目录，请把 `notebooks/*.ts` 改为 `*.ts`（但要小心不要误伤普通
> TS 文件）。

---

### 2. 命令详细说明

#### A. 初始化环境 (一次性工作)

当新同事加入项目，或者你克隆了仓库后，只需运行一次：

- **`npm run init`**
  - 它会自动执行 `pip install` 安装 Python 工具。
  - 它会自动注册 Deno Kernel 到 Jupyter。
  - 它会自动配置 `.git/config` 中的过滤器（nbstripout），防止输出结果被提交。

#### B. 核心工作流 (Sync)

这是配合 **“只提交 .ts 文件”** 策略的核心命令：

- **`npm run to:nb` (还原 Notebook)**
  - **场景**：你刚 `git pull` 下来一堆 `.ts` 文件，想在本地生成 `.ipynb`
    文件以便在 Jupyter 界面中运行。
  - **原理**：调用 Jupytext 将 TypeScript 转换回 Jupyter Notebook 格式。

- **`npm run to:ts` (生成 TS)**
  - **场景**：如果你没有配置 Jupytext 的自动保存（Pairing），或者想强制刷新一遍
    TS 文件。
  - **原理**：将 `.ipynb` 转换为 `percent` 格式的 TypeScript。

#### C. 代码质量与清理

- **`npm run lint`**
  - **优势**：因为我们有同步好的 `.ts` 文件，所以可以直接用 `deno lint` 检查
    Notebook 的代码规范！这在以前纯 `.ipynb` 时代是很难做到的。
- **`npm run clean:output`**
  - **场景**：手动清理 Notebook 的输出（虽然 `setup:git`
    已经配置了自动清理，但有时候你可能想在本地手动跑一下看看效果）。

---

### 3. 实际工作流演示

假设你是一个刚加入项目的新人，你的操作流程如下：

1. **拉取代码**：

   ```bash
   git clone <repo-url>
   cd my-project
   ```

   _(此时目录里只有 `package.json`, `deno.json` 和 `notebooks/analysis.ts`)_

2. **初始化环境**：

   ```bash
   npm run init
   ```

3. **生成 Notebook**：

   ```bash
   npm run to:nb
   ```

   _(此时目录下生成了 `notebooks/analysis.ipynb`)_

4. **开发与运行**：
   - 打开 VS Code，编辑 `analysis.ipynb`（或者直接编辑 `analysis.ts`）。
   - 运行代码，查看图表。

5. **提交代码**：

   ```bash
   # 无论你改了 .ipynb 还是 .ts，只要配置了 jupytext sync，它们内容是一致的
   # 但 Git 策略里我们只追踪 .ts
   git add notebooks/analysis.ts
   git commit -m "feat: 更新数据分析逻辑"
   git push
   ```

### 4. 补充：Deno Native 方式 (`deno.json`)

虽然你问的是 `package.json`，但既然是 Deno 项目，使用 `deno.json` 的 `tasks`
也是一个很好的选择（不需要 Node/NPM 环境）：

**`deno.json`**:

```json
{
  "tasks": {
    "init": "pip install nbstripout jupytext && nbstripout --install && deno jupyter --unstable --install",
    "to:nb": "jupytext --to notebook *.ts",
    "lint": "deno lint *.ts"
  }
}
```

运行方式：

```bash
deno task init
deno task to:nb
```
