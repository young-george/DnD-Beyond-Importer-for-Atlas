import AbstractRenderer from "./abstract.renderer";
import Utilities from "../utilities";
import {creatureSizes} from "../damageTypes";
import {requestUrl} from "obsidian";


export default class BasicDetailsRenderer extends AbstractRenderer {

    render(): string {
        
        return `
name: ${this.character.raw.name ?? ""}
species: "${this.raceName()}"
class: "${this.classes}"
subclass: "${this.subclasses}"
level: ${this.character.level}
size: ${this.size()}
background: "${this.character.raw.background?.definition?.name ?? ""}"
alignment: "${this.character.raw.alignmentId != null ? this.alignmentName(this.character.raw.alignmentId) : "Unaligned"}"
xp: ${this.character.raw.currentXp ?? 0}
tags: [${this.tags().map((t) => `"${t}"`).join(", ")}]
proficiency_bonus: "${Utilities.toModString(this.character.proficiencyBonus)}"
pb: "${Utilities.toModString(this.character.proficiencyBonus)}"
image: [[${this.character.raw.name ?? "character"}_${this.character.raw.id}.jpg]]
`
// image: ${this.character.raw.decorations?.avatarUrl?.split('?')[0] ?? ""}
    }

    classes = this.character.raw.classes
        ?.map((c) => `${c.definition?.name ?? "Unknown"}`)
        .join(" / ");
    subclasses = this.character.raw.classes
        ?.map((c) => `${c.subclassDefinition?.name ?? "Unknown"}`)
        .join(" / ");
    
    raceName = () => this.character.raw.race?.fullName ?? this.character.raw.race?.baseName ?? "Unknown Race"
    
    size = () => this.character.allModifiers.find(m => m.type === "size")?.friendlySubtypeName ?? creatureSizes.find(s => s.id === this.character.raw.race?.sizeId)?.name ?? "Medium";
    
    alignmentName(id: number): string {
        const map: Record<number, string> = {
            1: "Lawful Good", 2: "Neutral Good", 3: "Chaotic Good",
            4: "Lawful Neutral", 5: "True Neutral", 6: "Chaotic Neutral",
            7: "Lawful Evil", 8: "Neutral Evil", 9: "Chaotic Evil",
        };
        return map[id] ?? "Unaligned";
    }
    
    tags = () => [
        "dnd-character", 
        this.raceName().toLowerCase().replace(/\s+/g, "-"), 
        ...this.character.raw.classes?.map(c => c.definition?.name) ?? []
    ];
    
}
