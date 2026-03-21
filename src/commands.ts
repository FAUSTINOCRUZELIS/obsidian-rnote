import { Editor, TFile } from "obsidian";
import { deleteRNoteAndLinkedFile, findCorrespondingRNote, openXournalppFile, renameRNoteFile } from "./rnoteActions";
import RNotePlugin from "main";
import { exportAllRNote, exportRNote } from "./rnoteExport";
import CreateRNoteModalManager from "./CreateRNoteModalManager";
import RenameModal from "./modals/RenameModal";
import SearchRNoteModal from "./modals/SearchRNoteModal";

export function createCommands(plugin: RNotePlugin) {
    plugin.addCommand({
        id: "open",
        name: "Open current note",
        checkCallback: (checking: boolean) => {
            const filePath = plugin.app.workspace.getActiveFile()?.path;
            const fileExtension = plugin.app.workspace.getActiveFile()?.extension;
            if (!filePath || (fileExtension !== "pdf" && fileExtension !== "svg" && fileExtension !== "rnote")) return false;

            const rnoteFile = fileExtension === "rnote" ? plugin.app.workspace.getActiveFile() : findCorrespondingRNote(filePath, plugin);
            if (!rnoteFile) return false;

            if (!checking) void openXournalppFile(rnoteFile, plugin);
            return true;
        },
    });

    plugin.addCommand({
        id: "create-new",
        name: "Create a new note",
        callback: () => {
            new CreateRNoteModalManager(plugin.app, plugin, "");
        },
    });

    plugin.addCommand({
        id: "create-new-and-link",
        name: "Create a new note and insert link",
        editorCallback: (editor: Editor) => {
            new CreateRNoteModalManager(plugin.app, plugin, "", editor);
        },
    });

    plugin.addCommand({
        id: "export-all",
        name: "Export all notes",
        callback: () => {
            exportAllRNote(plugin);
        },
    });

    plugin.addCommand({
        id: "export-current",
        name: "Update current export",
        checkCallback: (checking: boolean) => {
            let filePath = plugin.app.workspace.getActiveFile()?.path as string;

            if (filePath && (filePath.includes(".pdf") || filePath.includes(".svg") || filePath.includes(".rnote"))) {
                if (!checking) {
                    filePath = filePath?.replace(".pdf", ".rnote").replace(".svg", ".rnote");
                    exportRNote(plugin, [filePath]);
                }
                return true;
            }
            return false;
        },
    });

    plugin.addCommand({
        id: "rename",
        name: "Rename current export and corresponding note",
        checkCallback: (checking: boolean) => {
            const file = plugin.app.workspace.getActiveFile();
            if (!file || (!file.name.endsWith(".pdf") && !file.name.endsWith(".svg"))) return false;

            const rnoteFile = findCorrespondingRNote(file.path, plugin);
            if (!rnoteFile) return false;

            if (!checking) {
                const renameFile = (fileName: string) => {
                    if (rnoteFile instanceof TFile && file instanceof TFile) {
                        void renameRNoteFile(plugin, rnoteFile, file, fileName);
                    }
                };
                new RenameModal(plugin.app, rnoteFile.path, renameFile).open();
            }
            return true;
        },
    });

    plugin.addCommand({
        id: "delete",
        name: "Delete current export and corresponding note",
        checkCallback: (checking: boolean) => {
            const file = plugin.app.workspace.getActiveFile();
            if (!file || (!file.name.endsWith(".pdf") && !file.name.endsWith(".svg"))) return false;

            const rnoteFile = findCorrespondingRNote(file.path, plugin);
            if (!rnoteFile) return false;

            if (!checking) {
                deleteRNoteAndLinkedFile(plugin, rnoteFile, file);
            }
            return true;
        },
    });

    plugin.addCommand({
        id: "search-and-open",
        name: "Search and open note",
        callback: () => {
            const searchModal = new SearchRNoteModal(plugin.app, plugin);
            searchModal.setPlaceholder("Search for a RNote note");
            searchModal.setInstructions([
                { command: "Arrows", purpose: "to navigate" },
                { command: "Tab", purpose: "to autocomplete" },
                { command: "Enter", purpose: "to open the corresponding PDF" },
                { command: "Shift + Enter", purpose: "to open in RNote" },
            ]);
            searchModal.open();
        },
    });
}
