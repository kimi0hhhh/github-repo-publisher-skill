/**
 * make-assets.js — 仓库门面素材生成器（模板；同时用于生成本仓库自己的素材）
 *
 * 产出（双语）：docs/assets/pipeline.{zh,en}.png（流程/架构图）
 *              docs/assets/demo.{zh,en}.gif （点击演示动图，7 帧）
 *
 * 管线：HTML 卡片 → 无头 Chrome 截图（图 1.5x / GIF 帧 1.0x）→ PIL 合成 GIF
 * 用法：node make-assets.js <仓库根目录>       # 输出到 <仓库根>/docs/assets
 *      GIF 合成：见文件末尾提示的 python 命令（PIL）
 *
 * 定制：改下面 T{} 里两个语言的文案与 stages 即可，版式不用动。
 */
const fs = require("fs");
const cp = require("child_process");
const path = require("path");

const REPO = path.resolve(process.argv[2] || ".");
const OUT = path.join(REPO, "docs", "assets");
const SRC = path.join(REPO, ".asset-src");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"; // 本机实测，按需替换
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SRC, { recursive: true });

const C = {
  ink: "#1B333E", sub: "#8FA09E", green: "#2F7D4F", greenBg: "#EAF4EE", greenBd: "#BBDCC8",
  amber: "#C79A3E", amberBg: "#FBF6EA", red: "#B04545", grayBd: "#E3EAE8", light: "#F7FAF9", line: "#E9EFEE",
};
const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Microsoft YaHei","PingFang SC",sans-serif;color:${C.ink};background:#fff;position:relative}
.t{font-size:26px;font-weight:700}.s{font-size:14px;color:${C.sub};margin-top:8px}
.flow{display:flex;align-items:stretch;margin-top:26px}
.box{flex:1;border:1.6px solid ${C.grayBd};border-radius:6px;padding:14px 12px;background:#fff;text-align:center}
.box .id{font-size:12px;font-weight:700;color:${C.green};letter-spacing:.06em}
.box .nm{font-size:16px;font-weight:700;margin-top:6px}
.box .who{font-size:11.5px;color:${C.sub};margin-top:8px;line-height:1.6}
.gate{display:inline-block;margin-top:8px;font-size:10.5px;font-weight:700;color:#fff;background:${C.red};border-radius:99px;padding:2px 9px}
.gate.amber{background:${C.amber}}
.arrow{width:30px;display:flex;align-items:center;justify-content:center;color:#B9C6C4;font-size:19px}
.note{margin-top:18px;font-size:12.5px;color:${C.sub}}
.stage{flex:1;border:1.6px solid ${C.grayBd};border-radius:6px;padding:12px 10px;background:#fff;text-align:center;opacity:.45}
.stage.on{opacity:1;border-color:${C.green};background:${C.greenBg}}
.stage.done{opacity:1;border-color:${C.greenBd};background:#FBFDFC}
.stage .sid{font-size:11.5px;font-weight:700;color:${C.green}}
.stage .snm{font-size:14.5px;font-weight:700;margin-top:5px}
.stage .sdt{font-size:11px;color:${C.sub};margin-top:7px;line-height:1.6}
.bubble{display:inline-block;background:${C.ink};color:#fff;border-radius:12px 12px 12px 3px;padding:12px 18px;font-size:16px}
.out{margin-top:18px;border-top:1px solid ${C.line};padding-top:14px;font-size:12.5px;color:#4A5A58;line-height:1.9;min-height:66px}
.kpi{display:flex;gap:10px;margin-top:14px}
.kpi>div{flex:1;border:1px solid ${C.line};border-radius:6px;padding:9px 10px;background:${C.light}}
.kpi b{display:block;font-size:14.5px;margin-top:3px}.kpi i{font-style:normal;font-size:11px;color:${C.sub}}
`;
const page = (h, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
<body style="width:1120px;height:${h}px;padding:28px 34px">${body}</body></html>`;

// ── 本仓库的双语文案（换仓库时只改这里）───────────────
const T = {
  zh: {
    title: "五段流水线 · GitHub 仓库发布",
    sub: "备料 → 数据隔离审计 → 本地 git → 建仓与推送 → 验收与卫生",
    boxes: [
      ["S1", "备料", "README 规格 · 双语页内切换<br>图片与动图（zh/en 各一套）"],
      ["S2", "数据隔离审计", "密钥 / 隐私 / 路径 / 大文件<br>退出码 1 = 有 BLOCK", "BLOCK 零容忍"],
      ["S3", "本地 git", "init → .gitignore 先行<br>→ commit → 分支 main"],
      ["S4", "建仓与推送", "先探测凭据，没有就询问<br>token 只走环境变量", "token 即问即用"],
      ["S5", "验收与卫生", "远端可见 · .git/config 无 token<br>提醒吊销 · 删除临时脚本"],
    ],
    note: "铁律：先审计后发布 · token 不落盘 · 远端已存在即停确认 · 禁止 --force",
    demoTitle: "Demo · 一次真实发布",
    bubble: "把这个项目发到 GitHub 开源",
    stages: [
      ["S1", "备料", "README + 双语素材"],
      ["S2", "审计", "leak-audit 扫描"],
      ["S3", "本地 git", "commit + main"],
      ["S4", "建仓", "询问 token → 建仓"],
      ["S5", "验收", "远端可见 + 卫生"],
    ],
    outLines: [
      "① 用户触发发布流程……",
      "② 备料完成：README（双语页内切换）+ 图片/动图 zh/en 各一套",
      "③ 数据隔离审计：0 BLOCK / 0 WARN —— 放行进下一步",
      "④ 本地 git：init → commit 6c6ca36 → 分支 main",
      "⑤ 建仓：询问用户 token（一次性使用）→ 创建 public 仓库 + 10 个 topics",
      "⑥ 推送完成：远端可见 · .git/config 干净（无 token）· 临时脚本已清理",
      "✅ 完成 —— 仓库 URL 已交付，并提醒吊销 token",
    ],
    kpis: [["审计", "0 BLOCK / 0 WARN"], ["推送", "main @ 6c6ca36"], ["可见性", "public + 10 topics"], ["卫生", ".git/config 无 token"]],
  },
  en: {
    title: "Five-Stage Pipeline · GitHub Repo Publishing",
    sub: "Prepare → Data-isolation audit → Local git → Create & push → Verify & hygiene",
    boxes: [
      ["S1", "Prepare", "README spec · in-page bilingual<br>images & demo GIF (zh/en each)"],
      ["S2", "Leak Audit", "secrets / privacy / paths / large files<br>exit 1 = BLOCK", "zero-tolerance"],
      ["S3", "Local git", "init → .gitignore first<br>→ commit → branch main"],
      ["S4", "Create & Push", "probe creds, else ask the user<br>token via env var only", "ask-for-token"],
      ["S5", "Verify & Hygiene", "remote visible · no token in config<br>remind revoke · delete temp scripts"],
    ],
    note: "Iron rules: audit before publish · token never on disk · stop if remote exists · never --force",
    demoTitle: "Demo · A Real Publishing Run",
    bubble: "Publish this project to GitHub as open source",
    stages: [
      ["S1", "Prepare", "README + bilingual assets"],
      ["S2", "Audit", "leak-audit scan"],
      ["S3", "Local git", "commit + main"],
      ["S4", "Create", "ask token → create repo"],
      ["S5", "Verify", "remote visible + hygiene"],
    ],
    outLines: [
      "1. User triggers the publishing pipeline…",
      "2. Prepared: README (in-page bilingual) + images & GIF in zh/en",
      "3. Leak audit: 0 BLOCK / 0 WARN — cleared to proceed",
      "4. Local git: init → commit 6c6ca36 → branch main",
      "5. Create: asked user for a one-shot token → public repo + 10 topics",
      "6. Pushed: remote visible · .git/config clean (no token) · temp scripts removed",
      "Done — repo URL delivered, token revocation reminder sent",
    ],
    kpis: [["Audit", "0 BLOCK / 0 WARN"], ["Push", "main @ 6c6ca36"], ["Visibility", "public + 10 topics"], ["Hygiene", "no token in config"]],
  },
};

function pipeline(lang) {
  const L = T[lang];
  const boxes = L.boxes.map(([id, nm, who, gate]) =>
    `<div class="box"><div class="id">${id}</div><div class="nm">${nm}</div><div class="who">${who}</div>${gate ? `<div class="gate ${id === "S4" ? "amber" : ""}">${gate}</div>` : ""}</div>`
  ).join(`<div class="arrow">→</div>`);
  return page(370, `<div class="t">${L.title}</div><div class="s">${L.sub}</div><div class="flow">${boxes}</div><div class="note">${L.note}</div>`);
}
function demoFrame(lang, step) {
  const L = T[lang];
  const stages = L.stages.map(([id, nm, dt], i) =>
    `<div class="stage ${i < step ? "done" : i === step ? "on" : ""}"><div class="sid">${id}</div><div class="snm">${nm}</div><div class="sdt">${dt}</div></div>`
  ).join("");
  const kpi = step >= 6 ? `<div class="kpi">${L.kpis.map(([k, v]) => `<div><i>${k}</i><b>${v}</b></div>`).join("")}</div>` : "";
  return page(600, `<div class="t" style="font-size:20px">${L.demoTitle}</div>
<div style="margin-top:14px"><span class="bubble">${L.bubble}</span>${step === 0 ? `<span style="display:inline-block;width:9px;height:20px;background:${C.green};margin-left:6px;vertical-align:-3px"></span>` : ""}</div>
<div class="flow" style="margin-top:18px">${stages}</div>
<div class="out">${L.outLines.slice(0, step + 1).join("<br>")}</div>${kpi}`);
}
function shot(name, html, h, scale) {
  fs.writeFileSync(`${SRC}/${name}.html`, html);
  const png = `${SRC}/${name}.png`;
  cp.execSync(`"${CHROME}" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=${scale} --screenshot="${png}" --window-size=1120,${h} "file:///${SRC.replace(/\\/g, "/")}/${name}.html"`, { stdio: "pipe", timeout: 60000 });
  return png;
}
for (const lang of ["zh", "en"]) {
  fs.copyFileSync(shot(`pipeline-${lang}`, pipeline(lang), 370, 1.5), `${OUT}/pipeline.${lang}.png`);
  console.log("✅ pipeline." + lang + ".png", (fs.statSync(`${OUT}/pipeline.${lang}.png`).size / 1024).toFixed(0) + "KB");
  for (let s = 0; s <= 6; s++) shot(`demo-${lang}-${s}`, demoFrame(lang, s), 600, 1.0);
  console.log("✅ demo." + lang + " 帧 0-6 已出（GIF 合成见下）");
}
console.log(`
下一步（PIL 合成 GIF，python 绝对路径示例）：
python -c "
from PIL import Image
SRC=r'${SRC}'; OUT=r'${OUT}'
for lang in ['zh','en']:
    fr=[Image.open(f'{SRC}/demo-{lang}-{s}.png').convert('RGB') for s in range(7)]
    pal=fr[0].quantize(colors=128)
    qs=[f.quantize(palette=pal) for f in fr]
    qs[0].save(f'{OUT}/demo.{lang}.gif',save_all=True,append_images=qs[1:],duration=[1200,1200,1400,1200,1200,1200,2200],loop=0,optimize=True)
    print('demo.%s.gif done'%lang)
"`);
