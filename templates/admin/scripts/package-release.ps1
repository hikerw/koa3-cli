param(
  [string]$ReleaseName = "",
  [switch]$SkipInstall,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

# 从脚本所在目录反推项目根目录，确保在任意 cwd 下执行都能找到正确文件。
$ScriptDir = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($ScriptDir)) {
  $ScriptDir = (Split-Path -Parent $MyInvocation.MyCommand.Path)
}
$script:RootDir = (Resolve-Path (Join-Path $ScriptDir "..")).Path
$script:TempRoot = [System.IO.Path]::Combine($script:RootDir, "release-temp")
$script:OutputRoot = [System.IO.Path]::Combine($script:RootDir, "release-dist")

if ([string]::IsNullOrWhiteSpace($ReleaseName)) {
  $ReleaseName = "koa3-cli-release-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
}
$script:ReleaseName = $ReleaseName

$script:ReleaseDir = [System.IO.Path]::Combine($script:TempRoot, $script:ReleaseName)
$script:ZipPath = [System.IO.Path]::Combine($script:OutputRoot, "$($script:ReleaseName).zip")

function Remove-IfExists {
  param([string]$Path)
  if (Test-Path -LiteralPath $Path) {
    Remove-Item -LiteralPath $Path -Recurse -Force
  }
}

function Copy-Directory {
  param(
    [string]$Source,
    [string]$Destination
  )
  if (!(Test-Path -LiteralPath $Source)) {
    throw "Missing directory: $Source"
  }
  Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
}

function Copy-FileIfExists {
  param(
    [string]$Source,
    [string]$Destination
  )
  if (Test-Path -LiteralPath $Source) {
    Copy-Item -LiteralPath $Source -Destination $Destination -Force
  }
}

Write-Host "==> Packaging release: $script:ReleaseName"
New-Item -ItemType Directory -Force -Path $script:TempRoot, $script:OutputRoot | Out-Null
Remove-IfExists $script:ReleaseDir
New-Item -ItemType Directory -Force -Path $script:ReleaseDir | Out-Null

if (!$SkipInstall) {
  Write-Host "==> Installing client dependencies"
  npm --prefix (Join-Path $script:RootDir "client") install
}

if (!$SkipBuild) {
  Write-Host "==> Building client"
  npm --prefix (Join-Path $script:RootDir "client") run build
}

Write-Host "==> Copying server runtime files"
Copy-Directory (Join-Path $script:RootDir "app") (Join-Path $script:ReleaseDir "app")
Copy-Directory (Join-Path $script:RootDir "config") (Join-Path $script:ReleaseDir "config")
Copy-Directory (Join-Path $script:RootDir "public") (Join-Path $script:ReleaseDir "public")
Copy-FileIfExists (Join-Path $script:RootDir "app.js") (Join-Path $script:ReleaseDir "app.js")
Copy-FileIfExists (Join-Path $script:RootDir "package.json") (Join-Path $script:ReleaseDir "package.json")
Copy-FileIfExists (Join-Path $script:RootDir "package-lock.json") (Join-Path $script:ReleaseDir "package-lock.json")
Copy-FileIfExists (Join-Path $script:RootDir "README.md") (Join-Path $script:ReleaseDir "README.md")
Copy-FileIfExists (Join-Path $script:RootDir "LICENSE") (Join-Path $script:ReleaseDir "LICENSE")
Copy-FileIfExists (Join-Path $script:RootDir "env.example") (Join-Path $script:ReleaseDir "env.example")

Write-Host "==> Copying client dist"
New-Item -ItemType Directory -Force -Path (Join-Path $script:ReleaseDir "client") | Out-Null
Copy-Directory (Join-Path $script:RootDir "client\dist") (Join-Path $script:ReleaseDir "client\dist")

# 运行时数据、私有配置和本机缓存不进入发布包，部署时应放到服务器共享目录或用环境变量维护。
$ExcludePaths = @("node_modules", ".cursor", ".github", ".vscode", ".env", "config\config.local.js", "public\uploads", "logs", "release-temp", "release-dist", "client\node_modules")

foreach ($RelativePath in $ExcludePaths) {
  Remove-IfExists (Join-Path $script:ReleaseDir $RelativePath)
}
Remove-IfExists (Join-Path $script:ReleaseDir "public\uploads")

$Commit = "unknown"
try {
  $Commit = (git -C $script:RootDir rev-parse --short HEAD).Trim()
} catch {
  $Commit = "unknown"
}

$ReleaseInfo = @(
  "release: $($script:ReleaseName)",
  "time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
  "commit: $Commit",
  "",
  "Notes:",
  "1. Run npm ci --omit=dev in the release root on the server.",
  "2. Keep uploads, .env and config.local.js in shared storage, then symlink or copy them into current.",
  "3. This package excludes node_modules, .env, config.local.js, uploads and logs.",
  "4. The admin client build output is in client/dist."
)
$ReleaseInfo | Out-File -LiteralPath (Join-Path $script:ReleaseDir "RELEASE_INFO.txt") -Encoding utf8

Write-Host "==> Creating zip"
Remove-IfExists $script:ZipPath
Compress-Archive -Path (Join-Path $script:ReleaseDir "*") -DestinationPath $script:ZipPath -Force

Write-Host "==> Release package created: $script:ZipPath"
