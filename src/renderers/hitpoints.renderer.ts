import AbstractRenderer from "./abstract.renderer";

export default class HitpointsRenderer extends AbstractRenderer {

    render(): string {
        const hp = this.calcHP();
        return `
hp: ${hp.max}
hp_current: ${hp.current}
hp_temp: ${hp.temp}
${this.renderHitDice()}`
    }

    calcHP(): { max: number; current: number; temp: number } {
        const base = this.character.raw.baseHitPoints ?? 0;
        const bonus = this.character.raw.bonusHitPoints ?? 0;
        const override = this.character.raw.overrideHitPoints;
        const removedHp = this.character.raw.removedHitPoints ?? 0;
        const temp = this.character.raw.temporaryHitPoints ?? 0;
        const conMod = this.character.stats.con.mod;
        // Per-level HP bonuses (Tough feat +2/level, Dwarven Toughness +1/level, etc.)
        const hpPerLevel = this.character.allModifiers
            .filter((m) => m.type === "bonus" && m.subType === "hit-points-per-level" && m.value != null)
            .reduce((sum, m) => sum + (m.value ?? 0), 0);
        // Flat HP bonuses
        const flatHp = this.character.allModifiers
            .filter((m) => m.type === "bonus" && m.subType === "hit-points" && m.value != null)
            .reduce((sum, m) => sum + (m.value ?? 0), 0);
        // If the user has manually overridden HP in D&D Beyond we use that value as-is.
        // This intentionally skips Con-mod scaling, Tough/Dwarven Toughness bonuses, and
        // flatHp — the override is the user's explicit total, not a base to add on top of.
        const max = override != null ? override : base + bonus + conMod * this.character.level + hpPerLevel * this.character.level + flatHp;
        return { max, current: max - removedHp, temp };
    }

    renderHitDice(): string {
        const dicePools = this.character.raw?.classes?.map(c => ({
            name: `${c.definition?.name} (d${c.definition?.hitDice})`,
            max: c.level,
            used: c.hitDiceUsed,
            formula: `${c.level}d${c.definition?.hitDice}`,
        })) ?? [];

        return `
hit_dice: "${dicePools.map(d => d.formula).join(", ")}"
hit_dice_spent: ${dicePools.sum(d => d.used ?? 0)}
hit_dice_pool:
  - name: "Hit Dice (d8)"
    max: 0
${dicePools.map(pool => `  - name: "${pool.name}"\n    max: ${pool.max}\n    used: ${pool.used}`).join("\n")}
`
    }
}