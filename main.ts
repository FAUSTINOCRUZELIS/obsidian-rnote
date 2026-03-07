import { Plugin } from 'obsidian';
import { RNoteSettingsTab } from 'src/RNoteSettingsTab';
import { checkRNoteSetup } from 'src/checks';
import { createCommands } from 'src/commands';
import { setupListeners } from 'src/listeners';
import { createRibbonIcons } from 'src/ribbonIcons';

interface RNotePluginSettings {
    autoExport: boolean;
    rnotePath: string;
    templatesFolder: string;
    defaultTemplatePath: string;
    defaultNewFilePath: string;
    defaultNewFileName: string;
    svgExportFiles: string[];
}

const DEFAULT_SETTINGS: Partial<RNotePluginSettings> = {
    autoExport: false,
    rnotePath: "",
    templatesFolder: "",
    defaultTemplatePath: "",
    defaultNewFilePath: "",
    defaultNewFileName: "",
    svgExportFiles: [],
};

export default class RNotePlugin extends Plugin {
    settings: RNotePluginSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new RNoteSettingsTab(this.app, this));
        setupListeners(this);
        createCommands(this);
        createRibbonIcons(this);
        checkRNoteSetup(this);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    
    async saveSettings() {
        await this.saveData(this.settings);
    }    

    onunload() {}
}
