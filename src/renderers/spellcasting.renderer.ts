import AbstractRenderer from "./abstract.renderer";
import Utilities from "../utilities";
import {DdbSpell} from "../types";
import {statKeys} from "../damageTypes";

export default class SpellcastingRenderer extends AbstractRenderer {
 
    render(): string {
        return `${this.renderSpellcastingDetails()}
${this.renderSpellSlots()}
${this.renderSpells()}`;
    }

    renderSpellcastingDetails(): string {
        const spellcastingAbility = this.character.raw.classes?.[0].definition?.spellCastingAbilityId;

        if (!spellcastingAbility) return "";
        
        const spellcastingModifier = this.character.spellcastingModifier;
        
        const spellAttackBonus = spellcastingModifier + this.character.proficiencyBonus + (this.character.allModifiers.filter(mod => mod.type === "bonus" && mod.subType === "spell-attacks")?.sum(m => m.value ?? 0) ?? 0);
        const spellSaveDc = 8 + this.character.proficiencyBonus + spellcastingModifier + (this.character.allModifiers.filter(mod => mod.type === "bonus" && mod.subType === "spell-save-dc")?.sum(m => m.value ?? 0) ?? 0);

        return `
spellcasting_ability: "${statKeys[spellcastingAbility - 1].label}"
spell_save_dc: ${spellSaveDc}
spell_attack_bonus: ${spellAttackBonus >= 0 ? `+${spellAttackBonus}` : `${spellAttackBonus}`}
`
    }

    renderSpellSlots(): string {
        const slots = this.character.raw.classes?.[0].definition?.spellRules?.levelSpellSlots[this.character.raw.classes?.[0].level ?? 0];
        if (!slots || !this.character.spellcastingModifier) return "";

        const slotDetails = slots.map((s, i) => ({
            name: `${i + 1}${Utilities.getOrdinal(i + 1)} Level`,
            max: s,
            used: this.character.raw.spellSlots?.[i]?.used ?? 0
        }));

        return `slots:\n${slotDetails.map((s) => `- name: ${s.name}\n  max: ${s.max}\n  used: ${s.used}`).join("\n")}\n`;
    }

    renderSpells(): string {
        let allSpells: DdbSpell[] = [];

        if (Array.isArray(this.character.raw.classSpells)) {
            for (const cs of this.character.raw.classSpells) {
                for (const spell of cs.spells ?? []) allSpells.push(spell);
            }
        }

        for (const src of ["race", "background", "feat", "class", "item"]) {
            for (const spell of this.character.raw.spells?.[src] ?? []) allSpells.push(spell);
        }

        if (!allSpells.length) return "";

        allSpells = allSpells.toSorted((a, b) => a.definition?.name?.localeCompare(b.definition?.name ?? "") ?? 0);
        
        const spellTabNames = ['spellcasting', 'tab_2', 'tab_3', 'tab_4', 'tab_5', 'tab_6', 'tab_7', 'tab_8', 'tab_9', 'tab_10'];

        const byLevel: Map<number, DdbSpell[]> = new Map();
        for (const spell of allSpells) {
            const lvl = spell.definition?.level ?? 0;
            if (!byLevel.has(lvl)) byLevel.set(lvl, []);
            byLevel.get(lvl)!.push(spell);
        }

        const durations: Record<string, (duration: {durationUnit: string, durationInterval: number}) => string> = {
            "Time": ({durationUnit, durationInterval}) => `Up to ${durationInterval} ${durationUnit.toLowerCase()}${durationInterval > 1 ? 's' : ''}`,
            "Instantaneous": () => `Instantaneous`,
            "Concentration": ({durationUnit, durationInterval}) => `Concentration, up to ${durationInterval} ${durationUnit.toLowerCase()}${durationInterval > 1 ? 's' : ''}`,
            undefined: () => `Unknown`,
            "None": () => `Unknown`,
        }

        return [...byLevel.entries()].map(([lvl, spells]) => {
            return `${spellTabNames[lvl]}:\n${spells.map(spell => `- name: "${this.character.linkName(spell.definition?.name, spell.definition?.description)}" 
  range: ${spell.definition?.range?.rangeValue ? `${spell.definition?.range?.rangeValue} ft` : spell.definition?.range?.origin}
  duration: ${durations[spell.definition?.duration?.durationType ?? "None"](spell.definition?.duration!)}`).join("\n")}`
        }).join('\n');
    }

}