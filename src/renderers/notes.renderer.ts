import AbstractRenderer from "./abstract.renderer";
import {context} from "esbuild";

export default class NotesRenderer extends AbstractRenderer {
    render(): string {
        const customNotesDivider = '<!-- PUT CUSTOM NOTES BELOW THIS LINE -->'
        const notes: string = this.existingFrontmatter?.["notes_2"] as string ?? "";
        const existingCustomNotes = notes.substring(notes.indexOf(customNotesDivider)).replace(customNotesDivider, '').trim();
        const profIconMap = [null, '◇', '⬖', '◆', '❖'];
        const profValueMap = [null, 0, Math.floor(this.character.proficiencyBonus / 2), this.character.proficiencyBonus, this.character.proficiencyBonus * 2];
        
        const customProficiencies = this.character.raw.customProficiencies?.map(p => {
            const details = `${profIconMap[p.proficiencyLevel]} ${p.name}`;
            if (p.override){
                return `${details} +${p.override}`;
            }
            
            let baseStat = p.statId ? this.character.statsById[p.statId]?.mod ?? 0 : 0;
            const bonus = (p.magicBonus ?? 0) + (p.miscBonus ?? 0);
            const total = baseStat + bonus + ((baseStat && p.proficiencyLevel > 0 ) ? (profValueMap[p.proficiencyLevel] ?? 0) : 0);
            return `${profIconMap[p.proficiencyLevel]} ${p.name} +${total}`;
        }).join("\n") ?? "";
        
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
allies: |-
  ${[this.character.raw.notes?.allies, this.character.raw.notes?.organizations].filter(Boolean).join(', ').replace(/\n/g, "\n  ")}
appearance: ${this.character.raw.traits?.appearance ?? ""}
`;
    }
}