<#
.SYNOPSIS
    Compila e instala rnote-cli en Windows (RNote no lo incluye en su instalador).

.DESCRIPTION
    Instala MSYS2 + UCRT64 (GTK4, Rust) la primera vez, compila el tag indicado de
    flxzt/rnote y deja rnote-cli.exe donde el plugin lo espera
    (C:\Program Files\RNote\bin) o en una carpeta portable.

.PARAMETER RnoteTag
    Tag de RNote a compilar. Debe coincidir con la version de tu GUI. Por defecto v0.14.2.

.PARAMETER InstallDir
    Carpeta destino del binario (solo en modo normal). Por defecto C:\Program Files\RNote\bin.

.PARAMETER BuildDir
    Carpeta de trabajo para el codigo y el build. Por defecto C:\rnote-build.

.PARAMETER Portable
    No toca Program Files. Instala en %LOCALAPPDATA%\rnote-cli con un envoltorio .cmd
    que apunta a las DLL de MSYS2. Pensado para cuando no hay permisos de administrador.

.PARAMETER SkipDeps
    No instala/actualiza paquetes de MSYS2 (asume que ya estan).

.PARAMETER SkipBuild
    No compila; usa el binario que ya exista en <BuildDir>\src\target\release.

.EXAMPLE
    .\install-rnote-cli-windows.ps1

.EXAMPLE
    .\install-rnote-cli-windows.ps1 -RnoteTag v0.15.0 -BuildDir D:\build

.EXAMPLE
    .\install-rnote-cli-windows.ps1 -Portable

.NOTES
    Tiempo tipico en un equipo moderno: 30-40 min (compilacion de Rust).
    Descarga ~3 GB la primera vez. Requiere Windows 10/11 x86_64.
#>
[CmdletBinding()]
param(
    [string]$RnoteTag = 'v0.14.2',
    [string]$InstallDir = 'C:\Program Files\RNote\bin',
    [string]$BuildDir = 'C:\rnote-build',
    [switch]$Portable,
    [switch]$SkipDeps,
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

function Write-Step($message) { Write-Host "`n==> $message" -ForegroundColor Cyan }
function Write-Ok($message) { Write-Host "    $message" -ForegroundColor Green }
function Write-Warn2($message) { Write-Host "    $message" -ForegroundColor Yellow }

function Test-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    (New-Object Security.Principal.WindowsPrincipal $identity).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
}

function ConvertTo-UnixPath([string]$path) {
    $normalized = $path -replace '\\', '/'
    if ($normalized -match '^([A-Za-z]):/(.*)$') {
        return '/' + $matches[1].ToLower() + '/' + $matches[2]
    }
    return $normalized
}

# ---------------------------------------------------------------- comprobaciones
if (-not [Environment]::Is64BitOperatingSystem) { throw 'Se requiere un sistema x86_64.' }

$msys = 'C:\msys64'
$bash = Join-Path $msys 'usr\bin\bash.exe'
$sourceDir = Join-Path $BuildDir 'src'
$exe = Join-Path $sourceDir 'target\release\rnote-cli.exe'

if (-not $Portable -and -not (Test-Admin)) {
    throw "Se necesitan permisos de administrador para escribir en '$InstallDir'. Abre PowerShell como administrador o usa -Portable."
}

# ---------------------------------------------------------------- MSYS2
Write-Step 'Comprobando MSYS2'
if (-not (Test-Path $bash)) {
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) {
        throw 'No se encontro MSYS2 ni winget. Instala MSYS2 desde https://www.msys2.org/ y vuelve a ejecutar.'
    }
    Write-Warn2 'MSYS2 no esta instalado; instalando con winget (puede tardar unos minutos)...'
    winget install -e --id MSYS2.MSYS2 --accept-package-agreements --accept-source-agreements --disable-interactivity | Out-Host
    if (-not (Test-Path $bash)) { throw "MSYS2 no quedo en $msys. Revisa la instalacion." }
}
Write-Ok "MSYS2: $msys"

# ---------------------------------------------------------------- dependencias
if (-not $SkipDeps) {
    Write-Step 'Actualizando la base de MSYS2 (dos pasadas)'
    & $bash -lc 'pacman --noconfirm -Syu' | Out-Host
    & $bash -lc 'pacman --noconfirm -Syu' | Out-Host

    Write-Step 'Instalando toolchain GTK4 + Rust (UCRT64)'
    $packages = @(
        'mingw-w64-ucrt-x86_64-rust'
        'mingw-w64-ucrt-x86_64-gcc'
        'mingw-w64-ucrt-x86_64-pkgconf'
        'mingw-w64-ucrt-x86_64-gtk4'
        'mingw-w64-ucrt-x86_64-libadwaita'
        'mingw-w64-ucrt-x86_64-cmake'
        'mingw-w64-ucrt-x86_64-make'
        'mingw-w64-ucrt-x86_64-python'
    ) -join ' '
    & $bash -lc "pacman --noconfirm --needed -S $packages" | Out-Host
}

# ---------------------------------------------------------------- codigo fuente
Write-Step "Obteniendo RNote $RnoteTag"
if (Test-Path (Join-Path $sourceDir '.git')) {
    Write-Warn2 "Ya existe $sourceDir; se reutiliza (borralo para forzar un clon limpio)."
} else {
    New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null
    $git = Get-Command git -ErrorAction SilentlyContinue
    if (-not $git) { throw 'git no esta en el PATH. Instala Git for Windows.' }
    git clone --depth 1 --branch $RnoteTag https://github.com/flxzt/rnote.git $sourceDir | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "No se pudo clonar el tag '$RnoteTag'." }
}

# ---------------------------------------------------------------- compilacion
if (-not $SkipBuild) {
    Write-Step 'Compilando rnote-cli (esto es lo que tarda: ~30 min)'
    $unixSource = ConvertTo-UnixPath $sourceDir
    $buildCommand = 'export MSYSTEM=UCRT64; export PATH=/ucrt64/bin:/usr/bin:$PATH; ' +
                    "cd '$unixSource' && cargo build --release -p rnote-cli"
    & $bash -lc $buildCommand | Out-Host
    if ($LASTEXITCODE -ne 0) { throw 'La compilacion fallo. Revisa la salida anterior (suele ser un paquete faltante).' }
}

if (-not (Test-Path $exe)) { throw "No se encontro el binario: $exe" }
$sizeMb = [Math]::Round((Get-Item $exe).Length / 1MB, 1)
Write-Ok "Binario: $exe ($sizeMb MB)"

# ---------------------------------------------------------------- instalacion
if ($Portable) {
    Write-Step 'Instalando en modo portable'
    $portableDir = Join-Path $env:LOCALAPPDATA 'rnote-cli'
    New-Item -ItemType Directory -Force -Path $portableDir | Out-Null
    $portableExe = Join-Path $portableDir 'rnote-cli.exe'
    Copy-Item $exe $portableExe -Force

    $wrapper = Join-Path $portableDir 'rnote-cli.cmd'
    $wrapperContent = "@echo off`r`nset `"PATH=$msys\ucrt64\bin;%PATH%`"`r`n`"%~dp0rnote-cli.exe`" %*`r`n"
    Set-Content -Path $wrapper -Value $wrapperContent -Encoding ASCII

    Write-Step 'Verificando'
    & $wrapper --version
    if ($LASTEXITCODE -ne 0) { throw 'El envoltorio portable no responde.' }

    Write-Host "`nListo. En Ajustes -> RNote rellena LOS DOS campos:" -ForegroundColor Cyan
    Write-Host "  Custom rnote GUI command : `"C:\Program Files\RNote\bin\rnote.exe`""
    Write-Host "  Custom rnote CLI command : `"$wrapper`""
} else {
    Write-Step "Instalando en $InstallDir"
    if (-not (Test-Path $InstallDir)) { New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null }
    $target = Join-Path $InstallDir 'rnote-cli.exe'
    Copy-Item $exe $target -Force

    Write-Step 'Verificando (debe responder con la version)'
    & $target --version
    if ($LASTEXITCODE -ne 0) {
        Write-Warn2 'El binario no arranco con las DLL de RNote.'
        Write-Warn2 "Prueba el modo portable:  .\install-rnote-cli-windows.ps1 -Portable -SkipDeps -SkipBuild"
    } else {
        Write-Ok "Instalado: $target"
        Write-Ok 'El plugin lo detecta solo: no hace falta configurar ninguna ruta.'
    }
}

Write-Host "`nHecho. Recarga Obsidian (Ctrl+R) y activa 'Auto export rnote files'." -ForegroundColor Cyan
Write-Host "Si mas adelante borras $BuildDir, el binario instalado sigue funcionando." -ForegroundColor DarkGray
