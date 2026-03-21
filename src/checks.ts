import { Notice, Platform } from "obsidian";
import { exec } from 'child_process';
import RNotePlugin from "main";

export interface RNotePaths {
    gui: string;
    cli: string;
}

export async function checkRNoteSetup(plugin: RNotePlugin): Promise<RNotePaths | "error"> {
    const errors = []
    const userPath = plugin.settings.rnotePath;
    const customGui = plugin.settings.customGuiCommand;
    const customCli = plugin.settings.customCliCommand;

    if (customGui && customCli) {
        try {
            await executeCommand(customCli + " --version");
            return { gui: customGui, cli: customCli };
        } catch (error) {
            errors.push("Custom RNote CLI command not working: " + (error as Error).message);
        }
    } else if (customGui || customCli) {
        errors.push("Please provide both custom GUI and CLI commands to override defaults.");
    }

    if (userPath) {
        let userCliPath = userPath;
        if (userCliPath.endsWith("rnote.exe")) {
            userCliPath = userCliPath.replace("rnote.exe", "rnote-cli.exe");
        } else if (userCliPath.endsWith("rnote")) {
            userCliPath = userCliPath + "-cli";
        } else if (userCliPath.endsWith('rnote"')) {
            userCliPath = userCliPath.substring(0, userCliPath.length - 1) + '-cli"';
        }

        try {
            await executeCommand(userCliPath + " --version");
            return { gui: userPath, cli: userCliPath };
        } catch (error) {
            errors.push("User defined RNote path not working: " + error.message)
        }
    }

    const aliasPathGui = "rnote";
    const aliasPathCli = "rnote-cli";

    try {
        await executeCommand(aliasPathCli + " --version");
        return { gui: aliasPathGui, cli: aliasPathCli };
    } catch (error) {
        errors.push((error as Error).message);
    }

    const windowsGuiPath = '"c:/Program Files/RNote/bin/rnote.exe"';
    const windowsCliPath = '"c:/Program Files/RNote/bin/rnote-cli.exe"';
    if (Platform.isWin) {
        try {
            await executeCommand(windowsCliPath + " --version");
            return { gui: windowsGuiPath, cli: windowsCliPath };
        } catch (error) {
            errors.push((error as Error).message);
        }
    }

    const macGuiPath = '"/Applications/RNote.app/Contents/MacOS/rnote"';
    const macCliPath = '"/Applications/RNote.app/Contents/MacOS/rnote-cli"';
    if (Platform.isMacOS) {
        try {
            await executeCommand(macCliPath + " --version");
            return { gui: macGuiPath, cli: macCliPath };
        } catch (error) {
            errors.push((error as Error).message);
        }
    }

    new Notice("Error: rnote path not setup correctly. Please check docs on how to set it up.", 10000);
    errors.forEach(error => console.error("RNote Error:" + error))
    return "error";
}

function executeCommand(command: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        exec(command, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}
