# Informes para upstream

Textos listos para copiar en los repos originales. Están en inglés porque es el idioma de ambos proyectos.

---

## 1. flxzt/rnote — el instalador de Windows nunca incluye `rnote-cli`

**Título:** Windows installer never ships `rnote-cli.exe` (`MyAppCliExeName` is never defined)

**Cuerpo:**

```markdown
### What happens

The official Windows installer (`rnote-win-installer-0.14.2-x86_64.exe`) installs only the
GUI binary. After a normal install, `C:\Program Files\RNote\bin` contains `rnote.exe` and
no `rnote-cli.exe`, so the CLI cannot be used on Windows at all.

```powershell
PS> Get-ChildItem 'C:\Program Files\RNote\bin' -Filter 'rnote*'
    rnote.exe

PS> & 'C:\Program Files\RNote\bin\rnote.exe' --help
Uso:
  rnote.exe [OPCIÓN…]
Opciones de ayuda:
  -h, --help ...
```

### Why

`build-aux/rnote_inno.iss.in` (v0.14.2) already contains the packaging logic, but it is
guarded by a preprocessor define that the build never sets:

```ini
[Tasks]
#if Defined(MyAppCliExeName)
    Name: "addtopath"; Description: "Add rnote-cli to PATH ..."
#endif

[Files]
#if Defined(MyAppCliExeName)
    Source: "{#meson_build_root}\{#MyAppCliExeName}"; DestDir: "{app}\bin\"
#endif
```

Searching the v0.14.2 tree for `MyAppCliExeName` returns only the `.iss.in`
template: nothing in `meson.build` (or any build script) defines it. The CLI is
built — the `justfile` invokes `meson setup -Dcli=true` for `setup-win-installer` —
and then simply not packaged.

### Expected

Either the installer includes `rnote-cli.exe` (and optionally offers the "add to PATH"
task), or the CLI is attached as a separate release asset for Windows.

### Suggested fix

When configuring `rnote_inno.iss.in`, set the define if the CLI is built on Windows, e.g.
in the `configuration_data` used to generate the installer script:

```meson
if build_cli and host_machine.system() == 'windows'
    inno_data.set('MyAppCliExeName', cli_name + '.exe')
endif
```

### Environment

- RNote 0.14.2 (installer), Windows 11 x86_64
- Workaround used meanwhile: building `rnote-cli` from source
  (`cargo build --release -p rnote-cli`) and copying the binary into
  `C:\Program Files\RNote\bin`. It runs fine against the GTK/GLib DLLs the
  installer already provides.

### Why it matters

Third-party integrations shell out to `rnote-cli export doc` to produce PDF/SVG
(e.g. the Obsidian plugin `obsidian-rnote`), and on Windows they are all broken
by the missing binary.
```

---

## 2. DarshPareek/obsidian-rnote — tres arreglos

**Título:** Fix Windows: zero-byte notes, wrong file in "Update from rnote", parallel exports (+ broken `npm install`)

**Cuerpo:**

````markdown
### Summary

Three bugs that make the plugin unusable on Windows, plus one that breaks the
release CI. All are small and independent.

#### 1. New notes are created as zero-byte files (critical)

`src/rnoteActions.ts` → `createRNoteFile()`:

```ts
} else {
    await plugin.app.vault.create(newNotePath, "");
}
```

An empty file is not a valid `.rnote` document, and RNote refuses it:

```
$ rnote-cli test "DEMO RNOTE.rnote"
Test failed, Err: loading RnoteFile from bytes failed.
    0: decompressing bytes failed.
```

So *Create* leaves a 0 KB file and *Create & open* shows an error dialog.

**Fix:** let the CLI create a valid (empty) document:

```ts
} else if (!(await createEmptyRNoteDocument(plugin, newNotePath))) {
    // fallback: an empty file is not a valid rnote document, but at least it exists
    await plugin.app.vault.create(newNotePath, "");
}

async function createEmptyRNoteDocument(plugin: RNotePlugin, newNotePath: string): Promise<boolean> {
    const adapter = plugin.app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) return false;

    const rnotePaths = await checkRNoteSetup(plugin);
    if (!rnotePaths || rnotePaths === "error") return false;

    const absPath = adapter.getBasePath() + "/" + newNotePath;
    return await new Promise<boolean>((resolve) => {
        exec(`${rnotePaths.cli} create "${absPath}"`, (error) => resolve(!error));
    });
}
```

(`rnote-cli create <path>` has existed since 0.13 and writes a 352-byte valid document.)

#### 2. "Update from rnote" exports whatever tab is active

`src/fileMenu.ts`:

```ts
let filePath = plugin.app.workspace.getActiveFile()?.path as string;
filePath = filePath?.replace(".pdf", ".rnote").replace(".svg", ".rnote");
exportRNote(plugin, [filePath]);
```

The menu item belongs to a specific file (`rnoteFile`), but the handler reads the
active tab. With a `.md` open, it asks the CLI to export a markdown file. It also
breaks when the menu is opened from the file explorer without changing tabs.

**Fix:**

```ts
// use the file the menu belongs to, not whatever tab happens to be active
exportRNote(plugin, [rnoteFile.path]);
```

#### 3. Exports run in parallel and report success too early

`src/rnoteExport.ts` used `filePaths.forEach(async (filePath) => { … })`, so
`exportAllRNote()` spawned one `rnote-cli` process per note simultaneously, and
`errors` / `notify` were evaluated before any export finished (the "Exported all
rnote notes successfully" notice always appeared).

**Fix:** sequential `for (const filePath of filePaths)` inside an async IIFE. This
is already applied on `main` — thanks — but the released `1.0.2` still has the
`forEach` version.

#### 4. `npm install` fails on a clean clone (breaks the release workflow)

```
npm error ERESOLVE unable to resolve dependency tree
npm error Found: typescript@4.7.4
npm error Could not resolve dependency: peer typescript@">=4.8.4 <6.1.0" from typescript-eslint@8.72.1
npm error   peer typescript-eslint@"^8.35.1" from eslint-plugin-obsidianmd@0.1.9
```

`.github/workflows/release.yml` runs plain `npm install`, so tagging a release
fails in CI.

**Fix:** add `legacy-peer-deps=true` to `.npmrc` (or pin compatible versions).

### Environment

Obsidian 1.13.7 (Windows 11), RNote 0.14.2, plugin 1.0.2 / `main` @ `a7d904e`.

### Note

On Windows `rnote-cli.exe` is not installed by RNote's official installer
(see the upstream report for `flxzt/rnote`), so the plugin cannot export there
even with the fixes above. A build script for the CLI could be worth shipping in
the README.
````

---

## Cómo enviarlos

```bash
# RNote
gh issue create --repo flxzt/rnote --title "..." --body-file docs/upstream-rnote.md

# Plugin original
gh issue create --repo DarshPareek/obsidian-rnote --title "..." --body-file docs/upstream-plugin.md
```

Si prefieres PR en lugar de issue para el plugin, los cambios están en este fork:
`src/rnoteActions.ts`, `src/fileMenu.ts`, `src/rnoteExport.ts`, `.npmrc`.
