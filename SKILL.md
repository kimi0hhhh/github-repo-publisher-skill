---
name: github-repo-publisher
description: 把一个本地项目/工件目录发布成规范的 GitHub 开源仓库：备料（README 规格/双语页内切换/双语素材）→ 数据隔离审计（密钥/隐私/路径）→ 本地 git → 建仓（询问 token）→ 推送与验收。当用户提出「把这个发到 GitHub」「建个仓库开源」「上传仓库」「发布 skill 仓库」时加载；涉及对外发布、开源、建仓的动作也应触发。
metadata:
  version: "1.0"
  target: zcode
---

# GitHub 仓库发布 SOP

主 Agent 执行。五段：**S1 备料 → S2 数据隔离审计 → S3 本地 git → S4 建仓与推送（询问 token）→ S5 验收与卫生**。
对外发布是不可逆动作：审计与确认必须走在建仓之前。

## 铁律（违反即停下）

1. **先审计后发布**——`leak-audit` 有任一 BLOCK 项，一律不建仓、不推送；WARN 项逐条人工判定留痕。
2. **Token 即问即用**——先探测本机已有凭据；**没有则必须询问用户提供 token**（见 S4 话术）。
   token 只经环境变量传递：**不落盘、不写进 `.git/config`、不写进任何提交文件**；用完提醒用户吊销/轮换。
3. **不碰别人的东西**——只操作目标项目目录；`git push` 前确认远端仓库状态（**已存在的仓库停下确认，绝不覆盖**）；禁止 `--force`。
4. **发布后卫生**——推送完成后三查：远端可见 / `.git/config` 无 token / 含 token 的临时脚本已删除。

## S1 备料（README 规格与素材）

- **README 规格**见 `references/readme-spec.md`：徽章行（shields.io，英文标签）→ 章节序 → 双语页内切换写法 → 素材命名。
- **双语页内切换**：单文件双语言（`<details open>` 中文 + `<details>` English），不跳转。旧的双文件模式
  （README.md + README.en.md）用 `scripts/fold-bilingual.js` 一键合并折叠。
- **素材**：图片/演示 GIF 用 HTML/CSS → 无头 Chrome 截图管线（图用 1.5x、GIF 用 1.0x 逐帧 + PIL 合成），
  中英各一套，命名 `docs/assets/<name>.zh.png|gif` / `<name>.en.png|gif`。
- **必配文件**：`LICENSE`（默认 MIT）、`.gitignore`、`install.sh` + `install.ps1`、
  `docs/CHANGELOG.md`、`docs/CREDITS.md`（引用与来源）。

## S2 数据隔离审计（核心门禁）

运行：`node scripts/leak-audit.js <项目目录>`（零依赖，纯标准库）。

| 级别 | 命中项 | 处置 |
|---|---|---|
| **BLOCK** | 真实 token/私钥/密码/API key；`.env`、`*.pem`、`*.key`；单文件 >5MB | 一律修掉再审计，零 BLOCK 才进 S3 |
| **WARN** | 个人绝对路径（Windows 用户目录 / 类 Unix 家目录）、邮箱、内网 IP/域名、手机号 | 逐条人工判定：能替换就替换，确需保留的注明理由 |
| 提示 | `node_modules/`、`__pycache__/`、缓存目录 | 确认在 `.gitignore` 内 |

- **环境类绝对路径豁免口径**：仅允许出现在显式标注「本机实测，按需替换」的文件中（如 environment-notes.md）。
- 审计结论写入项目内 `docs/LEAK-AUDIT.md`（日期 + 命中清单 + 处置），作为发布留痕。
- 脚本退出码 1 = 存在 BLOCK，**不得进入下一步**。

## S3 本地 git

```bash
git init
# .gitignore 先就位，再 add
git add -A && git commit -m "<项目名> v<版本>：<一句话>"
git branch -M main
```

- 提交身份用仓库维护者身份（如 `kimi0hhhh` + `kimi0hhhh@users.noreply.github.com`），不用公司邮箱/真名。
- 提交前 `git status` 应为干净树（无未跟踪的敏感文件）。

## S4 建仓与推送（**询问 token**）

1. **探测远端**：`git ls-remote https://github.com/<owner>/<repo>.git`
   —— 能读到 refs 说明**仓库已存在，停下向用户确认**（是否推送增量、是否换名字），绝不覆盖。
2. **探测本机凭据**：若本机凭据管理器已有 github.com 凭据（此前推送成功过），普通
   `git push` 可直接工作；否则进入第 3 步向用户要 token。
3. **询问用户 token（必做话术）**：

   > 需要一个 GitHub token 来建仓并推送。请到 GitHub → Settings → Developer settings →
   > Personal access tokens 创建一个 **fine-grained token**，权限只需：
   > **Repository access** 选目标账号，**Permissions**: Contents = Read and write、
   > Administration = Read and write（至少需建仓权限）。
   > token 只会用于本次建仓与推送，不落盘、不写入 git 配置；用完建议立即吊销。

   —— 用户提供后，**只经环境变量传入脚本**，不要写进任何文件或命令行历史之外的地方。
4. **建仓 + 推送**（一条命令做完验证/建仓/设置/推送/接线）：

   ```bash
   GH_TOKEN=<token> node scripts/make-repo.js \
     --dir <项目目录绝对路径> \
     --name <repo 名> \
     --desc "<仓库描述>" \
     --topics agent-skill,xxx,yyy
   # 私有仓库加 --private；默认 public（开源）
   ```

   脚本内部顺序：`GET /user` 验证 token → `POST /user/repos` 建仓（422=已存在则跳过）→
   `PUT /repos/{owner}/{repo}/topics` → 用**一次性 token URL** 推送（不写入 `.git/config`）→
   `fetch` + 设置 upstream → `ls-remote` 验证 → 检查 `.git/config` 无 token。

5. **公开/私有**：默认 public；用户明确要求私有才加 `--private`。

## S5 验收与卫生

- **三查**：① `git ls-remote origin` 可见新提交；② `.git/config` 不含 token；③ 仓库设置
  （description / topics / license）与预期一致。
- **卫生**：删除任何含 token 的临时脚本；**提醒用户吊销或轮换刚用过的 token**
  （凭据管理器缓存会随之失效，下次推送需重新授权，属正常）。
- **汇报**：仓库 URL + 已建设置清单（description/topics/许可/可见性）+ 后续建议
  （Release、GitHub Pages 按钮式双语站等）。

## 脚本清单（零依赖，Node ≥14）

| 脚本 | 用途 | 关键点 |
|---|---|---|
| `scripts/leak-audit.js` | 数据隔离审计 | 退出码 1 = 有 BLOCK；扫描密钥/隐私/路径/大文件 |
| `scripts/make-repo.js` | 建仓 + topics + 推送 | token 走 `GH_TOKEN` 环境变量；推送用一次性 URL，不落盘 |
| `scripts/fold-bilingual.js` | 双语双文件 → 单文件页内切换 | 输入 README.md + README.en.md；<details> 折叠 |

## 环境注记

- Git Bash 常缺 coreutils（curl/head/which 可能没有）：用 node/python **绝对路径**；Windows 路径用正斜杠。
- `git` 可用绝对路径调用（如 `D:/Git/Git/cmd/git.exe`）；GitHub API 走脚本内置 https，不需要 curl。
- 相关素材管线（HTML/CSS → Chrome → PNG/GIF）的完整设计规范可参考 `market-research-sop` 技能的 `chart-playbook.md`。
