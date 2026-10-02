<#
.SYNOPSIS
  Cai dat moi truong de chay project, tu chon phien ban Node phu hop.

.DESCRIPTION
  Script doc .nvmrc de biet phien ban Node mong muon, kiem tra Node dang co
  tren may co dung khong, va chi tai ve khi thieu hoac qua ban.

  Thu tu:
    1. Doc .nvmrc (neu mat thi dung ban toi thieu cua Next)
    2. Kiem tra node -v
       - dat yeu cau  -> bo qua buoc cai
       - thieu / qua ban -> tai zip tu nodejs.org
    3. Cai dependencies
    4. Kiem tra .env.local, bao loi neu thieu bien
    5. npm run build de xac nhan project bien dich duoc

  Cai dat bang zip (khong phai MSI) vi MSI can quyen Administrator va UAC.
  Ban zip giai nen vao thu muc nguoi dung roi them vao PATH cap nguoi dung,
  khong can quyen gi. Script khong dung winget: winget chi cai duoc ban LTS
  moi nhat, khong ton trong duoc phien ban ghi trong .nvmrc.

  PowerShell 5.1 khong co ??, -AsHashtable, hay pwsh. Script chay duoc tren
  Windows 10/11 mac dinh. Dung npm.cmd vi PowerShell chay nhanh file .ps1
  cua npm va bi execution policy chan.

.PARAMETER ForceNode
  Cai lai Node du co ban dat dung phien ban. Mac dinh bo qua.

.PARAMETER SkipInstall
  Bo qua npm install, chi kiem tra moi truong. Dung khi debug script.

.PARAMETER SkipBuild
  Bo qua npm run build o buoc xac nhan. Dung khi debug script.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\setup.ps1

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\setup.ps1 -ForceNode
#>
[CmdletBinding()]
param(
    [switch]$ForceNode,
    [switch]$SkipInstall,
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
# Tat progress bar de log cua npm de doc
$env:npm_config_progress = 'false'

# ---------------------------------------------------------------------------
# Ham tien ich
# ---------------------------------------------------------------------------

function Write-Step {
    param([string]$Message)
    Write-Host ''
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "    OK  $Message" -ForegroundColor Green
}

function Write-Note {
    param([string]$Message)
    Write-Host "    --  $Message" -ForegroundColor Yellow
}

function Write-Fail {
    param([string]$Message)
    Write-Host "    XX  $Message" -ForegroundColor Red
}

# Chuyen "v24.21.0" thanh [Version] de so sanh duoc. So sanh chuoi co loi:
# "v9" > "v10" vi '9' lon hon '1', nen phai doi sang so thuc.
# Luu y: [Version]::(...) KHONG phai la ep kieu no rat im lang $null.
# Phai dung [Version](...).
function ConvertTo-Version {
    param([string]$Value)
    if (-not $Value) { return $null }
    $clean = ($Value -replace '^[^\d\.]', '').Trim()
    if (-not $clean) { return $null }
    $parts = @($clean.Split('.'))
    while ($parts.Count -lt 3) { $parts += '0' }
    try {
        return [Version](($parts[0..2]) -join '.')
    } catch {
        return $null
    }
}

function Get-NodeVersion {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return $null }
    try {
        $raw = (& node -v 2>$null)
    } catch {
        return $null
    }
    if (-not $raw) { return $null }
    return ConvertTo-Version $raw
}

# Chay lenh native va in ra, tra ve $LASTEXITCODE.
#
# Ly do can ham rieng: PowerShell 5.1 doi stderr cua lenh native thanh ErrorRecord
# khi gop 2>&1 vao pipeline. Neu ErrorActionPreference = 'Stop', mot dong canh
# bao tren stderr se lam script dung lai, ke ca khi lenh chay thanh cong -
# npm ci in "npm warn ..." ra stderr roi bi bao "NativeCommandError" va exit 1
# du da cai xong phan dependencies.
function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [string[]]$Arguments = @()
    )
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $Command @Arguments 2>&1 | ForEach-Object { Write-Host "    $_" }
        return $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $prev
    }
}

# ---------------------------------------------------------------------------
# 1. Doc phien ban mong muon
# ---------------------------------------------------------------------------

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Next 16.3.3 khai bao node >=20.9.0 (doc tu node_modules/next/package.json).
# Neu .nvmrc mat thi van phai co san toi thieu de build duoc, nen dung ban
# cao nhat thay vi tu do la.
$minimum = [Version]'20.9.0'
$wanted = $null
$source = ''

$nvmrc = Join-Path $root '.nvmrc'
if (Test-Path $nvmrc) {
    $wanted = ConvertTo-Version (Get-Content $nvmrc -Raw)
    if ($wanted) { $source = '.nvmrc' }
}

if (-not $wanted) {
    $wanted = $minimum
    $source = 'mac dinh (Next 16 can >= 20.9.0)'
}

Write-Step "Muc tieu Node $wanted (tu $source)"

# ---------------------------------------------------------------------------
# 2. Kiem tra Node hien tai
# ---------------------------------------------------------------------------

$current = Get-NodeVersion
$needInstall = $true

if ($current) {
    if ($current -lt $minimum) {
        Write-Note "Node $current qua bau (can >= $minimum)"
    } elseif ($current -eq $wanted) {
        Write-Ok "Node $current - dung chinh xac phien ban mong muon"
        $needInstall = $false
    } elseif ($current -gt $wanted) {
        Write-Ok "Node $current - dat yeu cau, khac ban $wanted trong .nvmrc"
        $needInstall = $false
    } else {
        Write-Ok "Node $current - dat yeu cau (>= $minimum)"
        $needInstall = $false
    }
} else {
    Write-Note 'Khong tim thay Node tren may'
}

if ($ForceNode) {
    Write-Note 'co -ForceNode, cai lai dung ban trong .nvmrc'
    $needInstall = $true
}

# ---------------------------------------------------------------------------
# 3. Cai Node neu can
# ---------------------------------------------------------------------------

if ($needInstall) {
    Write-Step "Cai Node $wanted"

    $version = $wanted.ToString()
    $url = "https://nodejs.org/dist/v$version/node-v$version-win-x64.zip"
    $dest = Join-Path $env:LOCALAPPDATA 'Programs\nodejs'
    $zip = Join-Path $env:TEMP "node-v$version-win-x64.zip"
    $tmp = Join-Path $env:TEMP "node-extract-$version"

    try {
        Write-Host "    tai $url"
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -TimeoutSec 600
        Write-Ok ("tai xong {0} MB" -f [math]::Round((Get-Item $zip).Length / 1MB, 1))

        if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
        Expand-Archive -Path $zip -DestinationPath $tmp -Force

        # Zip giai ra mot thu muc con (node-vX-win-x64), noi dung nam trong do.
        # Move noi dung ra $dest de $dest\node.exe la dung duong dan.
        $inner = Get-ChildItem $tmp -Directory | Select-Object -First 1
        if (-not $inner) { throw 'zip khong co thu muc con nao' }

        if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
        New-Item -ItemType Directory -Path $dest -Force | Out-Null
        Get-ChildItem $inner.FullName -Force | Move-Item -Destination $dest -Force

        Remove-Item $tmp -Recurse -Force
        Remove-Item $zip -Force
        Write-Ok "giai nen vao $dest"

        # PATH cap nguoi dung, khong can admin
        $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
        $entries = @($userPath -split ';' | Where-Object { $_ -and $_.Trim() })
        if ($entries -notcontains $dest) {
            [Environment]::SetEnvironmentVariable(
                'Path', (($entries + $dest) -join ';'), 'User')
            Write-Ok 'them vao PATH cap nguoi dung (cho lan sau)'
        }

        # Moi terminal moi doc duoc PATH moi, nen them cho tiet trinh hien tai
        $env:Path = "$dest;$env:Path"

        $after = Get-NodeVersion
        if (-not $after) {
            Write-Fail 'cai xong nhung goi lenh node van khong chay duoc'
            Write-Host '       dong moi terminal roi chay lai script nay' -ForegroundColor White
            exit 1
        }
        if ($after -ne $wanted) {
            Write-Note "node -v bao $after, khac $wanted mong doi"
        } else {
            Write-Ok "Node $after san sang"
        }
    } catch {
        Write-Fail "khong cai duoc Node: $($_.Exception.Message)"
        Write-Host "       neu la loi 404, .nvmrc dang tro toi ban khong ton tai:" -ForegroundColor White
        Write-Host '       https://nodejs.org/dist/' -ForegroundColor White
        exit 1
    }
}

Write-Host ''
Write-Host "    node $((& node -v 2>$null))   npm $((& npm.cmd -v 2>$null))" -ForegroundColor White

# ---------------------------------------------------------------------------
# 4. Cai dependencies
# ---------------------------------------------------------------------------

if ($SkipInstall) {
    Write-Note 'bo qua npm install (co -SkipInstall)'
} else {
    Write-Step 'Cai dependencies'
    Push-Location $root
    try {
        # npm ci dung dung package-lock.json, tai chinh xac phien ban da dung
        # truoc day. Fail neu lock lech package.json, khi do thu npm install.
        $code = Invoke-Native 'npm.cmd' @('ci', '--no-audit', '--no-fund')
        if ($code -ne 0) {
            Write-Note "npm ci xong voi ma loi $code, thu npm install"
            $code = Invoke-Native 'npm.cmd' @('install', '--no-audit', '--no-fund')
            if ($code -ne 0) {
                Write-Fail "cai dependencies that bai (ma loi $code)"
                exit 1
            }
        }
        Write-Ok 'dependencies da cai'
    } finally {
        Pop-Location
    }
}

# ---------------------------------------------------------------------------
# 5. Kiem tra bien moi truong
# ---------------------------------------------------------------------------

Write-Step 'Kiem tra bien moi truong'

$envFile = Join-Path $root '.env.local'
$required = @('ADMIN_PASSWORD', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN')

# Ba bien nay chi duoc dung luc chay (route handler, trang dang nhap admin),
# khong can luc build. Thieu chung thi `next build` van xanh, nhung
# `npm run dev` se bao loi khi trang goi /api/revolt hoac /api/admin/login.
$missing = @()
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    $missing = @($required | Where-Object { $content -notmatch "(?m)^\s*$_\s*=\s*\S" })
}

if ($missing.Count -eq 0) {
    Write-Ok '.env.local co du bien can thiet'
} else {
    if (-not (Test-Path $envFile)) {
        Write-Note 'thieu file .env.local'
    } else {
        Write-Note ".env.local thieu bien: $($missing -join ', ')"
    }
    Write-Host ''
    Write-Host '    Bien nay chi can cho `npm run dev`. Build van chay duoc, deploy len' -ForegroundColor White
    Write-Host '    Vercel cung cap san qua Project > Settings > Environment Variables.' -ForegroundColor White
    Write-Host ''
    Write-Host '    Neu muon chay local, them vao .env.local trong thu muc nay:' -ForegroundColor White
    Write-Host ''
    Write-Host '      ADMIN_PASSWORD=<mat khau admin cua ban>'
    Write-Host '      UPSTASH_REDIS_REST_URL=<copy tu Vercel>'
    Write-Host '      UPSTASH_REDIS_REST_TOKEN=<copy tu Vercel>'
    Write-Host ''
    Write-Host '    .env.local da nam trong .gitignore nen khong bi push len GitHub.' -ForegroundColor White
}

# ---------------------------------------------------------------------------
# 6. Build de xac nhan
# ---------------------------------------------------------------------------

if ($SkipBuild) {
    Write-Note 'bo qua npm run build (co -SkipBuild)'
} else {
    Write-Step 'Bien dich de xac nhan'
    Push-Location $root
    try {
        $code = Invoke-Native 'npm.cmd' @('run', 'build')
        if ($code -ne 0) {
            Write-Fail "build that bai (ma loi $code) - xem loi ben tren"
            exit 1
        }
    } finally {
        Pop-Location
    }
}

# ---------------------------------------------------------------------------
# 7. Xong
# ---------------------------------------------------------------------------

Write-Host ''
Write-Host '============================================================' -ForegroundColor Green
Write-Host ' SAN SU DE CHAY' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
Write-Host '  npm run dev     -> http://localhost:3000'
Write-Host '  npm run build   -> bien dich production'
Write-Host ''
Write-Host '  Deploy len production: git add -A; git commit -m "..."; git push'
Write-Host '  Vercel tu build tu dong. Xem trang thai: vercel.cmd ls class-reunion'
Write-Host ''