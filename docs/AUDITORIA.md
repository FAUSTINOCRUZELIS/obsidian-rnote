# Auditoría de seguridad

Revisión hecha antes de instalar el plugin en una bóveda real (octubre de 2026), sobre el código en `main` del repo original y sobre el `main.js` publicado en la release 1.0.2.

**Conclusión:** no se encontró código malicioso ni capacidad de exfiltración. El plugin es un envoltorio local de RNote. Apta para uso diario, con las salvedades de la sección *Riesgos aceptados*.

---

## Alcance

| Elemento | Detalle |
|---|---|
| Código fuente | 15 archivos TypeScript / TSX, ~1.050 líneas (`main.ts` + `src/`) |
| Commit auditado | `a7d904e` (main, 2 commits por delante del tag 1.0.2) |
| Binario publicado | `main.js` de la release 1.0.2 (68.004 bytes) |
| Dependencias | `obsidian`, `dayjs`, `child_process` (builtin de Node) |
| Fuera de alcance | RNote y `rnote-cli` (código ajeno), Obsidian, extensiones del sistema |

## Metodología

1. Lectura completa del árbol `src/` y de `main.ts`.
2. Búsqueda dirigida de patrones peligrosos: `fetch`, `XMLHttpRequest`, `WebSocket`, URLs, `eval`, `new Function`, `atob`, `Buffer.from`, `fromCharCode`, `process.env`, `child_process`, `writeFile`, `unlink`, `rmdir`.
3. Revisión de los puntos de entrada de datos externos: nombres de archivo, ajustes, plantillas, rutas.
4. **Verificación de reproducibilidad**: compilar el tag `1.0.2` desde el fuente y comparar con el `main.js` publicado.
5. Inventario de la superficie de escritura en disco.

---

## Resultados

| Comprobación | Resultado |
|---|---|
| Acceso a red (`fetch`, XHR, WebSocket, URLs) | **0** ocurrencias |
| `eval` / `new Function` / código dinámico | **0** |
| Ofuscación, base64, strings codificados | **0** |
| Telemetría o analítica | ninguna |
| Escritura fuera de la bóveda | ninguna: todo pasa por `vault.adapter` / `fileManager` |
| `child_process` | 3 usos, todos con `rnote.exe` o `rnote-cli` |
| Dependencias innecesarias | `pako` declarada y nunca importada (peso muerto, no riesgo) |

### `child_process` en detalle

| Archivo | Comando | Datos que se interpolan |
|---|---|---|
| `src/rnoteActions.ts` | `"<gui>" "<ruta.rnote>"` | ruta de un archivo de la bóveda |
| `src/rnoteExport.ts` | `"<cli>" export doc --output-format {pdf,svg} "<ruta>" --on-conflict overwrite` | ídem |
| `src/checks.ts` | `"<cli>" --version` | solo la ruta configurada en ajustes |

No hay ejecución de contenido de la bóveda: únicamente se abre en RNote o se exporta un `.rnote`.

### Reproducibilidad del binario publicado

| Artefacto | SHA-256 | Tamaño |
|---|---|---|
| `main.js` release 1.0.2 | `58EB91E7…01B1A4` | 68.004 B |
| Compilación propia del tag 1.0.2 | `7265F956…F210DA47` | 68.005 B |

La diferencia es de **8 líneas**, todas dentro del bundle minificado de `dayjs` (nombres mangle distintos por versión de dependencia resuelta). El código propio del plugin coincide línea a línea: **el binario publicado no contiene código que no esté en el fuente**.

---

## Hallazgos que no son de seguridad (pero afectan al uso)

| # | Hallazgo | Gravedad | Estado en 1.2.0 |
|---|---|---|---|
| 1 | Notas nuevas creadas como archivos de 0 bytes | **Crítica** (bloqueante) | Corregido |
| 2 | *Update from rnote* exporta el archivo activo, no el del menú | Alta | Corregido |
| 3 | `exportRNote` con `forEach(async)` → procesos en paralelo y aviso falso | Media | Corregido |
| 4 | `npm install` limpio falla por peer deps → CI de release roto | Media | Corregido (`.npmrc`) |
| 5 | `removeDeleteRenameMenuItem` puede dejar un `MutationObserver` vivo | Baja | Pendiente |
| 6 | `package.json` (1.1.2) y `manifest.json` (1.0.2) desalineados | Baja | Corregido |
| 7 | `Editor` comparado con `instanceof` en `CreateRNoteModalManager` | Baja | Pendiente de verificar en runtime |

## Riesgos aceptados

| Riesgo | Detalle | Mitigación |
|---|---|---|
| **Inyección de comandos vía nombre de archivo** | Los comandos se construyen con `exec` y rutas entre comillas dobles. Un nombre con `"` o `&` puede alterar el comando | No crear archivos con esos caracteres; pendiente migrar a `execFile` con array de argumentos |
| **Auto-export destructivo** | Sobrescribe PDFs homónimos y de la misma carpeta | Toggle desactivado por defecto en upstream; copias de seguridad |
| **Plugin fuera de la tienda** | Sin revisión de Obsidian, mantenido por una sola persona | Este fork + auditoría; código pequeño y legible |
| **Confianza en el binario de RNote** | El CLI que compilamos ejecuta código de `flxzt/rnote` | Se compila desde el tag oficial; se puede verificar el commit |
| **Ejecución de un binario en `Program Files`** | Requiere permisos de administrador para el paso de instalación | Aceptado: lo normal para software de escritorio |

## Limitaciones de esta auditoría

- No se hizo análisis dinámico (depuración en caliente del plugin dentro de Obsidian).
- No se auditó RNote ni el instalador de Inno Setup más allá de lo necesario para entender el empaquetado.
- No se revisaron las dependencias transitivas de `dayjs` (una única dependencia, sin sub-dependencias relevantes).
- La revisión es de un instante concreto: conviene repetirla al actualizar.

## Recomendaciones

1. Migrar `exec` a `execFile` con argumentos en array (elimina el vector de comillas).
2. Fijar versiones exactas en `package.json` y usar `npm ci` en el CI.
3. Revisar el `MutationObserver` de `fileMenu.ts` (desconectar siempre, no solo al encontrar el menú).
4. Mantener este documento actualizado en cada release del fork.
