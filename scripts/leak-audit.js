/**
 * leak-audit.js — 发布前「数据隔离」审计（零依赖，Node ≥14）
 *
 * 用法：node leak-audit.js <项目目录>
 * 退出码：0 = 通过（无 BLOCK）；1 = 存在 BLOCK，禁止建仓/推送。
 *
 * 分级：
 *   BLOCK —— 真实密钥/密码/私钥、敏感后缀文件、超大文件：必须修掉。
 *   WARN  —— 个人路径/邮箱/内网地址：逐条人工判定；标「本机实测，按需替换」的环境文件可豁免。
 *   INFO  —— 缓存目录等在树内：确认已被 .gitignore 覆盖。
 */
const fs = require("fs");
const path = require("path");

const BLOCK = [
  [/ghp_[A-Za-z0-9]{36,}/, "GitHub classic PAT"],
  [/github_pat_[A-Za-z0-9_]{50,}/, "GitHub fine-grained PAT"],
  [/gho_[A-Za-z0-9]{36,}/, "GitHub OAuth token"],
  [/sk-[A-Za-z0-9]{32,}/, "OpenAI 风格密钥"],
  [/AKIA[0-9A-Z]{16}/, "AWS Access Key"],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, "Slack token"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "私钥文件内容"],
  [/(password|passwd|pwd)\s*[:=]\s*["'][^"']{6,}["']/i, "疑似硬编码密码"],
  [/(api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i, "疑似硬编码 API Key"],
];
const WARN = [
  [/C:\\Users\\([^\\/\s"']+)/, "Windows 个人路径"],
  [/\/(Users|home)\/([^\/\s"']+)/, "个人家目录路径"],
  [/[\w.+-]+@(?!users\.noreply\.github\.com)[\w-]+\.[A-Za-z.]{2,}/, "邮箱地址"],
  [/\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, "内网 IP（10.x）"],
  [/\b192\.168\.\d{1,3}\.\d{1,3}\b/, "内网 IP（192.168.x）"],
  [/\b1[3-9]\d{9}\b/, "疑似手机号"],
];
const BAD_EXT = /\.(env|pem|key|p12|pfx|jks|keystore)$/i;
const TEXT_EXT = /\.(md|txt|json|jsonl|js|ts|py|cjs|mjs|sh|ps1|bat|cmd|yml|yaml|toml|ini|cfg|conf|html|css|svg|xml|csv|tsv|log|gitignore)$/i;
const SKIP_DIR = /^(\.git|node_modules|__pycache__|dist|\.report-build)$/;
const EXEMPT_MARK = /本机实测|local-tested|按需替换/;
const LARGE = 5 * 1024 * 1024;

const root = path.resolve(process.argv[2] || ".");
if (!fs.existsSync(root)) { console.error("目录不存在:", root); process.exit(2); }

const findings = { BLOCK: [], WARN: [], INFO: [] };
function scan(file) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  const st = fs.statSync(file);
  if (st.size > LARGE) { findings.BLOCK.push([rel + ":0", "超大文件 " + (st.size / 1048576).toFixed(1) + "MB（>5MB）"]); return; }
  if (BAD_EXT.test(file)) { findings.BLOCK.push([rel + ":0", "敏感后缀文件"]); return; }
  if (!TEXT_EXT.test(file) && !/^[^.]+$/.test(path.basename(file))) return;
  if (st.size > 1024 * 1024) return;
  let lines;
  try { lines = fs.readFileSync(file, "utf8").split(/\r?\n/); } catch (e) { return; }
  lines.forEach((line, i) => {
    if (line.length > 500) line = line.slice(0, 500);
    for (const [re, name] of BLOCK) if (re.test(line)) findings.BLOCK.push([`${rel}:${i + 1}`, name + " → " + line.trim().slice(0, 90)]);
    for (const [re, name] of WARN) if (re.test(line)) {
      const hit = `${rel}:${i + 1} ${name} → ${line.trim().slice(0, 80)}`;
      if (EXEMPT_MARK.test(line)) findings.INFO.push([rel + ":" + (i + 1), name + "（已标「本机实测」豁免）"]);
      else findings.WARN.push([`${rel}:${i + 1}`, name + " → " + line.trim().slice(0, 80)]);
    }
  });
}
function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP_DIR.test(f.name)) continue;
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.isFile()) scan(p);
  }
}
walk(root);

// .gitignore 覆盖检查（缓存目录出现在树内则提示）
try {
  const gi = fs.existsSync(path.join(root, ".gitignore")) ? fs.readFileSync(path.join(root, ".gitignore"), "utf8") : "";
  for (const d of ["node_modules", "__pycache__", "chart-src", "charts"]) {
    const present = fs.existsSync(path.join(root, d));
    if (present && !gi.includes(d)) findings.INFO.push([d + "/", "目录在树内但 .gitignore 未覆盖"]);
  }
} catch (e) {}

const show = (label, arr) => {
  console.log(`\n${label}（${arr.length}）`);
  for (const [loc, msg] of arr.slice(0, 40)) console.log(`  ${loc}  ${msg}`);
  if (arr.length > 40) console.log(`  …还有 ${arr.length - 40} 条`);
};
console.log("=== 数据隔离审计 ===");
console.log("目录:", root);
show("❌ BLOCK", findings.BLOCK);
show("⚠️  WARN", findings.WARN);
show("ℹ️  INFO", findings.INFO);
console.log("\n结论:", findings.BLOCK.length ? "不通过 —— 存在 BLOCK 项，禁止建仓/推送" : "通过 —— 无 BLOCK（WARN 项请逐条人工判定）");
process.exit(findings.BLOCK.length ? 1 : 0);
