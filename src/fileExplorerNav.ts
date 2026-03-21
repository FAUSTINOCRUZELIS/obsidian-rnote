import RNotePlugin from "main";
import { ButtonComponent } from "obsidian";
import CreateRNoteModalManager from "./CreateRNoteModalManager";

export function addCreateXournalppNavIcon(plugin: RNotePlugin) {
    let fileExplorers = plugin.app.workspace.getLeavesOfType("file-explorer");

    fileExplorers.forEach((fileExplorer) => {
        const fileExplorerView = fileExplorer.view as unknown as { headerDom?: { navButtonsEl?: HTMLElement } };
        const headerDom = fileExplorerView?.headerDom;
        const navButtonsEl = headerDom?.navButtonsEl;

        if (navButtonsEl && navButtonsEl.children.length > 2 && !navButtonsEl.querySelector(".rnote-create-icon")) {
            let createRNoteButton = new ButtonComponent(navButtonsEl as HTMLElement)
                .setClass("clickable-icon")
                .setClass("rnote-create-icon")
                .setIcon("pen-tool")
                .setTooltip("Create new RNote");

            createRNoteButton.onClick(() => {
                new CreateRNoteModalManager(plugin.app, plugin);
            });

            navButtonsEl.insertAfter(createRNoteButton.buttonEl, navButtonsEl.children[1]);
        }
    });
}
