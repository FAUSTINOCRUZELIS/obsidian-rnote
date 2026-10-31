# Solución de problemas

Ordenado por síntoma. Si no encuentras tu caso, lo primero es abrir la consola de Obsidian con **`Ctrl+Shift+I`** y mirar los errores: el plugin los imprime ahí casi siempre.

## Tabla rápida

| Síntoma | Causa | Arreglo |
|---|---|---|
| El `.rnote` aparece con **0 KB** y RNote no lo abre (*decompressing bytes failed*) | Bug del plugin original: creaba archivos vacíos | Actualiza a **1.2.0**, o repara los existentes (abajo) |
| Aviso *"Error: rnote path not setup correctly"* al arrancar | No encuentra `rnote-cli` | [Instala el CLI](CLI-RNOTE-WINDOWS.md) |
| *Create & open* abre RNote pero con error o vacío | Mismo bug del 0 KB | Actualiza a 1.2.0 |
| *Export as PDF/SVG* no crea el archivo | CLI ausente o ruta mal configurada | Prueba el CLI a mano (abajo) |
| El PDF no se actualiza al guardar en RNote | Auto-export desactivado, o RNote no ha guardado | Activa el toggle y pulsa `Ctrl+S` en RNote |
| *Export all notes* dispara decenas de procesos y va lento | Bug `forEach(async)` del original | Actualiza a 1.2.0 (secuencial) |
| Se ha sobrescrito un PDF mío | Comportamiento documentado del auto-export | Renombra para evitar colisión; usa copias |
| El plugin no sale en la lista de plugins | Carpeta mal nombrada o falta recargar | Carpeta `rnote`, luego `Ctrl+R` |
| *Update from rnote* exporta otra nota | Bug del archivo activo | Actualiza a 1.2.0 |
| El nombre del archivo lleva `"` o `&` y el export falla | Comillas en el comando `exec` | Renombra el archivo |

---

## 1. Archivos `.rnote` de 0 KB (el bug clásico)

**Diagnóstico** — cualquier `.rnote` de 0 bytes es inválido:

```powershell
& 'C:\Program Files\RNote\bin\rnote-cli.exe' test "ruta\nota.rnote"
# Test failed, Err: loading RnoteFile from bytes failed.
#     0: decompressing bytes failed.
```

**Arreglo definitivo**: versión 1.2.0 o superior (crea con `rnote-cli create`).

**Reparar los que ya tienes** (siguen siendo válidos aunque tengan 0 bytes de contenido):

```powershell
$vault = "C:\ruta\a\MiBoveda"
$cli   = 'C:\Program Files\RNote\bin\rnote-cli.exe'
$tmp   = Join-Path $env:TEMP ("fix-" + [guid]::NewGuid().ToString('N') + ".rnote")

Get-ChildItem $vault -Recurse -Filter *.rnote -File |
  Where-Object { $_.Length -eq 0 } |
  ForEach-Object {
      & $cli create $tmp | Out-Null
      Copy-Item $tmp $_.FullName -Force
      "reparado: $($_.FullName)"
  }
Remove-Item $tmp -Force -ErrorAction SilentlyContinue
```

Los documentos reparados son **vacíos** (352 bytes): no recuperan trazos que nunca se guardaron, porque el archivo original no tenía contenido.

---

## 2. El plugin no encuentra el CLI

**Diagnóstico** — reproduce a mano lo que hace el plugin:

```powershell
& 'C:\Program Files\RNote\bin\rnote-cli.exe' --version
```

| Resultado | Significado |
|---|---|
| `rnote-cli 0.14.2` | El CLI está bien → el problema es otro |
| `No se reconoce…` / no existe | Falta el binario → [CLI-RNOTE-WINDOWS.md](CLI-RNOTE-WINDOWS.md) |
| Error de DLL / 0xc0000139 | Binario incompatible con las DLLs de RNote → usa `-Portable` y los *custom commands* |

Orden en que el plugin busca los binarios (`src/checks.ts`):

1. Ajustes → *Custom rnote GUI command* **y** *Custom rnote CLI command* (deben estar los dos).
2. Ajustes → *Rnote installation path* (deriva el CLI cambiando `rnote.exe` → `rnote-cli.exe`).
3. `rnote` / `rnote-cli` en el `PATH`.
4. Rutas conocidas: `C:\Program Files\RNote\bin\`, `/Applications/RNote.app/Contents/MacOS/`.

---

## 3. El export falla pero el CLI responde

```powershell
& 'C:\Program Files\RNote\bin\rnote-cli.exe' export doc --output-format pdf "ruta\nota.rnote" --on-conflict overwrite
```

- Si esto funciona y el plugin no exporta: revisa que **Auto export** esté activo y que el `.rnote` esté dentro de la bóveda (el plugin solo exporta rutas de la bóveda).
- Si falla con *"file not found"*: la ruta tiene caracteres que rompen el comando (`"`, `&`, `%`). Renombra.
- Si falla con *"permission denied"*: el PDF está abierto con bloqueo exclusivo en otro programa.

---

## 4. El PDF no se refresca en Obsidian

1. Guarda en RNote (`Ctrl+S`). Sin guardar, el archivo no cambia y no hay evento.
2. Comprueba que el toggle **Auto export** sigue activo.
3. Cierra y abre la pestaña del PDF: Obsidian a veces mantiene el render anterior en caché.
4. Si el PDF está embebido con `![[nota.pdf]]`, espera un segundo tras el guardado.

> Con archivos en OneDrive la sincronización puede retrasar el evento `modify` unos segundos. Si trabajas dentro de una carpeta sincronizada y notas latencia, considera mover la bóveda fuera de OneDrive o usar *Files On-Demand* desactivado para esa carpeta.

---

## 5. Auto-export sobrescribe mis PDFs

Es el comportamiento diseñado, y el propio autor lo advierte: si hay un `X.pdf` en la misma carpeta que un `X.rnote`, el export lo machaca.

- Usa nombres únicos para las notas manuscritas.
- Si un PDF es una fuente que no quieres perder, guárdalo en otra carpeta o con otro nombre.
- Copias de seguridad de la bóveda (Obsidian Sync, git, o la que ya uses).

---

## 6. El plugin no aparece

| Comprobación | Cómo |
|---|---|
| Carpeta correcta | `<bóveda>\.obsidian\plugins\rnote\` — el nombre **debe** ser `rnote` |
| Archivos sueltos dentro | `main.js`, `manifest.json`, `styles.css` (no en subcarpeta) |
| Modo restringido | El plugin es `isDesktopOnly`: no funciona en móvil |
| Recarga | `Ctrl+R`. Si tampoco, cierra Obsidian y vuelve a abrir |
| Versión de Obsidian | ≥ 1.5.12 |

---

## 7. Linux / Flatpak

Si instalaste RNote por Flatpak, el plugin no puede adivinar los comandos. Ajustes → RNote:

| Campo | Valor |
|---|---|
| Custom rnote GUI command | `flatpak run com.github.flxzt.rnote` |
| Custom rnote CLI command | `flatpak run --command=rnote-cli com.github.flxzt.rnote` |

Ambos son obligatorios: con uno solo, el plugin ignora los dos y avisa por consola.

---

## 8. Recoger evidencias para abrir un issue

```powershell
# 1. Versión del plugin y de Obsidian
Get-Content "<bóveda>\.obsidian\plugins\rnote\manifest.json"
(Get-Item "$env:LOCALAPPDATA\Programs\Obsidian\Obsidian.exe").VersionInfo.ProductVersion

# 2. Versiones de los binarios
& 'C:\Program Files\RNote\bin\rnote.exe' --help
& 'C:\Program Files\RNote\bin\rnote-cli.exe' --version

# 3. Reproducción a mano del export
& 'C:\Program Files\RNote\bin\rnote-cli.exe' test "ruta\nota.rnote"
& 'C:\Program Files\RNote\bin\rnote-cli.exe' export doc --output-format pdf "ruta\nota.rnote" --on-conflict overwrite

# 4. Consola de Obsidian: Ctrl+Shift+I → pestaña Console → copia el error
```
