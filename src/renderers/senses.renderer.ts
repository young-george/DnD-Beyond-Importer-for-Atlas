import AbstractRenderer from "./abstract.renderer";
import {senses} from "../damageTypes";

export default class SensesRenderer extends AbstractRenderer {
    render(): string {

        const preceptionProf = this.character.allModifiers.some((m) => m.type === "proficiency" && m.subType === "perception");
        const investigationProf = this.character.allModifiers.some((m) => m.type === "proficiency" && m.subType === "investigation");
        const insightProf = this.character.allModifiers.some((m) => m.type === "proficiency" && m.subType === "insight");

        const perception = this.character.raw.characterValues.find(c => c.typeId == 5)?.value ?? 10 + this.character.stats.wis.mod + (preceptionProf ? this.character.proficiencyBonus : 0) + (this.character.allModifiers?.filter(m => m.type === "bonus" && m.subType === "passive-perception").reduce((sum, m) => sum + (m.value ?? 0), 0) ?? 0);
        const investigation = this.character.raw.characterValues.find(c => c.typeId == 6)?.value ?? 10 + this.character.stats.int.mod + (investigationProf ? this.character.proficiencyBonus : 0) + (this.character.allModifiers?.filter(m => m.type === "bonus" && m.subType === "passive-investigation").reduce((sum, m) => sum + (m.value ?? 0), 0) ?? 0);
        const insight = this.character.raw.characterValues.find(c => c.typeId == 7)?.value ?? 10 + this.character.stats.wis.mod + (insightProf ? this.character.proficiencyBonus : 0) + (this.character.allModifiers?.filter(m => m.type === "bonus" && m.subType === "passive-insight").reduce((sum, m) => sum + (m.value ?? 0), 0) ?? 0);

        const otherSenses = this.character.allModifiers?.filter(m => m.type === "set-base").map(m => ({ senseId: m.entityId, description: `${m.friendlySubtypeName} ${m.value}ft` }));
        const overrides = this.character.raw.customSenses?.filter(s => s.distance != null).map(s => ({ senseId: s.senseId, description: `${senses[s.senseId - 1].name} ${s.distance}ft` }));

        const mapped: string[] = [];
        otherSenses.forEach(sense => mapped[sense.senseId] = sense.description);
        overrides.forEach(sense => mapped[sense.senseId] = sense.description);
            
        const otherSensesString = mapped.filter(s => s != null).join(", ");
            
        return `senses: Passive Perception **${perception}**, Passive Investigation **${investigation}**, Passive Insight **${insight}**, ${otherSensesString}
passive_perception: ${perception}
passive_investigation: ${investigation}
passive_insight: ${insight}
`;
    }
}