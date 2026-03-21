import { App, Modal, ToggleComponent } from "obsidian";

export default class ConfirmationModal extends Modal {
    onConfirm: () => Promise<void>;
    onReject: () => Promise<void>;
    private initialValue: boolean;
    private toggle: ToggleComponent;
    public confirmed: boolean = false;

    constructor(app: App, onConfirm: () => Promise<void>, onReject: () => Promise<void>, initialValue: boolean, toggle: ToggleComponent) {
        super(app);
        this.onConfirm = onConfirm;
        this.onReject = onReject;
        this.initialValue = initialValue;
        this.toggle = toggle
    }

    onOpen() {
        super.onOpen();
        const { contentEl } = this;

        contentEl.createEl("h2", { text: "Enable auto export?" });
        contentEl.createEl("p", {
            text: "Enabling auto export might automatically overwrite any same-named files; do you want to proceed?",
        });

        const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });

        const confirmButton = buttonContainer.createEl("button", { text: "Yes" });
        confirmButton.addEventListener("click", () => {
            this.confirmed = true;
            void this.onConfirm().then(() => {
                this.close();
            });
        });

        const cancelButton = buttonContainer.createEl("button", { text: "No" });
        cancelButton.addEventListener("click", () => {
            void this.onReject().then(() => {
                this.close();
            });
        });
    }

    onClose() {
        super.onClose();
        const { contentEl } = this;
        contentEl.empty();
    }
}