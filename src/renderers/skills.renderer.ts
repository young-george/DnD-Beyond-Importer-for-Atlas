import AbstractRenderer from "./abstract.renderer";
import Utilities from "../utilities";

export default class SkillsRenderer extends AbstractRenderer {
    
    render(): string {
        const skillDefs = [
            { name: "Acrobatics", stat: "dex", key: "acrobatics" },
            { name: "Animal Handling", stat: "wis", key: "animal-handling", fieldOverride: 'animal_handling' },
            { name: "Arcana", stat: "int", key: "arcana" },
            { name: "Athletics", stat: "str", key: "athletics" },
            { name: "Deception", stat: "cha", key: "deception" },
            { name: "History", stat: "int", key: "history" },
            { name: "Insight", stat: "wis", key: "insight" },
            { name: "Intimidation", stat: "cha", key: "intimidation" },
            { name: "Investigation", stat: "int", key: "investigation" },
            { name: "Medicine", stat: "wis", key: "medicine" },
            { name: "Nature", stat: "int", key: "nature" },
            { name: "Perception", stat: "wis", key: "perception" },
            { name: "Performance", stat: "cha", key: "performance" },
            { name: "Persuasion", stat: "cha", key: "persuasion" },
            { name: "Religion", stat: "int", key: "religion" },
            { name: "Sleight of Hand", stat: "dex", key: "sleight-of-hand", fieldOverride: 'sleight_of_hand' },
            { name: "Stealth", stat: "dex", key: "stealth" },
            { name: "Survival", stat: "wis", key: "survival" },
        ];

        const statKeys: Record<string, string> = {
            'str': 'strength-ability-checks',
            'dex': 'dexterity-ability-checks',
            'con': 'constitution-ability-checks',
            'int': 'intelligence-ability-checks',
            'wis': 'wisdom-ability-checks',
            'cha': 'charisma-ability-checks'
        }
        
        const expertises = [];
        const profs = [];
        const halfProfs = [];

        let md = '';
        for (const skill of skillDefs) {
            const base = this.character.stats[skill.stat]?.mod;
            const expertise = this.character.allModifiers.some(
                (m) => m.type === "expertise" && m.subType === skill.key
            );
            const prof = this.character.allModifiers.some(
                (m) => m.type === "proficiency" && m.subType === skill.key
            );
            const halfProf = this.character.allModifiers.some(
                (m) => m.type === "half-proficiency" && [skill.key, 'ability-checks'].includes(m.subType) && !prof
            );

            if (expertise){
                expertises.push(skill);
            } else if (prof) {
                profs.push(skill);
            } else if (halfProf) {
                halfProfs.push(skill);
            }

            let bonus = base;
            if (expertise) bonus += this.character.proficiencyBonus * 2;
            else if (prof) bonus += this.character.proficiencyBonus;
            else if (halfProf) bonus += Math.floor(this.character.proficiencyBonus / 2);

            const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`;
            
            const armorDisadvantage = skill.key === "stealth" && this.character.raw.inventory?.some(i => i.equipped && i.definition?.stealthCheck == 2);
            
            const removeDisadvantage = this.character.findModifiers(`${skill.key}-disadvantage`, 'remove').length > 0;
            
            const advStates = [
                Utilities.getAdvantageState(this.character.allModifiers, skill.key, "ability-checks"), 
                Utilities.getAdvantageState(this.character.allModifiers, statKeys[skill.stat], "ability-checks"),
                armorDisadvantage ? "disadvantage" : "none",
            ].filter(a => a != 'none' && (removeDisadvantage ? a != 'disadvantage' : true));
            
            const advState = advStates.length === 0 ? "none" : advStates.every((state) => state === "advantage") ? "advantage" : advStates.every((state) => state === "disadvantage") ? "disadvantage" : "none";
            const advMarker = Utilities.formatAdvMarkerMd(advState);
            
            if (this.pluginSettings.importSkillValues){
                md += `${skill.fieldOverride ?? skill.key}_override: "${advMarker} ${bonusStr}"\n`;
            }
        }
        
        md += expertises.map(prof => `${prof.fieldOverride ?? prof.key}_prof: ❖`).join("\n") + "\n";
        md += profs.map(prof => `${prof.fieldOverride ?? prof.key}_prof: ◆`).join("\n") + "\n";
        md += halfProfs.map(prof => `${prof.fieldOverride ?? prof.key}_prof: ⬖`).join("\n") + "\n";

        return md;
    }
    
}