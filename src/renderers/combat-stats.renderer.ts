import AbstractRenderer from "./abstract.renderer";
import Utilities from "../utilities";

export default class CombatStatsRenderer extends AbstractRenderer {

    render(): string {
        return `
initiative: "${this.calculateInitiative()}"
ac: ${this.calculateAC()}
speed: ${this.calculateSpeed()}`
    }

    private calculateInitiative(){
        return this.character.stats.dex.mod + (this.character.findModifiers("bonus", "initiative").sum(m => m.value ?? (m.bonusTypes?.[0] == 1 ? this.character.proficiencyBonus : 0)) ?? 0);
    }
    
    private calculateSpeed(){
        const innateWalkingSpeed = this.character.findModifiers("set", "innate-speed-walking")?.[0]?.value ?? this.character.raw.race?.weightSpeeds?.normal?.walk ?? 30;
        return innateWalkingSpeed + (this.character.findModifiers("bonus", ["speed", "unarmored-movement"]).sum(m => m.value) ?? 0);
    }
    
    private calculateAC(): number {
        
        const acOverride = this.character.raw?.characterValues.find(cv => cv.typeId == 1)?.value;

        if (acOverride != null) return acOverride;
        
        let bestAC = this.character.raw.characterValues.find(cv => cv.typeId == 4)?.value ?? (10 + this.character.stats.dex.mod);
        let shieldBonus = 0;
        let wearingArmor = false;

        for (const item of this.character.raw.inventory ?? []) {
            const def = item.definition;
            if (!def || !item.equipped) continue;
            if (def.armorClass) {
                if (def.armorTypeId === 4) {
                    shieldBonus = Math.max(shieldBonus, def.armorClass);
                } else {
                    wearingArmor = true;
                    const addDex = def.armorTypeId !== 3;
                    const maxDex = def.armorTypeId === 2 ? 2 : 999;
                    const ac = def.armorClass + (addDex ? Math.min(this.character.stats.dex.mod, maxDex) : 0) + (this.character.findModifiers("bonus", "armored-armor-class")?.sum(m => m.value ?? 0) ?? 0);
                    if (ac > bestAC) bestAC = ac;
                }
            }
        }
        // Unarmored defense: Barbarian (10+DEX+CON), Monk (10+DEX+WIS).
        // Shields are NOT armor (armorTypeId 4 is tracked separately as shieldBonus), so
        // wearingArmor stays false when only a shield is equipped — allowing unarmored
        // defense to apply. The shield bonus is still added at the end either way.
        if (!wearingArmor) {
            for (const m of this.character.allModifiers ?? []) {
                if (m.subType === "unarmored-defense-constitution")
                    bestAC = Math.max(bestAC, 10 + this.character.stats.dex.mod + this.character.stats.con.mod);
                if (m.subType === "unarmored-defense-wisdom")
                    bestAC = Math.max(bestAC, 10 + this.character.stats.dex.mod + this.character.stats.wis.mod);
                if (m.subType === "unarmored-armor-class" && m.statId){
                    const relevantMod = this.character.statsById[m.statId]?.mod ?? 0;
                    bestAC = Math.max(bestAC, 10 + this.character.stats.dex.mod + relevantMod);
                }
            }
        }
        // Flat AC bonuses: Defense fighting style (+1), feats, magic items, etc.
        for (const m of this.character.allModifiers ?? []) {
            if (m.type === "bonus" && m.subType === "armor-class" && m.value != null)
                bestAC += m.value;
        }

        
        const acOverrideBonuses = this.character.raw.characterValues?.filter(cv => [2, 3].includes(cv.typeId)).map(cv => cv.value ?? 0).reduce((a, b) => a + b, 0);

        return bestAC + shieldBonus + acOverrideBonuses;
    }
    
}