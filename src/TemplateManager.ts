import template from '../Pips 5e (2024) Character Sheet.json' with { type: "json" };
import {App} from "obsidian";

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
        
        const templateContents = await Promise.all(templates?.map((file) => app.vault.read(file)) ?? []);
        
        const templateExists = templateContents.some((content) => {
            const templateJson: {id: string}  = JSON.parse(content) as {id: string};
            return templateJson.id == template.id;
        });
        
        if (!templateExists) {
            const templateFile = await app.vault.create('atlas-vtt/statblock-templates/Pips 5e (2024) Character Sheet.atlastemplate', JSON.stringify(template, null, 2));
            return;
        }

    }
    
}