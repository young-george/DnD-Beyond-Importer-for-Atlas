import AbstractRenderer from "./abstract.renderer";
// @ts-ignore
import pkg from '../../manifest.json' with { type: 'json' };

export default class FrontmatterRenderer extends AbstractRenderer {
    
    render(): string {
        return `
cssClasses: ["dnd-beyond-imported-character"]
obsidianUIMode: preview
atlas-template: "${this.existingFrontmatter?.["atlas-template"] ?? "5e-2024-character-sheet-4r8tqz"}"
statblock: true
importer_version: ${pkg.version}
dndbeyond_id: ${this.character.raw.id}`
    }
    
}
    