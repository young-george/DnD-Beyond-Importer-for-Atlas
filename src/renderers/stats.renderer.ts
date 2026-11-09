import AbstractRenderer from "./abstract.renderer";
import Utilities from "../utilities";
import {statKeys} from "../damageTypes";

export default class StatsRenderer extends AbstractRenderer {

    render(): string {
        const stats = this.character.stats;
        return `
stats:
  - ${stats.str.score}
  - ${stats.dex.score}
  - ${stats.con.score}
  - ${stats.int.score}
  - ${stats.wis.score}
  - ${stats.cha.score}
${this.renderSavingThrows()}`
    }
    
    private renderSavingThrows(): string {

        const cells = statKeys.map(({ key, subType }) => {
            
            const base = this.character.stats[key].mod;
            const isProficient = this.character.allModifiers.some(
                (m) => m.type === "proficiency" && m.subType === subType
            );

            
            const otherBonuses = this.character.allModifiers.filter(m => m.type === "bonus" && m.subType === 'saving-throws');
            const bonusTotal = otherBonuses.reduce((sum, m) => sum + (m.value || this.character.stats[key].mod || 0), 0);
            
            const total = (isProficient ? base + this.character.proficiencyBonus : base) + bonusTotal;
            const str = total >= 0 ? `+${total}` : `${total}`;
            const advState = Utilities.getAdvantageState(this.character.allModifiers, subType, "saving-throws");
            const advMarker = Utilities.formatAdvMarkerMd(advState);
            return `- ${key}: "${advMarker} ${str}"`;
        });

        return `saves:\n${cells.join("\n")}\n`;
    }
}