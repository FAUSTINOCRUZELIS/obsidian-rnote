# Instalación

El plugin necesita **dos cosas**: Obsidian (con el plugin) y RNote, incluyendo su CLI `rnote-cli` —que es lo que produce los PDF/SVG—. En Linux y macOS el CLI viene con la aplicación; **en Windows no**, y ese es el único paso extra.

Requisitos: Obsidian ≥ 1.5.12 de escritorio (el plugin es `isDesktopOnly`) y RNote ≥ 0.14.

---

## Windows

### 1. Instalar RNote (GUI)

Descarga el instalador desde [flxzt/rnote releases](https://github.com/flxzt/rnote/releases) y ejecútalo. Queda en `C:\Program Files\RNote\bin\rnote.exe`.

Comprueba la versión: abre RNote → menú principal → *About*. Este fork se probó con **0.14.2**.

### 2. Instalar `rnote-cli` (el paso que RNote omite)

El instalador de Windows no incluye el CLI. Desde la raíz del repo:

```powershell
.\scripts\install-rnote-cli-windows.ps1
```

El script instala MSYS2 + GTK4 + Rust vía `winget`/`pacman`, compila RNote en el tag indicado y copia `rnote-cli.exe` a `C:\Program Files\RNote\bin\`. Tarda **30–40 min** la primera vez y descarga ~3 GB.

Verificación:

```powershell
& 'C:\Program Files\RNote\bin\rnote-cli.exe' --version
# rnote-cli 0.14.2
```

Si prefieres hacerlo a mano, o quieres entender qué hace cada paso: [CLI-RNOTE-WINDOWS.md](CLI-RNOTE-WINDOWS.md).

### 3. Instalar el plugin

**Opción A — manual (recomendada aquí):**

Los tres archivos salen de la página de *Releases* del repo (`main.js`, `manifest.json`, `styles.css`). Si trabajas desde el código fuente:

```powershell
npm install && npm run build && npm run dist   # deja los tres archivos en .\dist\
```

Y luego cópialos a la bóveda:

```powershell
$vault = "$env:USERPROFILE\Documents\MiBoveda"     # ajusta
$dest  = Join-Path $vault '.obsidian\plugins\rnote'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item .\dist\main.js, .\dist\manifest.json, .\dist\styles.css $dest
```

La carpeta **debe** llamarse `rnote` (es el `id` del plugin).

**Opción B — BRAT** (si ya lo usas): `Ctrl+P` → *BRAT: Add a beta plugin for testing* → URL de este repositorio.

### 4. Activar

1. `Ctrl+R` en Obsidian (recargar la app: es necesario para que detecte la carpeta nueva).
2. Ajustes → **Plugins de la comunidad** → activar **RNote**.
3. Ajustes → **RNote** → activar **Auto export rnote files**.

Si todo está bien, al activar el plugin **no** aparece ningún aviso de error: eso significa que encontró `rnote-cli`.

---

## Linux

```bash
# Arch
sudo pacman -S rnote            # incluye rnote y rnote-cli

# Fedora
sudo dnf install rnote

# Debian/Ubuntu (si no está en repos): Flatpak
flatpak install flathub com.github.flxzt.rnote
```

Con Flatpak, configura en Ajustes → RNote:

| Campo | Valor |
|---|---|
| Custom rnote GUI command | `flatpak run com.github.flxzt.rnote` |
| Custom rnote CLI command | `flatpak run --command=rnote-cli com.github.flxzt.rnote` |

Instala el plugin copiando `dist/` a `<bóveda>/.obsidian/plugins/rnote/` y activa.

> En Linux el flujo es el "de fábrica" del proyecto original: no hace falta compilar nada.

---

## macOS

`rnote-cli` viaja dentro del bundle de la aplicación:

```
/Applications/RNote.app/Contents/MacOS/rnote-cli
```

El plugin lo detecta solo. Si usas otra ruta, rellena los dos campos de *Custom command*.

> Sin verificar en este fork (no había un Mac disponible). Si lo pruebas, abre un issue con el resultado.

---

## Comprobar que todo el circuito funciona

```powershell
# 1. El CLI responde
& 'C:\Program Files\RNote\bin\rnote-cli.exe' --version

# 2. Crear un documento válido (352 bytes, no 0)
& 'C:\Program Files\RNote\bin\rnote-cli.exe' create "$env:TEMP\prueba.rnote"
Get-Item "$env:TEMP\prueba.rnote" | Select-Object Length

# 3. Exportar (debe generar prueba.pdf junto al .rnote)
& 'C:\Program Files\RNote\bin\rnote-cli.exe' export doc --output-format pdf "$env:TEMP\prueba.rnote" --on-conflict overwrite
```

Los tres pasos son exactamente lo que hace el plugin. Si el 3 falla, el problema es del CLI; si funcionan y el plugin no exporta, revisa [SOLUCION-DE-PROBLEMAS.md](SOLUCION-DE-PROBLEMAS.md).

---

## Desinstalar

1. Ajustes → Plugins de la comunidad → desactivar **RNote**.
2. Borra `<bóveda>/.obsidian/plugins/rnote/`.
3. Opcional: borra `C:\Program Files\RNote\bin\rnote-cli.exe` (no lo instaló RNote, así que su desinstalador no lo quitará).
