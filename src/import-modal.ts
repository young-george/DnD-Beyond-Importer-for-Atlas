import {App, Modal} from "obsidian";

export default class ImportModal extends Modal {
    plugin: InstanceType<typeof Plugin> & {
        importCharacter: (url: string) => Promise<void>;
        hpTracking: Map<string, { maxHp: number; currentHp: number; tempHp: number }>;
    };
    private urlValue = "";

    constructor(app: App, plugin: ImportModal["plugin"]) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h2", { text: "Import D&D Beyond Character" });
        contentEl.createEl("p", {
            text: "Paste the character URL or numeric ID. The character must be set to Public on D&D Beyond.",
            cls: "setting-item-description",
        });

        const input = contentEl.createEl("input", {
            type: "text",
            placeholder: "https://www.dndbeyond.com/characters/137202151/…",
            cls: "dndbi-import-input",
        });

        input.addEventListener("input", (e) => {
            this.urlValue = (e.target as HTMLInputElement).value;
        });
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                this.submit().catch((err: unknown) => {
                    console.error("Import failed:", err);
                });
            }
        });

        const btnRow = contentEl.createDiv({ cls: "dndbi-import-btn-row" });

        const cancelBtn = btnRow.createEl("button", { text: "Cancel" });
        cancelBtn.addEventListener("click", () => this.close());

        const importBtn = btnRow.createEl("button", {
            text: "Import",
            cls: "mod-cta",
        });
        importBtn.addEventListener("click", () => {
            this.submit().catch((err: unknown) => {
                console.error("Import failed:", err);
            });
        });

        window.setTimeout(() => input.focus(), 50);
    }

    private async submit() {
        this.close();
        await this.plugin.importCharacter(this.urlValue.trim());
    }

    onClose() {
        this.contentEl.empty();
    }
}