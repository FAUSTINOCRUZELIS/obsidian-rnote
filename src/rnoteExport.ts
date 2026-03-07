import { FileSystemAdapter, Notice, TFile } from "obsidian"
import { exec } from 'child_process';
import RNotePlugin from "main";
import { checkRNoteSetup } from "./checks";

export function exportRNote(plugin: RNotePlugin, filePaths: Array<string>, notify: boolean = true) {
    let errors = false;

    filePaths.forEach(async (filePath: string) => {
        let fs = plugin.app.vault.adapter
        if (fs instanceof FileSystemAdapter) {
            let vaultPath = fs.getBasePath();
            let rnoteFilePath = vaultPath + "/" + filePath;
            
            let rnotePaths = await checkRNoteSetup(plugin);
            if (!rnotePaths || rnotePaths === "error") {
                new Notice("Error: RNote path not setup correctly. Please check docs on how to set it up.", 10000);
                return;
            }
            
            const isSvg = plugin.settings.svgExportFiles?.includes(filePath);

            if (!isSvg) {
                let command = `${rnotePaths.cli} export doc --output-format "pdf" "${rnoteFilePath}" --on-conflict overwrite`;
                exec(command, (error) => {
                    if (error) {
                        console.error(`Error converting RNote to PDF: ${error.message}`);
                        errors = true;
                    }
                });
            } else {
                let command = `${rnotePaths.cli} export doc --output-format "svg" "${rnoteFilePath}" --on-conflict overwrite`;
                exec(command, (error) => {
                    if (error) {
                        console.error(`Error converting RNote to SVG: ${error.message}`);
                        errors = true;
                    }
                });
            }
        }
    })
    
    if (errors) {
        new Notice("Error converting RNote to PDF. Check the console for more information.");
        return
    }
    
    if (notify) new Notice("Exported all RNote notes successfully.")
}

export function exportAllRNote(plugin: RNotePlugin) {
  let files = plugin.app.vault.getFiles();
  files = files.filter((file) => file.extension === "rnote");
  let filePaths = files.map((file) => file.path);
  exportRNote(plugin, filePaths);
}