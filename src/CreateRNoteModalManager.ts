import { App, Editor, Notice, TFile } from "obsidian";
import { createRNoteFile, openXournalppFile } from "./rnoteActions";
import RNotePlugin from "main";
import RNoteFileNameModal from "./modals/RNoteFileNameModal";
import FolderSuggestModal from "./modals/FolderSuggestModal";

export default class CreateRNoteModalManager {
    app: App;
    plugin: RNotePlugin;
    filePath: string;
    editor: Editor | null;
    linksToInsert: string;
    openAfterCreate = false;

    constructor(
        app: App,
        plugin: RNotePlugin,
        filePath = "",
        editor: Editor | null = null,
        linksToInsert = ""
    ) {
        this.app = app;
        this.plugin = plugin;
        this.filePath = filePath;
        this.editor = editor;
        this.linksToInsert = linksToInsert;

        this.createModals();
    }

    createModals() {
        const templatesFolder = this.plugin.settings.templatesFolder?.trim();
        let templates: { path: string; name: string }[] = [];

        if (templatesFolder) {
            const templateFiles = this.app.vault
                .getFiles()
                .filter((f: TFile) => f.path.startsWith(templatesFolder + "/") && f.extension === "rnote");

            templates = templateFiles.map((file) => ({ path: file.path, name: file.name.replace(/\.rnote$/, "") }));
        }

        const onCloseFolderModal = (folderPath: string) =>
            new RNoteFileNameModal(
                this.plugin.app,
                this.plugin,
                (fileName, templatePath, exportFormat) => { this.onCreate(folderPath, fileName, exportFormat, templatePath); },
                (fileName, templatePath, exportFormat) => { this.onCreateAndOpen(folderPath, fileName, exportFormat, templatePath); },
                templates,
                this.plugin.settings.defaultTemplatePath
            )
                .setTitle("Create a new RNote note")
                .open();

        const folderSuggestModal = new FolderSuggestModal(this.app, this.plugin, onCloseFolderModal);
        folderSuggestModal.setPlaceholder("Select a folder for the new RNote note");
        folderSuggestModal.setInstructions([
            { command: "Arrows", purpose: "to navigate" },
            { command: "Tab", purpose: "to autocomplete folder" },
            { command: "Enter", purpose: "to select folder" },
        ]);

        if (this.filePath == "") {
            folderSuggestModal.open();
        } else {
            onCloseFolderModal(this.filePath);
        }
    }

    async onCreate(folderPath: string, fileName: string, exportFormat: string, templatePath?: string) {
        fileName += ".rnote";

        const newNotePath = folderPath === "/" ? fileName : `${folderPath}/${fileName}`;
        
        const selectedTemplatePath =
            templatePath && templatePath.length > 0
                ? templatePath
                : this.plugin.settings.defaultTemplatePath || undefined;

        await createRNoteFile(this.plugin, newNotePath, selectedTemplatePath);

        if (exportFormat === "svg") {
            if (!this.plugin.settings.svgExportFiles) this.plugin.settings.svgExportFiles = [];
            if (!this.plugin.settings.svgExportFiles.includes(newNotePath)) {
                this.plugin.settings.svgExportFiles.push(newNotePath);
                await this.plugin.saveSettings();
            }
        }

        if (this.editor instanceof Editor) {
            this.insertLink(this.editor, folderPath, fileName, exportFormat);
        }
    }

    async onCreateAndOpen(folderPath: string, fileName: string, exportFormat: string, templatePath?: string) {
        await this.onCreate(folderPath, fileName, exportFormat, templatePath);
        const filePath = folderPath === "/" ? fileName : `${folderPath}/${fileName}`;
        const file = await this.waitForFileToBeIndexed(filePath + ".rnote");
        if (file) {
            await openXournalppFile(file, this.plugin);
        } else {
            console.error("Failed to open the file after creation.");
            new Notice("Failed to open the file after creation.");
        }
    }

    insertLink(editor: Editor, filePath: string, fileName: string, exportFormat: string) {
        if (filePath !== "/") filePath = filePath + "/";

        fileName = fileName.replace(".rnote", "");

        const rnoteLink = "[[" + filePath + fileName + ".rnote" + "|" + fileName + "]]";
        const pdfLink = `![[${filePath}${fileName}.pdf|${fileName}]]`;
        const svgLink = `![[${filePath}${fileName}.svg|${fileName}]]`;
        
        let finalLink = rnoteLink;
        
        if (exportFormat === "pdf") {
            finalLink = pdfLink;
        } else if (exportFormat === "svg") {
            finalLink = svgLink;
        }

        editor.replaceRange(finalLink, editor.getCursor());
    }

    async waitForFileToBeIndexed(path: string, timeout = 5000): Promise<TFile | null> {
        const interval = 100;
        const maxAttempts = timeout / interval;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const file = this.plugin.app.vault.getFileByPath(path);
            if (file) return file;
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
        return null;
    }
}
