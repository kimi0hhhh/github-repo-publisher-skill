# GitHub Repo Publisher Skill 安装脚本（Windows PowerShell）
# 用法：.\install.ps1
$ErrorActionPreference = "Stop"
$src = Split-Path -Parent $MyInvocation.MyCommand.Path
$targets = @(
  (Join-Path $env:USERPROFILE ".agents\skills\github-repo-publisher"),
  (Join-Path $env:USERPROFILE ".zcode\skills\github-repo-publisher")
)
foreach ($d in $targets) {
  Write-Host "[install] -> $d"
  New-Item -ItemType Directory -Force -Path $d | Out-Null
  Copy-Item (Join-Path $src "SKILL.md") $d -Force
  Copy-Item (Join-Path $src "references") $d -Recurse -Force
  Copy-Item (Join-Path $src "scripts") $d -Recurse -Force
}
Write-Host "[done] 安装完成。重启（或新开）会话后说「把这个发到 GitHub / 建个仓库开源」即可唤醒。"
Write-Host "       依赖：Node >=14（三个脚本零依赖）；git 可用即可。"
