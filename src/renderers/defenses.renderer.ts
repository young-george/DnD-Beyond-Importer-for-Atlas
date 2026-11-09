import AbstractRenderer from "./abstract.renderer";
import {damageAdjustments} from "../damageTypes";

export default class DefensesRenderer extends AbstractRenderer {

    render(): string {

        const overrides = this.character.raw.customDefenseAdjustments?.map(adj => {
            const damageAdjustment = damageAdjustments.find(da => da.id == adj.adjustmentId);
            if(!damageAdjustment) return null;

            return {
                friendlySubtypeName: damageAdjustment?.name,
                type: damageAdjustment?.type
            }
        }) ?? [];

        const resistances = [...this.character.allModifiers.filter(m => m.type === "resistance"), ...overrides.filter(o => o?.type === 1)];
        const immunities = [...this.character.allModifiers.filter(m => m.type === "immunity"), ...overrides.filter(o => o?.type === 2)];
        const vulnerabilities = [...this.character.allModifiers.filter(m => m.type === "vulnerability"), ...overrides.filter(o => o?.type === 3)];
        
        return `
damage_resistances: ${resistances.map(r => r?.friendlySubtypeName).join(", ") || "None"}
damage_immunities: ${immunities.map(i => i?.friendlySubtypeName).join(", ") || "None"}
damage_vulnerabilities: ${vulnerabilities.map(v => v?.friendlySubtypeName).join(", ") || "None"}
	`;

    }
    
}