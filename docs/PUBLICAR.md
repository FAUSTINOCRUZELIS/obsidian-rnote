# Publicar este fork

Guía para convertir este repo local en el fork público de GitHub, con releases instalables.

---

## 1. Crear el fork

**Opción A — fork real de GitHub** (conserva el historial y el enlace con el original):

1. Abre https://github.com/DarshPareek/obsidian-rnote → **Fork** → crea `TU_USUARIO/obsidian-rnote`.
2. En tu copia local:

   ```bash
   git remote add origin https://github.com/TU_USUARIO/obsidian-rnote.git
   git remote add upstream https://github.com/DarshPareek/obsidian-rnote.git
   git push -u origin main --tags
   ```

**Opción B — repo nuevo** (si no quieres la relación de fork):

```bash
# crea el repo vacío en GitHub y luego
git remote add origin https://github.com/TU_USUARIO/rnote-obsidian.git
git push -u origin main --tags
```

> Si el plugin se llama distinto en la UI, recuerda que el `id` del manifest **debe** seguir siendo `rnote`: es la carpeta que Obsidian busca y la que conserva los ajustes de los usuarios que migran.

## 2. Nombres y metadatos

| Campo | Valor en este fork |
|---|---|
| `manifest.json → id` | `rnote` (no cambiar) |
| `manifest.json → version` | `1.2.0` |
| `manifest.json → author` | autor original + mantenedor del fork |
| Repo | `obsidian-rnote` (o el que elijas) |
| Release assets | `main.js`, `manifest.json`, `styles.css` |

## 3. Versionado

Reglas mínimas (SemVer):

- **PATCH** (`1.2.1`): arreglos sin cambios de comportamiento visibles.
- **MINOR** (`1.3.0`): nuevas funciones o correcciones que cambian el flujo.
- **MAJOR**: solo si rompe compatibilidad (por ejemplo, cambiar el `id`).

El flujo con `npm version` actualiza `package.json`, `manifest.json` y `versions.json` de golpe:

```bash
npm version 1.2.1 --no-git-tag-version
node version-bump.mjs           # sincroniza manifest.json + versions.json
```

(o simplemente edita `manifest.json`, `package.json` y `versions.json` a mano y comprueba que coinciden).

## 4. Checklist antes de etiquetar

```bash
npm install                     # debe terminar sin ERESOLVE (gracias a .npmrc)
npm run build                   # tsc + esbuild, exit 0
npm run dist                    # genera dist/ y SHA256SUMS.txt

# coherencia de versiones
grep '"version"' manifest.json package.json
grep '1\.2\.0' versions.json
```

Además:

- [ ] `CHANGELOG.md` actualizado con la versión y la fecha.
- [ ] `README.md` sin referencias a versiones antiguas.
- [ ] Sin secretos en el repo (`git status`, revisar `.npmrc`, `data.json`).
- [ ] `docs/` con enlaces relativos que funcionen en GitHub.
- [ ] El plugin arranca en una bóveda limpia (carpeta `rnote`, `Ctrl+R`, sin avisos de error).

## 5. Crear la release

**Automático (recomendado)** — el workflow `.github/workflows/release.yml` se dispara con cualquier etiqueta:

```bash
git add -A
git commit -m "chore: release 1.2.1"
git tag 1.2.1
git push origin main --tags
```

GitHub Actions compila en Ubuntu y crea un **draft release** con los tres archivos adjuntos. Solo queda revisarlo y pulsar **Publish release**.

> El workflow usa `npm install` (no `npm ci`) porque el `package-lock.json` no se versiona; con `.npmrc → legacy-peer-deps=true` funciona desde un clon limpio. Si en el futuro se versiona el lock, cámbialo a `npm ci` y fija las dependencias.

**Manual**, si el CI falla:

```powershell
npm run dist
gh release create 1.2.1 `
  --title "1.2.1" `
  --notes-file CHANGELOG.md `
  dist/main.js dist/manifest.json dist/styles.css
```

## 6. Instalación por parte de los usuarios

| Vía | Cómo |
|---|---|
| Manual | Descargar `main.js`, `manifest.json`, `styles.css` de la release → `<bóveda>/.obsidian/plugins/rnote/` |
| BRAT | Añadir la URL del repo en *BRAT: Add a beta plugin* |
| Comunidad | Requiere someterlo a revisión (ver abajo) |

## 7. ¿Y la tienda de plugins de Obsidian?

Se puede intentar, pero este plugin tiene una particularidad: **depende de un binario externo** (`rnote-cli`) que en Windows no viene con la aplicación. La revisión de Obsidian mira, entre otras cosas:

- Que no haya telemetría ni llamadas de red no justificadas ✔ (ver [AUDITORIA.md](AUDITORIA.md)).
- Que el `id` no colisione con un plugin existente ✔ (`rnote` está libre si el original nunca se publicó).
- Que el README explique la instalación y los requisitos ⚠ (`isDesktopOnly`, CLI externo).
- Uso de `child_process` ⚠: es legítimo para este caso, pero hay que documentarlo bien.

Si lo intentas: PR a [`obsidianmd/obsidian-releases`](https://github.com/obsidianmd/obsidian-releases) añadiendo la entrada en `community-plugins.json` y el repo en `community-plugin-stats.json` no es necesario (se genera solo). Antes, asegúrate de que la release tiene los tres archivos y el manifest es válido.

## 8. Devolver los arreglos al upstream

Aunque publiques el fork, lo correcto es ofrecer los parches al autor original:

- **RNote** (`flxzt/rnote`): issue sobre el CLI que nunca se empaqueta en Windows.
- **obsidian-rnote** (`DarshPareek/obsidian-rnote`): issue/PR con los tres arreglos.

Textos listos para copiar en [UPSTREAM.md](UPSTREAM.md).

Si el autor original acepta los cambios, este fork puede quedar como documentación y soporte Windows, o desaparecer cuando la versión oficial los incluya.
