# GitHub Repo Publisher · 本地项目发布 GitHub 开源仓库 SOP

![version](https://img.shields.io/badge/version-v1.0-green)
![status](https://img.shields.io/badge/status-beta-blue)
![node](https://img.shields.io/badge/node-14%2B-339933?logo=nodedotjs&logoColor=white)
[![platform](https://img.shields.io/badge/platform-ZCode%20%7C%20Agent%20Skills-orange)](#快速开始)
[![license](https://img.shields.io/badge/license-MIT-red)](LICENSE)
![安全](https://img.shields.io/badge/security-built--in%20leak%20audit-8A2BE2)

🌐 **双语 / Bilingual**：点击下方标题行原地展开对应语言（不跳转）· Click a summary below to expand that language in place.

---

<details open>
<summary><b>🇨🇳 简体中文</b>（点击折叠）</summary>

## 这是什么

一个 Agent Skill：把「把一个本地项目发布成规范的 GitHub 开源仓库」做成**可执行、可审计、可复用**的流水线。

**五段流水线**：备料（README 规格/双语页内切换/双语素材）→ **数据隔离审计**（密钥/隐私/路径，先审计后发布）→ 本地 git → **建仓（询问 token）** → 验收与卫生。

**两道硬门禁**（本 SOP 的核心价值）：

| 门禁 | 规则 |
|---|---|
| **数据隔离审计** | `leak-audit` 有任一 BLOCK（真实密钥/私钥/`.env`/超大文件）→ **禁止建仓**；WARN（个人路径/邮箱/内网地址）逐条人工判定，环境文件按「本机实测」标注豁免 |
| **Token 即问即用** | 建仓前先探测本机凭据；没有则**询问用户提供 token**；token 只经环境变量传递——**不落盘、不写入 `.git/config`**；用完提醒吊销 |

## 快速开始

```bash
# 场景一：把任意项目发布到 GitHub
node scripts/leak-audit.js <项目目录>              # ① 数据隔离审计（必须全绿）
cd <项目目录> && git init && git add -A && git commit -m "..." && git branch -M main   # ② 本地提交
GH_TOKEN=<token> node scripts/make-repo.js \        # ③ 建仓+topics+推送（token 口述给会话即可）
  --dir <项目目录> --name <repo> --desc "<描述>" --topics a,b,c

# 场景二：双语 README 合并为单文件页内切换
node scripts/fold-bilingual.js <项目目录>
```

## 三个脚本（零依赖，Node ≥14）

| 脚本 | 用途 | 关键点 |
|---|---|---|
| `scripts/leak-audit.js` | 数据隔离审计 | 扫密钥/密码/私钥、个人路径/邮箱/内网地址、敏感后缀与超大文件；**退出码 1 = 有 BLOCK** |
| `scripts/make-repo.js` | 建仓 + topics + 推送 | token 走 `GH_TOKEN` 环境变量；推送用一次性 URL（不入 `.git/config`）；仓库已存在时**停下要 --allow-existing 确认** |
| `scripts/fold-bilingual.js` | README 双语单文件化 | `<details open>` 中文 + `<details>` English，点击原地切换不跳转 |

## 铁律

1. **先审计后发布**——BLOCK 未清零不进下一步；
2. **Token 即问即用**——不落盘、不进 git 配置，用完提醒吊销；
3. **不碰别人的东西**——只操作目标目录；远端已存在时停下确认，禁止 `--force`；
4. **发布后卫生**——三查（远端可见 / `.git/config` 无 token / 临时脚本已删）。

## 仓库门面规格

README 的徽章写法、章节序、双语页内切换标记、素材命名（`<name>.zh.*` / `<name>.en.*`）等完整规格见
[`references/readme-spec.md`](references/readme-spec.md)；数据隔离审计的判定口径见
[`references/leak-audit.md`](references/leak-audit.md)。

## 仓库结构

```
github-repo-publisher/
├── SKILL.md                    # 五段流水线 + 两道硬门禁（装到 ~/.agents/skills/github-repo-publisher/）
├── references/
│   ├── leak-audit.md           # 数据隔离审计判定口径
│   └── readme-spec.md          # README 规格（徽章/章节序/双语/素材命名）
├── scripts/
│   ├── leak-audit.js
│   ├── make-repo.js
│   └── fold-bilingual.js
├── install.sh / install.ps1
└── LICENSE
```

## Roadmap

- [x] v1.0 五段流水线 + 数据隔离审计 + token 即问即用 + 双语单文件化
- [ ] v1.1 GitHub Pages 真按钮双语站（README 里做不到 JS 切换时的补充路径）
- [ ] v1.1 发布后巡检脚本（仓库设置/Release 建议自动化）

## License

MIT（见 [LICENSE](LICENSE)）。本 skill 不收集、不上传任何项目数据；发布动作只在用户提供的 token 授权下进行。

</details>

<details>
<summary><b>🇬🇧 English</b> (click to expand)</summary>

## What It Is

An Agent Skill that turns "publish a local project as a well-formed open-source GitHub repo" into an
**executable, auditable, reusable** pipeline.

**Five stages**: prepare (README spec / in-page bilingual / bilingual assets) → **data-isolation audit**
(secrets / privacy / paths — audit before publish) → local git → **repo creation (ask for a token)** →
verification & hygiene.

**Two hard gates** (the core value of this SOP):

| Gate | Rule |
|---|---|
| **Data-isolation audit** | Any BLOCK finding (real secrets / private keys / `.env` / oversized files) → **no repo creation**; WARN items (personal paths / emails / internal hosts) judged one by one, with a "local-tested" exemption for environment files |
| **Ask-for-token** | Probe local credentials first; if none, **ask the user for a token**; the token travels only via environment variable — **never written to disk or `.git/config`**; remind the user to revoke it afterwards |

## Quick Start

```bash
# Case 1: publish any project to GitHub
node scripts/leak-audit.js <project-dir>            # 1. data-isolation audit (must be all green)
cd <project-dir> && git init && git add -A && git commit -m "..." && git branch -M main   # 2. local commit
GH_TOKEN=<token> node scripts/make-repo.js \         # 3. create repo + topics + push
  --dir <project-dir> --name <repo> --desc "<desc>" --topics a,b,c

# Case 2: fold a bilingual README into a single in-page-switch file
node scripts/fold-bilingual.js <project-dir>
```

## The Three Scripts (zero-dependency, Node ≥14)

| Script | Purpose | Key point |
|---|---|---|
| `scripts/leak-audit.js` | Data-isolation audit | Scans secrets/passwords/keys, personal paths/emails/internal hosts, sensitive extensions and oversized files; **exit 1 = BLOCK** |
| `scripts/make-repo.js` | Create repo + topics + push | Token via `GH_TOKEN`; push uses a one-shot URL (never stored in `.git/config`); if the repo exists it **stops and requires `--allow-existing`** |
| `scripts/fold-bilingual.js` | Single-file bilingual README | `<details open>` Chinese + `<details>` English; click to switch in place |

## Iron Rules

1. **Audit before publish** — no BLOCK left, no next step;
2. **Ask-for-token** — never on disk, never in git config; remind to revoke afterwards;
3. **Touch nothing else** — operate only on the target dir; stop and confirm if the remote already exists; never `--force`;
4. **Post-publish hygiene** — triple check (remote visible / `.git/config` clean / temp scripts deleted).

## Repository Front-Page Spec

Badge conventions, section order, in-page bilingual markup and asset naming (`<name>.zh.*` / `<name>.en.*`)
live in [`references/readme-spec.md`](references/readme-spec.md); the audit decision criteria live in
[`references/leak-audit.md`](references/leak-audit.md).

## Repository Structure

```
github-repo-publisher/
├── SKILL.md                    # five stages + two hard gates (install to ~/.agents/skills/github-repo-publisher/)
├── references/
│   ├── leak-audit.md           # audit decision criteria
│   └── readme-spec.md          # README spec (badges / sections / bilingual / asset naming)
├── scripts/
│   ├── leak-audit.js
│   ├── make-repo.js
│   └── fold-bilingual.js
├── install.sh / install.ps1
└── LICENSE
```

## Roadmap

- [x] v1.0 Five stages + data-isolation audit + ask-for-token + bilingual single-file README
- [ ] v1.1 GitHub Pages site with a real language-toggle button
- [ ] v1.1 Post-publish inspection script (repo settings / release suggestions)

## License

MIT (see [LICENSE](LICENSE)). This skill collects and uploads no project data; publishing happens only
under the authorization of the token you provide.

</details>
