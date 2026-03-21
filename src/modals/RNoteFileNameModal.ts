import {
	App,
	ButtonComponent,
	Editor,
	Modal,
	TextComponent,
	DropdownComponent,
} from "obsidian";
import parseFileName from "./../fileNameParser";
import RNotePlugin from "main";

export default class RNoteFileNameModal extends Modal {
  plugin: RNotePlugin;
	editor: Editor | null;
	createFile: (fileName: string, templatePath: string, exportFormat: string) => void;
	createAndOpenFile: (fileName: string, templatePath: string, exportFormat: string) => void;
	templates: { path: string; name: string }[];
	defaultTemplatePath?: string;

	constructor(
		app: App,
    plugin: RNotePlugin,
		createFile: (fileName: string, templatePath: string, exportFormat: string) => void,
		createAndOpenFile: (fileName: string, templatePath: string, exportFormat: string) => void,
		templates: { path: string; name: string }[],
		defaultTemplatePath?: string
	) {
		super(app);
    this.plugin = plugin;
		this.createFile = createFile;
		this.createAndOpenFile = createAndOpenFile;
		this.templates = templates;
		this.defaultTemplatePath = defaultTemplatePath;
	}

	onOpen() {
		const { contentEl } = this;

		const container = contentEl.createDiv({
			cls: "new-rnote-file-modal-form",
		});

    let fileName: string = this.plugin.settings.defaultNewFileName;
    const parsed = parseFileName(fileName, this.plugin);
    fileName = parsed.text;
    let selectedTemplatePath = "";
	let selectedExportFormat = "pdf";

		const defaultTemplateName = this.defaultTemplatePath
			? this.defaultTemplatePath.split("/").pop()?.replace(".rnote", "")
			: undefined;

		const defaultTemplateLabel = defaultTemplateName
			? ` (Default: ${defaultTemplateName})`
			: " (Default template)";

		container.createEl("label", {
			text: `Select a template:`,
		});

		const dropdown = new DropdownComponent(container)
			.addOption("", defaultTemplateLabel)
			.onChange((value) => {
				selectedTemplatePath = value;
			});

		this.templates.forEach((t) => dropdown.addOption(t.path, t.name));

		dropdown.setValue("");
		selectedTemplatePath = "";

		container.createEl("label", {
			text: `Export format:`,
		});

		new DropdownComponent(container)
			.addOption("pdf", "PDF")
			.addOption("svg", "SVG")
			.setValue(selectedExportFormat)
			.onChange((value) => {
				selectedExportFormat = value;
			});

        container.createEl("label", {
			text: `Enter a file name:`,
		});

		const textComponent = new TextComponent(container)
			.setPlaceholder("My_note")
			.onChange((i) => {
				fileName = i;
			});
    
    textComponent.setValue(fileName);

    // Using a timeout to ensure the focus is set after the modal is fully rendered.
		setTimeout(() => textComponent.inputEl.focus(), 0);

    // set cursor position
    if (parsed.cursorIndex !== undefined) {
        textComponent.inputEl.setSelectionRange(parsed.cursorIndex, parsed.cursorIndex);
    }
    
		textComponent.inputEl.addEventListener("keypress", (e) => {
			if (e.key === "Enter") {
				if (e.shiftKey) {
					this.createAndOpenFile(fileName, selectedTemplatePath, selectedExportFormat);
					this.close();
				} else {
					this.createFile(fileName, selectedTemplatePath, selectedExportFormat);
					this.close();
				}
			}
		});

		const buttonRow = container.createDiv({ cls: "button-row" });

		new ButtonComponent(buttonRow)
			.setButtonText("Create")
			.setTooltip("Enter")
			.onClick(() => {
				this.createFile(fileName, selectedTemplatePath, selectedExportFormat);
				this.close();
			});

		new ButtonComponent(buttonRow)
			.setButtonText("Create & open")
			.setTooltip("Shift + Enter")
			.onClick(() => {
				this.createAndOpenFile(fileName, selectedTemplatePath, selectedExportFormat);
				this.close();
			});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
