import RNotePlugin from "main";
import { TFile, Notice, FileSystemAdapter } from "obsidian";
import { checkRNoteSetup } from "./checks";
import { exec } from "child_process";

export async function openXournalppFile(rnoteFile: TFile, plugin: RNotePlugin): Promise<void> {
    const rnotePaths = await checkRNoteSetup(plugin);

    const fs = plugin.app.vault.adapter;
    if (fs instanceof FileSystemAdapter) {
        const vaultPath = fs.getBasePath();

        if (!rnotePaths || rnotePaths === "error") {
            new Notice("Error: RNote path not setup correctly. Please check docs on how to set it up.", 10000);
            return;
        }

        const command = `${rnotePaths.gui} "${vaultPath + "/" + rnoteFile.path}"`;
        new Notice("Opening file in RNote");
        exec(command, (error) => {
            if (error) {
                new Notice("Error opening file in RNote. Check console for error message.");
                console.error(`Error opening file in RNote: ${error.message}`);
                return;
            }
        });
    } else {
        new Notice("Error opening file in RNote. Check console for error message.");
    }
}

export async function createRNoteFile(plugin: RNotePlugin, newNoteName: string, selectedTemplatePath?: string) {
    const newNotePath = newNoteName.startsWith("/") ? newNoteName.slice(1) : newNoteName;

    const fs = plugin.app.vault.adapter;

    try {
        const templatePath = selectedTemplatePath || plugin.settings.defaultTemplatePath;
        if (templatePath && await fs.exists(templatePath)) {
            await fs.copy(templatePath, newNotePath);
        } else {
            await plugin.app.vault.create(newNotePath, "");
        }
        new Notice("RNote note created");
    } catch (e) {
        new Notice("Error: Could not create a RNote note: " + e.message);
    }
}

export function findCorrespondingRNote(filePath: string, plugin: RNotePlugin): TFile | undefined {
    let rnoteFilePath = filePath;
    if (filePath.endsWith(".pdf")) rnoteFilePath = filePath.replace(".pdf", ".rnote");
    else if (filePath.endsWith(".svg")) rnoteFilePath = filePath.replace(".svg", ".rnote");
    else return undefined;
    
    const rnoteFilename = rnoteFilePath.substring(rnoteFilePath.lastIndexOf("/") + 1);
    const linkedFile = plugin.app.vault.getFileByPath(filePath);

    // set parent folder or root vault folder
    const parentFolder = linkedFile?.parent ?? plugin.app.vault.getFolderByPath("/");
    const rnoteFile = parentFolder?.children.find((child) => child.name === rnoteFilename);

    if (rnoteFile instanceof TFile) return rnoteFile;
}


export function renameRNoteFile(plugin: RNotePlugin, rnoteFile: TFile, linkedFile: TFile, fileName: string) {
    const filePath = rnoteFile.path.split("/");
    filePath.pop();
    const newPath = filePath?.join("/") + "/" + fileName;
    void plugin.app.fileManager.renameFile(rnoteFile, newPath + ".rnote");
    const ext = linkedFile.extension;
    void plugin.app.fileManager.renameFile(linkedFile, newPath + "." + ext);
}

export function deleteRNoteAndLinkedFile(plugin: RNotePlugin, rnoteFile: TFile, linkedFile: TFile) {
    void plugin.app.fileManager.trashFile(rnoteFile);
    void plugin.app.fileManager.trashFile(linkedFile);
}
