/**
 * make-repo.js — 建仓 + topics + 推送（token 只从环境变量读，不落盘、不写入 .git/config）
 *
 * 用法：
 *   GH_TOKEN=<token> node make-repo.js --dir <本地仓库目录> --name <repo> \
 *       [--desc "<描述>"] [--topics a,b,c] [--private] [--owner <login>] [--allow-existing]
 *
 * 行为（顺序固定）：
 *   GET /user 验证 → POST /user/repos 建仓（422=已存在：无 --allow-existing 则停下）→
 *   PUT topics → 用一次性 token URL 推送（不写入 .git/config）→ fetch + 设 upstream →
 *   ls-remote 验证 → 检查 .git/config 无 token。
 *
 * 退出码：0 成功；2 参数/前置错误（含"仓库已存在需确认"）；1 其他失败。
 */
const https = require("https");
const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf("--" + k); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : true) : d; };
const DIR = path.resolve(String(arg("dir", ".")));
const NAME = arg("name");
const DESC = arg("desc", "");
const TOPICS = String(arg("topics", "")).split(",").map((s) => s.trim()).filter(Boolean);
const PRIVATE = !!arg("private", false);
const OWNER_ARG = arg("owner", null);
const ALLOW_EXISTING = !!arg("allow-existing", false);
const TOKEN = process.env.GH_TOKEN;
const GIT = arg("git", "D:/Git/Git/cmd/git.exe");

if (!NAME || NAME === true) { console.error("缺少 --name <repo>"); process.exit(2); }
if (!TOKEN) { console.error("缺少 GH_TOKEN 环境变量 —— 请先向用户索取 token 并只看本次使用（见 SKILL.md §S4）"); process.exit(2); }
if (!fs.existsSync(path.join(DIR, ".git"))) { console.error("目录不是 git 仓库（先 git init + commit）：", DIR); process.exit(2); }

function api(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      host: "api.github.com", path: apiPath, method,
      headers: Object.assign({
        "User-Agent": "github-repo-publisher", "Authorization": "token " + TOKEN,
        "Accept": "application/vnd.github+json", "Content-Type": "application/json",
      }, data ? { "Content-Length": Buffer.byteLength(data) } : {}),
    }, (r) => { let b = ""; r.on("data", (c) => (b += c)); r.on("end", () => resolve({ status: r.statusCode, body: b })); });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}
const git = (cmd, opts) => cp.execSync(`"${GIT}" -C "${DIR}" ${cmd}`, Object.assign({ encoding: "utf8", stdio: "pipe" }, opts || {}));

(async () => {
  const me = await api("GET", "/user");
  if (me.status !== 200) { console.error("token 无效或权限不足:", me.status, me.body.slice(0, 200)); process.exit(1); }
  const owner = OWNER_ARG && OWNER_ARG !== true ? OWNER_ARG : JSON.parse(me.body).login;
  console.log("✅ token 有效，owner:", owner);

  const mk = await api("POST", "/user/repos", {
    name: NAME, description: String(DESC === true ? "" : DESC), private: PRIVATE,
    has_issues: true, has_wiki: false, auto_init: false,
  });
  if (mk.status === 201) console.log("✅ 仓库已创建:", owner + "/" + NAME, PRIVATE ? "(private)" : "(public)");
  else if (mk.status === 422) {
    if (!ALLOW_EXISTING) { console.error("⚠ 仓库已存在:", owner + "/" + NAME, "—— 停下向用户确认是否推送增量，确认后加 --allow-existing 重跑"); process.exit(2); }
    console.log("ℹ 仓库已存在（用户已确认），继续推送增量");
  } else { console.error("建仓失败:", mk.status, mk.body.slice(0, 300)); process.exit(1); }

  if (TOPICS.length) {
    const tp = await api("PUT", `/repos/${owner}/${NAME}/topics`, { names: TOPICS });
    console.log(tp.status === 200 ? `✅ topics 已设置（${TOPICS.length} 个）` : "⚠ topics 设置返回 " + tp.status);
  }

  const branch = git("branch --show-current").trim() || "main";
  const pushUrl = `https://x-access-token:${TOKEN}@github.com/${owner}/${NAME}.git`;
  const out = cp.execSync(`"${GIT}" -C "${DIR}" push "${pushUrl}" ${branch}`, { encoding: "utf8", stdio: "pipe" });
  console.log("✅ 推送成功（" + branch + "）:", (out || "").trim().split("\n").slice(-1)[0] || "ok");

  try { git("fetch origin"); } catch (e) {}
  try { git(`branch -u origin/${branch} ${branch}`); console.log("✅ 已设置 upstream: origin/" + branch); } catch (e) {}
  const ls = cp.execSync(`"${GIT}" -C "${DIR}" ls-remote origin`, { encoding: "utf8" });
  console.log("✅ 远端验证:\n" + ls.trim().split("\n").slice(0, 3).join("\n"));

  const cfg = fs.readFileSync(path.join(DIR, ".git", "config"), "utf8");
  console.log(cfg.includes(TOKEN) ? "❌ 警告：token 泄漏进 .git/config！" : "✅ .git/config 干净（无 token）");
  console.log("\n下一步（S5）：① 验收仓库设置（description/topics/license）；② 删除含 token 的临时脚本；③ 提醒用户吊销/轮换 token。");
})().catch((e) => { console.error("失败:", String(e.message).slice(0, 400)); process.exit(1); });
