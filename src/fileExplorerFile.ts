import RNotePlugin from "main";
import { findCorrespondingRNote, openXournalppFile } from "./rnoteActions";
import { TFile } from "obsidian";

export function addOpenInXournalpp(plugin: RNotePlugin) {
    plugin.app.workspace.onLayoutReady(() => {
        observeFileExplorer(plugin); // Start observing once the layout is ready
        applyXournalppTags(plugin); // Apply the tags initially
    });
}

function observeFileExplorer(plugin: RNotePlugin) {
    let fileExplorers = plugin.app.workspace.getLeavesOfType("file-explorer");

    fileExplorers.forEach((fileExplorer) => {
        let container = (fileExplorer.view as { containerEl?: HTMLElement })?.containerEl;

        if (container) {
            // Observe changes in the file explorer DOM
            const observer = new MutationObserver(() => {
                applyXournalppTags(plugin); // Reapply tags whenever there's a DOM change
            });

            // Observe changes to child elements (subtree and childList options)
            observer.observe(container, { childList: true, subtree: true });
        }
    });
}

function applyXournalppTags(plugin: RNotePlugin) {
    let fileExplorers = plugin.app.workspace.getLeavesOfType("file-explorer");

    fileExplorers.forEach((fileExplorer) => {
        let allFiles: { [key: string]: { tagEl: HTMLElement } } = (fileExplorer.view as unknown as { fileItems: { [key: string]: { tagEl: HTMLElement } } })?.fileItems;
        if (!allFiles) return;

        Object.entries(allFiles).forEach(([filePath, value]) => {
            if (filePath.endsWith(".pdf") || filePath.endsWith(".svg")) {
                let rnoteFile = findCorrespondingRNote(filePath, plugin);
                if (rnoteFile instanceof TFile && value?.tagEl) {
                    const tagEl = value.tagEl as HTMLElement;

                    if (tagEl && (tagEl.innerText != "RNOTE" || !tagEl.classList.contains("clickable-tag"))) {
                        tagEl.innerText = "RNOTE";
                        tagEl.classList.add("clickable-tag");
                        tagEl.onclick = () => {
                            void openXournalppFile(rnoteFile, plugin);
                        };
                    }
                }
            }
        });
    });
}
