import AbstractRenderer from "./abstract.renderer";
import {context} from "esbuild";

export default class NotesRenderer extends AbstractRenderer {
    render(): string {
        const customNotesDivider = '<!-- PUT CUSTOM NOTES BELOW THIS LINE -->'
        const notes: string = this.existingFrontmatter?.["notes_2"] as string ?? "";
        const existingCustomNotes = notes.substring(notes.indexOf(customNotesDivider)).replace(customNotesDivider, '').trim();
        const profIconMap = [null,  '⬖', '◆', '❖'];
        const profValueMap = [null, Math.floor(this.character.proficiencyBonus / 2), this.character.proficiencyBonus, this.character.proficiencyBonus * 2];
        
        const customProficiencies = this.character.raw.customProficiencies?.map(p => `${profIconMap[p.proficiencyLevel]} ${p.name} +${profValueMap[p.proficiencyLevel]}`).join("\n") ?? "";
        
        const md = `
${this.character.raw.notes?.otherNotes ?? ""}
${customProficiencies}
${customNotesDivider}
${existingCustomNotes}`
        
        return `notes_2: |-
${md.replace(/\n/g, "\n  ")}
age: ${this.character.raw.age ?? ""}
height: ${this.character.raw.height ?? ""}
weight: ${this.character.raw.weight ?? ""}
eyes: ${this.character.raw.eyes ?? ""}
skin: ${this.character.raw.skin ?? ""}
hair: ${this.character.raw.hair ?? ""}
personality: |-
  ${(this.character.raw.traits?.personalityTraits ?? "").replace(/\n/g, "\n  ")}"
allies: ${[this.character.raw.notes?.allies, this.character.raw.notes?.organizations].filter(Boolean).join(', ')}
appearance: ${this.character.raw.traits?.appearance ?? ""}
`;
    }
}