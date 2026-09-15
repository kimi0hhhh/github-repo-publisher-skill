# Changelog

## v1.0 · 2026-09-15

### 初版

- 五段流水线：备料（README 规格 / 双语页内切换 / 双语素材）→ 数据隔离审计 → 本地 git →
  建仓（询问 token）→ 验收与卫生。
- **两道硬门禁**：
  - 数据隔离审计（`scripts/leak-audit.js`）：密钥/私钥/密码/敏感文件/超大文件 = BLOCK；
    个人路径/邮箱/内网地址 = WARN；环境文件按「本机实测，按需替换」豁免。
  - Token 即问即用（`scripts/make-repo.js`）：token 只经 `GH_TOKEN` 环境变量传递，
    不落盘、不写 `.git/config`；仓库已存在时停下等 `--allow-existing` 确认；用完提醒吊销。
- `scripts/fold-bilingual.js`：双语双文件 → 单文件 `<details>` 页内切换（含徽章统一上提的修复）。
- `references/readme-spec.md`：README 徽章/章节序/双语标记/素材命名的实测规格。

### 背景（这套 SOP 从哪来）

来自三次真实发布的回填：
1. 从零发布 `market-research-sop-skill`；
2. 回补 `project-orchestrator-skill` 的双语切换按钮与英文版图片（含 SVG 译文 `&` 未转义导致
   解析中断、英文字号出框两个真实坑）；
3. 发布收尾时的安全问题（token 曾在对话中出现）倒逼出「数据隔离审计 + token 即问即用」两道门禁。
