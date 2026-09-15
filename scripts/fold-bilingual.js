/**
 * fold-bilingual.js — 「双语双文件」→「单文件页内切换」
 *
 * 用法：node fold-bilingual.js <项目目录>
 * 输入：README.md（中文）+ README.en.md（英文）
 * 输出：README.md = 标题 + 徽章（统一提到顶部）+ 🌐 提示 + <details open> 中文 + <details> English
 *       README.en.md = 指路页（兼容旧外链，不再承载内容）
 *
 * 为什么是 <details>：GitHub README 禁用 JavaScript，真·按钮切换不可行；
 * <details open> 折叠块是唯一「点击后在同一页内切换」的官方支持写法。
 */
const fs = require("fs");
const path = require("path");

const dir = path.resolve(process.argv[2] || ".");
const zhPath = path.join(dir, "README.md");
const enPath = path.join(dir, "README.en.md");
if (!fs.existsSync(zhPath) || !fs.existsSync(enPath)) { console.error("需要同目录下同时存在 README.md 与 README.en.md：", dir); process.exit(2); }

const zhLines = fs.readFileSync(zhPath, "utf8").split("\n");
const enLines = fs.readFileSync(enPath, "utf8").split("\n");
const find = (ls, re) => ls.findIndex((l) => re.test(l));

const title = zhLines[find(zhLines, /^#\s/)];
// 徽章：全部去重收集（保持首次出现顺序），统一放顶部
const seen = new Set(); const badges = [];
for (const l of zhLines.concat(enLines)) if (/img\.shields\.io\//.test(l)) { const t = l.trim(); if (!seen.has(t)) { seen.add(t); badges.push(t); } }

const body = (lines) => {
  const h1 = find(lines, /^#\s/);
  return lines.slice(h1 + 1)
    .filter((l) => !/简体中文-current|English-current|简体中文-switch|English-switch/.test(l))
    .filter((l) => !/img\.shields\.io\//.test(l))
    .join("\n").replace(/^\s+/, "").trim();
};

const out = [
  title, "",
  ...badges, "",
  "🌐 **双语 / Bilingual**：点击下方标题行原地展开对应语言（不跳转）· Click a summary below to expand that language in place.",
  "", "---", "",
  "<details open>", "<summary><b>🇨🇳 简体中文</b>（点击折叠）</summary>", "",
  body(zhLines), "",
  "</details>", "",
  "<details>", "<summary><b>🇬🇧 English</b> (click to expand)</summary>", "",
  body(enLines), "",
  "</details>", "",
].join("\n");

fs.writeFileSync(zhPath, out, "utf8");
fs.writeFileSync(enPath,
  "# English README has moved in-page\n\n" +
  "> 🌐 双语 README 已合并到单文件「页内切换」（不跳转）：\n" +
  "> The bilingual README is now one file with an in-page language switch.\n\n" +
  "**→ [Open README.md](README.md)**\n", "utf8");
console.log("✅ 已折叠:", zhPath, "| README.en.md 已改为指路页");
