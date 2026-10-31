# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/).

## [1.2.0] — 2026-10-31

Primera release del fork. Base: `DarshPareek/obsidian-rnote@a7d904e` (posterior a la 1.0.2).

### Corregido

- **Notas nuevas inválidas (crítico).** `createRNoteFile()` creaba el archivo con `vault.create(path, "")`, es decir, 0 bytes. RNote rechaza esos documentos (`loading RnoteFile from bytes failed` → `decompressing bytes failed`) y el flujo *Create & open* mostraba un error. Ahora se crea un documento vacío válido con `rnote-cli create`, con retroceso al comportamiento anterior si el CLI no está disponible. (`src/rnoteActions.ts`)
- **"Update from rnote" exportaba el archivo equivocado.** El manejador leía `workspace.getActiveFile()` en lugar del archivo sobre el que se abrió el menú contextual, de modo que exportaba la ruta de la pestaña activa (o incluso un `.md`). Ahora usa el `.rnote` correspondiente. (`src/fileMenu.ts`)
- **Exportaciones en paralelo y aviso falso de éxito.** `exportRNote()` usaba `filePaths.forEach(async …)`, lanzando un proceso `rnote-cli` por archivo y evaluando `errors`/`notify` antes de que terminaran. Ahora es un bucle secuencial con el aviso correcto. (`src/rnoteExport.ts`, ya presente en `main` del repo original)
- **`npm install` fallaba en un clon limpio.** Las dependencias `eslint` / `eslint-plugin-obsidianmd` introducidas en `main` provocan un conflicto de peer dependencies (`typescript@4.7.4` vs `typescript-eslint@8`). Se añade `legacy-peer-deps=true` a `.npmrc`, lo que además repara el workflow de release. (`.npmrc`, `package-lock.json` regenerado)

### Añadido

- **Soporte funcional de Windows.** El instalador oficial de RNote no incluye `rnote-cli.exe`; se añade `scripts/install-rnote-cli-windows.ps1`, que instala MSYS2 (UCRT64), GTK4, Rust y compila `rnote-cli` 0.14.2, dejándolo en `C:\Program Files\RNote\bin\`.
- **Documentación completa** en `docs/`: instalación, CLI en Windows, solución de problemas, auditoría de seguridad, guía de publicación e informes para upstream.
- **`CHANGELOG.md`** y **`dist/`** con los artefactos listos para subir a una release.

### Cambiado

- `manifest.json`: versión `1.2.0`, autor con mención del fork, `authorUrl` del mantenedor, eliminado `fundingUrl` placeholder.
- `package.json`: versión alineada a `1.2.0` (estaba en `1.1.2` mientras el manifest decía `1.0.2`).
- `versions.json`: nueva entrada `1.2.0`.

### Notas de compatibilidad

- Mismo `id` (`rnote`) y mismo `data.json`, por lo que sustituye al plugin original sin perder ajustes.
- Requiere Obsidian ≥ 1.5.12 y RNote ≥ 0.14 (`rnote-cli export doc --output-format`).
- En Linux y macOS no se necesita nada de Windows: `rnote-cli` viene con el paquete o dentro del `.app`.

## [1.0.2] — 2026-03-21 (upstream)

- Opciones de lanzamiento personalizadas (Flatpak) y cambios sugeridos por el bot de Obsidian.

## [1.0.1] — 2026-03-20 (upstream)

- Primera versión publicada. Solo Linux.
