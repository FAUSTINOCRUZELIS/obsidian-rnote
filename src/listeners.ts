import RNotePlugin from "main";
import { addXournalppOptionsToFileMenu } from "./fileMenu";
import { Menu, TFile, TFolder } from "obsidian";
import { addOpenInXournalppToPdfToolbar } from "./pdfToolbar";
import { addCreateXournalppNavIcon } from "./fileExplorerNav";
import { addOpenInXournalpp } from "./fileExplorerFile";
import { exportRNote } from "./rnoteExport";

export function setupListeners(plugin: RNotePlugin) {

    // on startup
    plugin.registerEvent(plugin.app.workspace.on("layout-change", () => {
        addCreateXournalppNavIcon(plugin);
        addOpenInXournalpp(plugin);
    }));
    
    plugin.registerEvent(plugin.app.workspace.on("file-open", (file: TFile) => {
        addOpenInXournalppToPdfToolbar(file, plugin);
    }));
    plugin.registerEvent(plugin.app.workspace.on("file-menu", (menu: Menu, file: TFile|TFolder) => {
        addXournalppOptionsToFileMenu(menu, file, plugin);
    }));
    plugin.registerEvent(plugin.app.workspace.on("active-leaf-change", (leaf) => {
        if (leaf?.getDisplayText() === "Files") {
            addCreateXournalppNavIcon(plugin);
            addOpenInXournalpp(plugin);
        }
    }));

    plugin.registerEvent(plugin.app.vault.on("modify", (file: TFile) => {
        if (file.extension === "rnote" && plugin.settings.autoExport) exportRNote(plugin, [file.path], false)
    }))
    plugin.app.workspace.onLayoutReady(() => {
        initialLoad(plugin);
        plugin.registerEvent(plugin.app.vault.on("create", (file: TFile) => {
            if (file.extension === "rnote" && plugin.settings.autoExport) exportRNote(plugin, [file.path], false)
        }))
    });
}

function initialLoad(plugin: RNotePlugin) {
    if (plugin.settings.autoExport) {
        const files = plugin.app.vault.getFiles();
        const rnote_files = files.filter(file => file.extension === "rnote");
        const pdf_files = files.filter(file => file.extension === "pdf");

        const filePaths = [];
        for (const rnote_file of rnote_files) {
                const pdf_file = pdf_files.find(pdf => pdf.path === rnote_file.path.replace(".rnote", ".pdf")) || false;
                let rnote_is_newer = false;
                if (pdf_file) {
                    rnote_is_newer = rnote_file.stat.mtime > pdf_file.stat.mtime;
                }
                // Add the file path to the list if PDF doesn't exist or RNOTE is newer
                if (!pdf_file || rnote_is_newer) {
                    filePaths.push(rnote_file.path);
                }
        }
        
        if (filePaths.length > 0) {
            exportRNote(plugin, filePaths, false);
        }
    }
    
    addCreateXournalppNavIcon(plugin);
    addOpenInXournalpp(plugin);

}
