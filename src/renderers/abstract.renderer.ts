import CharacterSheet from "../character-sheet";
import {DnDBeyondImporterSettings} from "../types";

export class RendererRegistration {
}

export default abstract class AbstractRenderer {
    
    character: CharacterSheet;
    pluginSettings: Partial<DnDBeyondImporterSettings>
    existingFrontmatter?: Record<string, unknown>

    constructor(character: CharacterSheet, pluginSettings: Partial<DnDBeyondImporterSettings>, existingFrontmatter?: Record<string, unknown>) {
        this.character = character;
        this.pluginSettings = pluginSettings;
        this.existingFrontmatter = existingFrontmatter;
    }
    
    abstract render(): string;
    
}