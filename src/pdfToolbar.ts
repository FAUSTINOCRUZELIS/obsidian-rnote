import RNotePlugin from "main";
import { MarkdownView, TFile, getLinkpath } from "obsidian";
import { findCorrespondingRNote } from "./rnoteActions";
import { ButtonComponent, App } from 'obsidian';
import { openXournalppFile } from './rnoteActions';

export function addOpenInXournalppToPdfToolbar(file: TFile, plugin: RNotePlugin) {
    if (file && file.extension === "pdf") {
        // reset icon
        const oldIcons = document.querySelectorAll('.rnote-open-icon');
        oldIcons.forEach((old) => old.remove())

        let rnoteFile = findCorrespondingRNote(file.path, plugin)

        if (rnoteFile) {
            // show toolbar icon
            const pdfToolbar = document.querySelector('.pdf-toolbar-right') as HTMLElement;

            if (pdfToolbar) {
                createPdfToolbarButton(pdfToolbar, rnoteFile, plugin)
            }
        }
    }
}


export function createPdfToolbarButton(pdfToolbar: HTMLElement, rnoteFile: TFile, plugin: RNotePlugin): void {
    let rnoteButton = new ButtonComponent(pdfToolbar)
        .setClass("clickable-icon")
        .setClass("rnote-open-icon")
        .setButtonText('Edit in RNote')
        .setIcon('pen-tool')
        .setTooltip('Edit in RNote');

        rnoteButton.onClick(() =>  {
            openXournalppFile(rnoteFile, plugin);
        })

        pdfToolbar.appendChild(rnoteButton.buttonEl);
}