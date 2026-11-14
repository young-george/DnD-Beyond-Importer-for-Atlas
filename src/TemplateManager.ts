import template from '../5e (2024) Character Sheet.json' with { type: "json" };
import {App, Modal, Notice, Setting, TAbstractFile, TFile} from "obsidian";
import {timingSafeEqual} from "node:crypto";

export default class TemplateManager {

    static async installTemplate(app: App) {
        
        const folder = 'atlas-vtt/statblock-templates';
        
        if (folder && !app.vault.getAbstractFileByPath(folder)) {
            try {
                await app.vault.createFolder(folder);
            } catch {
                /* folder already exists (race with another note); safe to ignore */
            }
        }        
        const templates = app.vault.getFolderByPath('atlas-vtt/statblock-templates')?.children;
        
        const templateContents = await Promise.all(templates?.map(async (file) => ({...file, content: await app.vault.read(file)})) ?? []);
        
        const existingTemplate = templateContents.find((templateFile) => {
            try {
                const templateJson: { id: string } = JSON.parse(templateFile.content) as { id: string };
                return templateJson.id == template.id;
            } catch (e) {
                return false;
            }
        });
        
        if (!existingTemplate) {
            await app.vault.create('atlas-vtt/statblock-templates/5e (2024) Character Sheet.atlastemplate', JSON.stringify(template, null, 2));
            return;
        }
        
        if (existingTemplate && existingTemplate.content !== JSON.stringify(template, null, 2)) {
            new UpdateTemplateModal(app, existingTemplate).open();
        }

    }
    
}

class UpdateTemplateModal extends Modal {
    constructor(app: App, private existingTemplate: TAbstractFile) {
        super(app);
        this.setTitle("5e (2024) Character Sheet template out of date");
        this.setContent("The 5e (2024) Character Sheet template is out of date. Do you want to update it?");

        new Setting(this.contentEl)
            .addButton((btn) => {
                btn.setButtonText("Cancel")
                    .onClick(async () => {
                        this.close();
                    });
            })
            .addButton((btn) => {
                btn.setButtonText("Update")
                    .setCta()
                    .onClick(async () => {
                        await app.vault.modify(existingTemplate as TFile, JSON.stringify(template, null, 2));
                        new Notice("5e (2024) Character Sheet template updated.", 5000);
                        this.close();
                    });
            })
            
    }
}