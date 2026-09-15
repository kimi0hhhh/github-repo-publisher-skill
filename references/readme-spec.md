# readme-spec.md — 仓库门面规格
> 引用位置：SKILL.md §S1；加载时机：写 README 与做素材前读。
> 规格来源：对 GitHub 上多个成熟 skill 仓库（project-orchestrator-skill、chart-forge、tufte 等）的实测归纳。

## 1. 徽章行（顶部）

- **标签一律英文**（`version` / `platform` / `license`…），中文标签不合群；
- 用 shields.io：`![label](https://img.shields.io/badge/<label>-<value>-<color>)`；
- **平台徽章两种合法写法**：① 具体宿主名串联（值里用 `%20%7C%20` 表示「空格+竖线」，橙色）；
  ② 通用 `Agent Skill` 徽章。宿主名至少出现一次（徽章或安装命令注释）；
- **徽章做成链接**是常见做法：`license` → `LICENSE`、`platform/install` → 安装章节锚点；
- 推荐组成：version / status / runtime(python 或 node) / platform / license / 一句最有说服力的验证数据。

## 2. 章节序（骨架）

```
# 名称 · 一句话定位
[徽章行]
🌐 双语提示（若双语）
## 这是什么        ← 一段定位 + 一张分工/结构表
## 快速开始        ← 三步内能跑起来（bash 块 + Windows 写法）
## Demo            ← 动图（真实运行，非动画）+ 一句数据说明
## 核心机制        ← 流程/架构图（SVG 或 PNG）
## 站在谁的肩膀上   ← 第三方 skill 引用表 + 实战来源
## 纪律/铁律       ← 产品不可妥协的几条
## 诚实地说说优缺点 ← 缺点要具体（缺什么验证、依赖什么），不写空话
## 仓库结构        ← 代码块画树 + 行尾注释
## Roadmap         ← 复选框列表 + Changelog 指引
## License 与隐私  ← 许可 + 数据处理声明
```

## 3. 双语页内切换（GitHub 官方唯一可行方案）

GitHub README **禁用 JavaScript**，真·按钮切换不可行。`<details>` 折叠块是唯一
「点击后在同一页内切换」的写法：

```html
🌐 **双语 / Bilingual**：点击下方标题行原地展开对应语言（不跳转）

<details open>
<summary><b>🇨🇳 简体中文</b>（点击折叠）</summary>

…中文全文（Markdown 前后必须留空行，否则不渲染）…

</details>

<details>
<summary><b>🇬🇧 English</b> (click to expand)</summary>

…English full text…

</details>
```

- 徽章与 H1 放**折叠块外**（两种语言共用一份）；
- 从「双文件（README.md + README.en.md）」迁移：跑 `scripts/fold-bilingual.js <目录>` 一键折叠，
  旧英文文件保留为指路页（兼容外链）；
- 想要**真按钮**切换只能走 GitHub Pages 静态站（README 顶部挂「🌐 在线版」入口）。

## 4. 素材规格（图片与动图）

- 目录：`docs/assets/`；命名带语言后缀：`<name>.zh.png|svg|gif` 与 `<name>.en.png|svg|gif`；
- **生产管线**：HTML/CSS 卡片 → 无头 Chrome 截图（图 1.5x / GIF 帧 1.0x）→
  GIF 用 PIL 合成（首帧调色板统一防闪烁，逐帧时长 1.2–2.2s，尾帧可加长）；
- SVG 本地化：按 `<text>` 节点整段替换文案；**译文中的 `&` 必须转义为 `&amp;`**（否则 SVG 解析中断、
  只渲染一半）；英文串较长时按 0.84 缩放字号防出框；
- **诚实边界**：UI 截图/录屏是中文界面的真实记录，不伪造英文版——英文 README 里标注
  `(Chinese UI)`，不假装是英文图。

## 5. 必配文件清单

| 文件 | 要求 |
|---|---|
| `LICENSE` | 默认 MIT，含年份与维护者名 |
| `.gitignore` | 至少覆盖 `node_modules/`、缓存目录、产物目录、系统文件 |
| `install.sh` + `install.ps1` | 装到 `~/.agents/skills/<name>/`（+ `~/.zcode/skills/`），幂等可重跑 |
| `docs/CHANGELOG.md` | 按版本倒序；「背景」节写清为什么这么改 |
| `docs/CREDITS.md` | 第三方引用与实战来源（有引用就必须写） |
| `DESCRIPTION.md`（可选） | 市场/清单页用的短描述 |

## 6. 仓库 About 描述（GitHub 仓库页侧栏）

- **上限 350 字符**、纯文本、无换行、不支持 Markdown（emoji 与 `→·｜` 等符号可用）；
- **双语写法**：一行内「中文精简版 ｜ 英文精简版」，用全角竖线 `｜` 分隔；
- 双语各自都要**保留最有辨识度的三段**：定位一句话 → 核心机制 → 验证/规模数据；
  不要逐字翻译长句——About 是广告位，不是 README；
- 更新方式（API，改完立即生效）：

  ```bash
  # PATCH /repos/{owner}/{repo}  {"description": "<双语一行>"}
  ```

- 改完在脚本里校验字符数（`[...desc].length ≤ 350`），超限先删次要修饰词再提交。
