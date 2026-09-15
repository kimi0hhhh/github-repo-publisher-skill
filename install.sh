#!/usr/bin/env bash
# GitHub Repo Publisher Skill 安装脚本
# 用法：bash install.sh
# 装到用户级 skill 目录（两处都装，兼容不同宿主发现规则）：
#   ~/.agents/skills/github-repo-publisher/
#   ~/.zcode/skills/github-repo-publisher/
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
TARGETS=("${HOME}/.agents/skills/github-repo-publisher" "${HOME}/.zcode/skills/github-repo-publisher")

for D in "${TARGETS[@]}"; do
  echo "[install] -> ${D}"
  mkdir -p "${D}"
  cp "${SRC}/SKILL.md" "${D}/SKILL.md"
  cp -r "${SRC}/references" "${D}/references"
  cp -r "${SRC}/scripts" "${D}/scripts"
done

echo "[done] 安装完成。重启（或新开）会话后说「把这个发到 GitHub / 建个仓库开源」即可唤醒。"
echo "       依赖：Node >=14（三个脚本零依赖）；git 可用即可。"
