# RNote para Obsidian · fork con soporte real en Windows

Integración entre [Obsidian](https://obsidian.md) y [RNote](https://github.com/flxzt/rnote): crea notas manuscritas `.rnote` desde la bóveda, edítalas en RNote y mantenlas visibles en Obsidian como PDF o SVG exportados automáticamente.

> **Este es un fork de [DarshPareek/obsidian-rnote](https://github.com/DarshPareek/obsidian-rnote).**
> La versión 1.2.0 corrige tres bugs que impedían usarlo en Windows y añade esta documentación.
> Licencia MIT, mismo `id` de plugin (`rnote`), compatible con la configuración existente.

**Estado:** funcional y verificado en Windows 11 + Obsidian 1.13.7 + RNote 0.14.2.
**Versión:** 1.2.0 · **Obsidian mínimo:** 1.5.12 · **Solo escritorio** (`isDesktopOnly`).

---

## Documentación

| Documento | Para qué |
|---|---|
| [Instalación](docs/INSTALACION.md) | Windows, Linux, macOS. Manual y con BRAT. Verificación paso a paso |
| [rnote-cli en Windows](docs/CLI-RNOTE-WINDOWS.md) | Por qué falta el binario, cómo compilarlo (script incluido) y cómo mantenerlo |
| [Solución de problemas](docs/SOLUCION-DE-PROBLEMAS.md) | Síntoma → causa → arreglo. Empieza aquí si algo falla |
| [Auditoría de seguridad](docs/AUDITORIA.md) | Qué hace el plugin con tu sistema, revisión del código y del binario publicado |
| [Publicar una release](docs/PUBLICAR.md) | Fork en GitHub, versionado, etiquetas, CI y checklist previa |
| [Informe para upstream](docs/UPSTREAM.md) | Textos en inglés listos para abrir issues/PR en los repos originales |

---

## Por qué existe este fork

El plugin original está pensado y probado en Linux. En Windows falla por tres motivos independientes, y ninguno es culpa del usuario:

| # | Bug | Síntoma que veías | Estado |
|---|---|---|---|
| 1 | Al crear una nota se escribía un archivo **vacío** (`vault.create(path, "")`) | `.rnote` de 0 KB que RNote no abre: *"decompressing bytes failed"* | **Corregido** — se crea con `rnote-cli create` |
| 2 | El menú **"Update from rnote"** usaba la pestaña activa, no el archivo del menú | Exportaba una ruta equivocada o un `.md` | **Corregido** — usa el `.rnote` del menú |
| 3 | `exportRNote` usaba `forEach(async …)` | Lanzaba N procesos `rnote-cli` en paralelo y mostraba "exportado con éxito" aunque fallara | **Corregido** — bucle secuencial |
| 4 | El instalador oficial de RNote **nunca incluye `rnote-cli.exe`** en Windows | Cualquier export fallaba: el plugin busca `C:\Program Files\RNote\bin\rnote-cli.exe` y no existe | **Resuelto** — script que lo compila e instala |
| 5 | `npm install` limpio falla por peer deps (ESLint) | El CI de releases reventaba al etiquetar | **Corregido** — `.npmrc` con `legacy-peer-deps` |

Detalle del bug 4: [`build-aux/rnote_inno.iss.in`](https://github.com/flxzt/rnote/blob/v0.14.2/build-aux/rnote_inno.iss.in) incluye el bloque `#if Defined(MyAppCliExeName)` para empaquetar el CLI, pero **nada en las fuentes define esa variable**, así que el instalador de Windows jamás lo incluye. Es un bug de empaquetado de RNote, no del plugin.

---

## Instalación en 4 pasos (Windows)

1. **Instala RNote** (GUI) desde [sus releases](https://github.com/flxzt/rnote/releases): `rnote-win-installer-0.14.2-x86_64.exe`.
2. **Instala el CLI** que RNote no trae:

   ```powershell
   .\scripts\install-rnote-cli-windows.ps1
   ```

   Tarda ~35 min la primera vez (compila RNote 0.14.2). Deja `rnote-cli.exe` en `C:\Program Files\RNote\bin\`.
3. **Instala el plugin**: copia `main.js`, `manifest.json` y `styles.css` a `<bóveda>\.obsidian\plugins\rnote\`, o usa BRAT con la URL de este repo.
4. **Recarga Obsidian** (`Ctrl+R`) y activa **RNote** en Ajustes → Plugins de la comunidad. Activa **Auto export**.

Guía completa, con Linux y macOS, en [docs/INSTALACION.md](docs/INSTALACION.md).

---

## Cómo se usa

1. **Crear**: icono de pluma en la cinta, clic derecho en una carpeta → *Create new rnote*, o paleta de comandos → *Create a new note* (`Create & open` lo abre directamente en RNote).
2. **Dibujar** en RNote y guardar (`Ctrl+S`).
3. **Ver**: con auto-export activo, el PDF/SVG se regenera junto al `.rnote` y Obsidian refresca la vista embebida.

Embebe la nota en cualquier `.md`:

```markdown
![[Mi nota.pdf]]
```

o enlaza para saltar a ella:

```markdown
[[Mi nota.rnote|Mi nota]]
```

### Comandos

| Comando | Qué hace |
|---|---|
| `Create a new note` | Crea un `.rnote` (elige carpeta, plantilla y formato) |
| `Create a new note and insert link` | Crea la nota e inserta `![[…]]` en el editor |
| `Open current note` | Abre en RNote el `.rnote` del PDF/SVG activo |
| `Update current export` | Fuerza el re-export del documento activo |
| `Export all notes` | Exporta todos los `.rnote` de la bóveda (secuencial) |
| `Rename/Delete current export and corresponding note` | Renombra o borra el par PDF+`.rnote` |
| `Search and open note` | Buscador difuso de notas (`Shift+Enter` abre en RNote) |

### Ajustes

| Ajuste | Descripción |
|---|---|
| **Auto export rnote files** | Exporta al modificar el `.rnote`. **Sobrescribe** PDFs con el mismo nombre y carpeta |
| **Rnote installation path** | Ruta al ejecutable; vacío = rutas por defecto del sistema |
| **Custom rnote GUI / CLI command** | Para Flatpak/Snap o rutas no estándar (deben ir ambos) |
| **Rnote templates folder** | Carpeta de plantillas `.rnote` |
| **Default rnote template** | Plantilla usada al crear notas |
| **Default path / name** | Carpeta y nombre por defecto (soporta `${YYYY}-${MM}-${cursor}`) |

---

## Cómo funciona

- `checks.ts` resuelve los binarios en este orden: comandos personalizados → `rnotePath` → alias `rnote`/`rnote-cli` en PATH → rutas conocidas (`C:\Program Files\RNote\bin\…`, `/Applications/RNote.app/…`).
- Al guardar un `.rnote`, el evento `vault.modify` dispara:

  ```bash
  rnote-cli export doc --output-format {pdf|svg} "ruta/nota.rnote" --on-conflict overwrite
  ```

- El formato por archivo se guarda en `svgExportFiles` (dentro de `data.json`).
- Al arrancar con auto-export activo se exportan las notas sin PDF o más nuevas que su PDF.

---

## Seguridad

Resumen de la [auditoría](docs/AUDITORIA.md): el plugin **no tiene acceso a red** (0 peticiones `fetch`/XHR/websockets, 0 URLs), no usa `eval` ni código ofuscado, y solo escribe dentro de la bóveda a través de la API de Obsidian. Su única capacidad sensible es `child_process.exec` para lanzar `rnote.exe` y `rnote-cli`, con rutas entre comillas. El `main.js` publicado por el autor original coincide línea a línea con su código fuente (verificado compilando el tag).

---

## Desarrollo

```bash
npm install          # usa legacy-peer-deps (.npmrc)
npm run dev          # esbuild en watch
npm run build        # tsc --noEmit + esbuild producción → main.js
```

Estructura: `main.ts` (arranque y ajustes), `src/checks.ts` (localización de binarios), `src/rnoteActions.ts` (abrir/crear/renombrar/borrar), `src/rnoteExport.ts` (exportación), `src/listeners.ts` (eventos), `src/commands.ts`, `src/fileMenu.ts`, `src/pdfToolbar.ts`, `src/modals/`.

---

## Publicar una release

El workflow [`.github/workflows/release.yml`](.github/workflows/release.yml) compila y crea un *draft release* al empujar una etiqueta, adjuntando `main.js`, `manifest.json` y `styles.css`:

```bash
npm version 1.2.1 --no-git-tag-version
git commit -am "chore: release 1.2.1"
git tag 1.2.1
git push origin main --tags
```

Checklist y publicación manual con `gh`: [docs/PUBLICAR.md](docs/PUBLICAR.md).

---

## Roadmap

- Enviar los parches a los repos originales ([textos listos](docs/UPSTREAM.md)).
- Empaquetar `rnote-cli` precompilado para Windows en la propia release (evita MSYS2 al usuario).
- Sustituir `exec` por `execFile` (elimina el riesgo de comillas en nombres de archivo).
- Revisar el `MutationObserver` de `fileMenu.ts` que puede quedar vivo.
- Aligerar el binario del CLI (122 MB por los símbolos de depuración).

---

## Créditos y licencia

Código original: **Darsh Pareek** ([obsidian-rnote](https://github.com/DarshPareek/obsidian-rnote), MIT).
RNote: **Felix Zwettler** y colaboradores ([flxzt/rnote](https://github.com/flxzt/rnote)).
Este fork mantiene la licencia **MIT** — ver [LICENSE.md](LICENSE.md).

---

<details>
<summary>English summary</summary>

Fork of `DarshPareek/obsidian-rnote` (v1.2.0) that makes the plugin usable on Windows:

- **Fix:** new notes were created as zero-byte files (`vault.create(path, "")`), which RNote cannot open. They are now created with `rnote-cli create`.
- **Fix:** "Update from rnote" exported the active tab instead of the file the menu belongs to.
- **Fix:** exports ran through `forEach(async …)` (parallel processes, wrong success toast); now sequential.
- **Fix:** `npm install` failed on a clean clone due to ESLint peer dependencies (`.npmrc` → `legacy-peer-deps=true`), which broke the release CI.
- **Workaround:** RNote's Windows installer never ships `rnote-cli.exe` (the `#if Defined(MyAppCliExeName)` block in `rnote_inno.iss.in` is never enabled by the build), so `scripts/install-rnote-cli-windows.ps1` builds and installs it.
- Docs, security audit and upstream bug reports included.

</details>
