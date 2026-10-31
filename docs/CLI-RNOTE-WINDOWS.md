# `rnote-cli` en Windows: por qué falta y cómo compilarlo

## El problema

El plugin exporta llamando al CLI:

```bash
rnote-cli export doc --output-format pdf "nota.rnote" --on-conflict overwrite
```

En Windows, tras instalar RNote desde su instalador oficial, **`rnote-cli.exe` no existe**:

```powershell
Get-ChildItem 'C:\Program Files\RNote\bin' -Filter 'rnote*'
# Sólo: rnote.exe  (217 MB)

& 'C:\Program Files\RNote\bin\rnote.exe' --help
# Uso: rnote.exe [OPCIÓN…]  — opciones de GApplication, ningún subcomando
```

El `rnote.exe` es solo la GUI y no acepta `export`. Por eso cualquier export fallaba y, al arrancar, el plugin mostraba *"Error: rnote path not setup correctly"*.

### Culpa del empaquetado de RNote, no del plugin

En el repo de RNote, el script de Inno Setup tiene el bloque que empaqueta el CLI:

```ini
; build-aux/rnote_inno.iss.in
#if Defined(MyAppCliExeName)
    Name: "addtopath"; ...
    Source: "{#meson_build_root}\{#MyAppCliExeName}"; DestDir: "{app}\bin\"; ...
#endif
```

…pero **nada en las fuentes de v0.14.2 define `MyAppCliExeName`**. El CLI se compila (`-Dcli=true` en el `justfile`) y se descarta. Resultado: 68 releases publicadas, ninguna con el binario.

Opciones que tienes: compilarlo (esta guía), o esperar a que upstream lo empaquete.

---

## Compilar: el camino que funciona

Resumen real de la compilación verificada en este fork (Windows 11, x86_64):

| Dato | Valor |
|---|---|
| Entorno | MSYS2 **UCRT64** (GTK4 4.24.1, libadwaita 1.10) |
| Rust | 1.99.1 (`x86_64-pc-windows-gnu`) |
| Comando | `cargo build --release -p rnote-cli` |
| Tiempo | **31 min 19 s** |
| Descargas | ~3 GB (MSYS2 + GTK4 + crates) |
| Disco usado | ~1,8 GB (fuente + `target/`) |
| Binario | 122 MB (release **con** símbolos de depuración) |

> **Trampa:** el repo `mingw64` de MSYS2 ya **no distribuye GTK4**. Hay que usar `ucrt64`. El `justfile` de RNote todavía apunta a `mingw64` en v0.14.2; ignorarlo, es más simple compilar con `cargo` directamente.

### Script automático

```powershell
.\scripts\install-rnote-cli-windows.ps1               # RNote 0.14.2
.\scripts\install-rnote-cli-windows.ps1 -RnoteTag v0.15.0
.\scripts\install-rnote-cli-windows.ps1 -Portable     # sin tocar Program Files
```

### Manual, paso a paso

```powershell
# 1. MSYS2
winget install -e --id MSYS2.MSYS2 --accept-package-agreements --accept-source-agreements

# 2. Actualizar la base (dos pasadas; la primera puede pedir reiniciar la shell)
C:\msys64\usr\bin\bash.exe -lc "pacman --noconfirm -Syu"
C:\msys64\usr\bin\bash.exe -lc "pacman --noconfirm -Syu"

# 3. Toolchain GTK4 + Rust (ucrt64, no mingw64)
C:\msys64\usr\bin\bash.exe -lc "pacman --noconfirm --needed -S mingw-w64-ucrt-x86_64-rust mingw-w64-ucrt-x86_64-gcc mingw-w64-ucrt-x86_64-pkgconf mingw-w64-ucrt-x86_64-gtk4 mingw-w64-ucrt-x86_64-libadwaita mingw-w64-ucrt-x86_64-cmake mingw-w64-ucrt-x86_64-make mingw-w64-ucrt-x86_64-python"

# 4. Fuente de RNote (mismo tag que tu GUI)
git clone --depth 1 --branch v0.14.2 https://github.com/flxzt/rnote.git C:\rnote-build\src

# 5. Compilar
C:\msys64\usr\bin\bash.exe -lc 'export MSYSTEM=UCRT64; export PATH=/ucrt64/bin:/usr/bin:$PATH; cd /c/rnote-build/src && cargo build --release -p rnote-cli'
```

Resultado: `C:\rnote-build\src\target\release\rnote-cli.exe`.

### Instalar y verificar

El plugin resuelve el CLI, en último término, como `C:\Program Files\RNote\bin\rnote-cli.exe`. Copiarlo ahí hace que funcione **sin configurar nada**:

```powershell
Copy-Item 'C:\rnote-build\src\target\release\rnote-cli.exe' 'C:\Program Files\RNote\bin\' -Force
& 'C:\Program Files\RNote\bin\rnote-cli.exe' --version    # rnote-cli 0.14.2
```

Verificado: el binario compilado con MSYS2 **funciona con las DLLs que ya trae RNote** (no hay que copiar GTK aparte). Si en tu caso fallara con "entry point not found", usa la variante portable:

```powershell
.\scripts\install-rnote-cli-windows.ps1 -Portable
# deja el CLI + sus DLLs en %LOCALAPPDATA%\rnote-cli\
```

…y en Ajustes → RNote rellena **los dos** campos:

| Campo | Valor |
|---|---|
| Custom rnote GUI command | `"C:\Program Files\RNote\bin\rnote.exe"` |
| Custom rnote CLI command | `"C:\Users\TU_USUARIO\AppData\Local\rnote-cli\rnote-cli.exe"` |

---

## Mantenimiento

- **Actualizar RNote**: si la nueva versión no trae su propio `rnote-cli.exe`, el nuestro sigue ahí y sigue funcionando (el instalador de Inno solo borra lo que él instaló). Si **sí** lo trae, el suyo se instala en la misma ruta y pasa a mandar: mejor.
- **Recompilar para otra versión**: `-RnoteTag v0.15.0`. Conviene que el CLI y la GUI sean de la misma serie (0.14 con 0.14): el formato `.rnote` evoluciona.
- **Ahorrar espacio**: se puede `strip` el binario para bajar de 122 MB a ~30 MB:
  `C:\msys64\usr\bin\bash.exe -lc 'export PATH=/ucrt64/bin:$PATH; strip /c/rnote-build/src/target/release/rnote-cli.exe'`
- **Borrar el árbol de compilación**: `Remove-Item C:\rnote-build -Recurse` (el binario instalado no depende de él).
