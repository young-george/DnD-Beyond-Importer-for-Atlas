import template from '../Pips 5e (2024) Character Sheet.json' with { type: "json" };
import {App} from "obsidian";

export default class TemplateManager {

    static async installTemplate(app: App) {
        console.log(`Installing template ${template.id}...`);
        const templates = app.vault.getFolderByPath('atlas-vtt/statblock-templates')?.children;
        
        const templateContents = await Promise.all(templates?.map((file) => app.vault.read(file)) ?? []);
        
        const templateExists = templateContents.some((content) => {
            const templateJson: {id: string}  = JSON.parse(content) as {id: string};
            return templateJson.id == template.id;
        });
        
        if (!templateExists) {
            const templateFile = await app.vault.create('atlas-vtt/statblock-templates/Pips 5e (2024) Character Sheet.atlastemplate', JSON.stringify(template, null, 2));
            console.log(`Template ${templateFile.id} installed successfully.`);
            return;
        }
        console.log(`Template ${template.id} already exists.`);

    }
    
}