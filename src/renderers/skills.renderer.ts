import AbstractRenderer from "./abstract.renderer";
import Utilities from "../utilities";

export default class SkillsRenderer extends AbstractRenderer {
    
    render(): string {
        const skillDefs = [
            { name: "Acrobatics", stat: "dex", key: "acrobatics", ddbId: "3"},
            { name: "Animal Handling", stat: "wis", key: "animal-handling", fieldOverride: 'animal_handling', ddbId: "11" },
            { name: "Arcana", stat: "int", key: "arcana", ddbId: "6" },
            { name: "Athletics", stat: "str", key: "athletics", ddbId: "2" },
            { name: "Deception", stat: "cha", key: "deception", ddbId: "16" },
            { name: "History", stat: "int", key: "history", ddbId: "7" },
            { name: "Insight", stat: "wis", key: "insight", ddbId: "12" },
            { name: "Intimidation", stat: "cha", key: "intimidation", ddbId: "17" },
            { name: "Investigation", stat: "int", key: "investigation", ddbId: "8" },
            { name: "Medicine", stat: "wis", key: "medicine", ddbId: "13" },
            { name: "Nature", stat: "int", key: "nature", ddbId: "9" },
            { name: "Perception", stat: "wis", key: "perception", ddbId: "14" },
            { name: "Performance", stat: "cha", key: "performance", ddbId: "18" },
            { name: "Persuasion", stat: "cha", key: "persuasion", ddbId: "19" },
            { name: "Religion", stat: "int", key: "religion", ddbId: "10" },
            { name: "Sleight of Hand", stat: "dex", key: "sleight-of-hand", fieldOverride: 'sleight_of_hand', ddbId: "4" },
            { name: "Stealth", stat: "dex", key: "stealth", ddbId: "5" },
            { name: "Survival", stat: "wis", key: "survival", ddbId: "15" },
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
            
            const overrideBaseStat = this.character.raw.characterValues?.find(cv => cv.typeId == 27 && cv.valueId == skill.ddbId)?.value;
            
            const base = overrideBaseStat ? this.character.statsById[overrideBaseStat]?.mod : this.character.stats[skill.stat]?.mod;
            
            const customProf = this.character.raw.characterValues?.find(cv => cv.typeId == 26 && cv.valueId == skill.ddbId)?.value;
            
            const expertise = customProf != 1 && this.character.allModifiers.some(
                (m) => m.type === "expertise" && m.subType === skill.key
            ) || customProf == 4;
            const prof = customProf != 1 && this.character.allModifiers.some(
                (m) => m.type === "proficiency" && m.subType === skill.key
            ) || customProf == 3;
            const halfProf = customProf != 1 && this.character.allModifiers.some(
                (m) => m.type === "half-proficiency" && [skill.key, 'ability-checks'].includes(m.subType) && !prof
            ) || customProf == 2;

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

            bonus += this.character.raw.characterValues?.filter(cv => (cv.typeId == 24 || cv.typeId == 25) && cv.valueId == skill.ddbId).sum(cv => cv.value ?? 0) ?? 0;
            
            let bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`;
            
            const modOverride = this.character.raw.characterValues?.find(cv => cv.typeId == 23 && cv.valueId == skill.ddbId);
            if (modOverride) {
                bonusStr = Utilities.toModString(modOverride.value);
            }
            
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