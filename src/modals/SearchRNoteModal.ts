import RNotePlugin from "main";
import { App, FuzzySuggestModal, Notice, TFile } from "obsidian";
import { openXournalppFile } from "src/rnoteActions";

export default class SearchRNoteModal extends FuzzySuggestModal<TFile> {
    plugin: RNotePlugin;

    constructor(app: App, plugin: RNotePlugin) {
        super(app);
        this.plugin = plugin;
    }

    getItems(): TFile[] {
        let files: TFile[] = [];

        const filePaths = new Set<string>();

        this.app.vault.getAllLoadedFiles().forEach((file) => {
            if (file instanceof TFile && file.extension === "rnote") {
                const normalizedPath = file.path.startsWith("/") ? file.path.slice(1) : file.path;
                if (!filePaths.has(normalizedPath)) {
                    files.push(file);
                    filePaths.add(normalizedPath);
                }
            }
        });

        return files;
    }

    getItemText(file: TFile): string {
        return file.path;
    }

    onOpen(): void {
        super.onOpen();

        this.inputEl.addEventListener("keydown", (event) => {
            if (event.key === "Tab") {
                event.preventDefault();
                let selectedElement = this.modalEl.getElementsByClassName("is-selected").item(0);
                let selected = selectedElement ? selectedElement.textContent : "";

                this.inputEl.value = selected || "";

                this.inputEl.dispatchEvent(new Event("input"));
            }
            if (event.key === "Enter") {
                event.preventDefault();
                if (event.shiftKey) {
                    this.selectActiveSuggestion(event);
                } else if (event.ctrlKey || event.metaKey) {
                    this.selectActiveSuggestion(event);
                }
            }
        });
    }

    onChooseItem(file: TFile, event: MouseEvent | KeyboardEvent): void {
        if (event.shiftKey) {
            void openXournalppFile(file, this.plugin);
            this.close();
        } else {
            const pdfFilePath = file.path.replace(".rnote", ".pdf");
            const pdfFile = this.plugin.app.vault.getFileByPath(pdfFilePath);
            if (!pdfFile) {
                new Notice("No corresponding PDF file found.");
                return;
            }

            void this.plugin.app.workspace
                .getLeaf(event.ctrlKey || event.metaKey ? "split" : undefined, "vertical")
                .openFile(pdfFile);
            this.close();
        }
    }
}
