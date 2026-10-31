import { Menu, TFile, TFolder } from "obsidian";
import { deleteRNoteAndLinkedFile, findCorrespondingRNote, openXournalppFile, renameRNoteFile } from "./rnoteActions";
import CreateRNoteModalManager from "./CreateRNoteModalManager";
import RNotePlugin from "main";
import { exportRNote } from "./rnoteExport";
import RenameModal from "./modals/RenameModal";

export function addXournalppOptionsToFileMenu(menu: Menu, file: TFile | TFolder, plugin: RNotePlugin) {
    if (file instanceof TFile) {
        if (file.extension === "rnote") {
            addOpenInXournalppMenu(menu, file, plugin);
            addExportAsSvgMenu(menu, file, plugin);
            addExportAsPdfMenu(menu, file, plugin);
        } else if (file.extension === "pdf" || file.extension === "svg") {
            const rnoteFile = findCorrespondingRNote(file.path, plugin);
            if (rnoteFile) {
                addOpenInXournalppMenu(menu, rnoteFile, plugin);
                if (file.extension === "pdf") {
                    addExportAsSvgMenu(menu, rnoteFile, plugin);
                } else if (file.extension === "svg") {
                    addExportAsPdfMenu(menu, rnoteFile, plugin);
                }
                addXournalppRenameMenu(menu, file, rnoteFile, plugin);
                addXournalppDeleteMenu(menu, file, rnoteFile, plugin);
                removeDeleteRenameMenuItem(file.extension);
            }
        }
    } else if (file instanceof TFolder) {
        if (file?.children) {
            addCreateXournalppMenu(menu, file, plugin);
        }
    }
}

function addOpenInXournalppMenu(menu: Menu, rnoteFile: TFile, plugin: RNotePlugin) {
    menu.addItem((item) => {
        item.setTitle("Open in rnote")
            .setIcon("pen-tool")
            .onClick(() => {
                void openXournalppFile(rnoteFile, plugin);
            });
    });
    menu.addItem((item) => {
        item.setTitle("Update from rnote")
            .setIcon("rotate-cw")
            .onClick(() => {
                // use the file the menu belongs to, not whatever tab happens to be active
                exportRNote(plugin, [rnoteFile.path]);
            });
    });
}

function addExportAsSvgMenu(menu: Menu, rnoteFile: TFile, plugin: RNotePlugin) {
    menu.addItem((item) => {
        item.setTitle("Export as SVG")
            .setIcon("image")
            .onClick(async () => {
                // Save preference so future auto-exports remember it is SVG
                if (!plugin.settings.svgExportFiles) plugin.settings.svgExportFiles = [];
                if (!plugin.settings.svgExportFiles.includes(rnoteFile.path)) {
                    plugin.settings.svgExportFiles.push(rnoteFile.path);
                    await plugin.saveSettings();
                }
                
                exportRNote(plugin, [rnoteFile.path]);
            });
    });
}

function addExportAsPdfMenu(menu: Menu, rnoteFile: TFile, plugin: RNotePlugin) {
    menu.addItem((item) => {
        item.setTitle("Export as PDF")
            .setIcon("file-text")
            .onClick(async () => {
                // Save preference so future auto-exports remember it is PDF
                if (plugin.settings.svgExportFiles) {
                    plugin.settings.svgExportFiles = plugin.settings.svgExportFiles.filter(path => path !== rnoteFile.path);
                    await plugin.saveSettings();
                }
                
                exportRNote(plugin, [rnoteFile.path]);
            });
    });
}

function addCreateXournalppMenu(menu: Menu, folder: TFolder, plugin: RNotePlugin) {
    menu.addItem((item) => {
        item.setTitle("Create new rnote")
            .setIcon("pen-tool")
            .onClick(() => {
                new CreateRNoteModalManager(plugin.app, plugin, folder?.path ?? "");
            });
    });
}

function addXournalppDeleteMenu(menu: Menu, linkedFile: TFile, rnoteFile: TFile, plugin: RNotePlugin) {
    menu.addItem((item) => {
        const ext = linkedFile.extension.toUpperCase();
        item.setTitle(`Delete ${ext} & RNote`)
            .setIcon("trash")
            .setSection("danger")
            .onClick(() => {
                deleteRNoteAndLinkedFile(plugin, rnoteFile, linkedFile);
            });
    });
}

function addXournalppRenameMenu(menu: Menu, linkedFile: TFile, rnoteFile: TFile, plugin: RNotePlugin) {
    menu.addItem((item) => {
        const ext = linkedFile.extension.toUpperCase();
        item.setTitle(`Rename ${ext} & RNote...`)
            .setIcon("pencil")
            .setSection("danger")
            .onClick(() => {
                new RenameModal(plugin.app, rnoteFile.path, renameFile).open();
            });
    });

    const renameFile = (fileName: string) => renameRNoteFile(plugin, rnoteFile, linkedFile, fileName);
}

function removeDeleteRenameMenuItem(ext: string) {
    const body = document.querySelector("body");
    if (!body) return;

    const extUpper = ext.toUpperCase();

    const observer = new MutationObserver(() => {
        const menuItems = body.querySelectorAll(".menu-item");
        if (menuItems.length > 0) {
            let isRNoteMenu = false;

            menuItems.forEach((item) => {
                if (item.textContent && item.textContent == `Delete ${extUpper} & RNote`) {
                    item.classList.add("is-warning");
                    isRNoteMenu = true;
                }
            });

            if (isRNoteMenu) {
                menuItems.forEach((item) => {
                    if (item.textContent && (item.textContent == "Delete" || item.textContent == "Rename..."))
                        item.remove();
                });
            }

            observer.disconnect();
        }
    });

    observer.observe(body, {
        childList: true,
        subtree: true,
    });
}
