import RNotePlugin from "main";
import CreateRNoteModalManager from "./CreateRNoteModalManager";

export function createRibbonIcons(plugin: RNotePlugin) {
    plugin.addRibbonIcon("pen-tool", "Create new rnote note", (evt: MouseEvent) => {
        new CreateRNoteModalManager(plugin.app, plugin);
    });
}
