# 打包 Zotero 插件为 XPI
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$dist = Join-Path $root 'dist'
New-Item -ItemType Directory -Path $dist -Force | Out-Null

$out = Join-Path $dist 'snapshot2pdf.xpi'
$zip = Join-Path $dist 'snapshot2pdf.zip'
Remove-Item $out, $zip -Force -ErrorAction SilentlyContinue

Compress-Archive -Path (Join-Path $root 'manifest.json'), (Join-Path $root 'bootstrap.js') -DestinationPath $zip -Force
Move-Item $zip $out -Force

$hash = (Get-FileHash $out -Algorithm SHA256).Hash.ToLower()
Write-Host "built: $out"
Write-Host "sha256: $hash"
Write-Host ""
Write-Host "把下面这段填进 update.json 的 update_hash："
Write-Host "sha256:$hash"
