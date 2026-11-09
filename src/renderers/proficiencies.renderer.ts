import AbstractRenderer from "./abstract.renderer";
import {allTools} from "../damageTypes";
import {DdbModifier} from "../types";

export default class ProficienciesRenderer extends AbstractRenderer {

    render() {
        return `${this.renderProficiencies()}\n${this.buildWeaponMastery()}`;
    }

    renderProficiencies(): string {

        const collect = (filterFn: (m: DdbModifier) => boolean): string[] =>
            [
                ...new Set(
                    this.character.allModifiers
                        .filter(filterFn)
                        .map((m) => m.friendlySubtypeName ?? m.subType)
                        .filter(Boolean)
                ),
            ] as string[];

        const languages = collect((m) => m.type === "language");
        const armors = collect(
            (m) => m.type === "proficiency" && (m.subType ?? "").includes("armor")
        );
        const weapons = collect(
            (m) => m.type === "proficiency" && (m.subType ?? "").includes("weapon")
        );
        const tools = collect(
            (m) => m.type === "proficiency" && allTools.includes(m.subType ?? "")
        ).toSorted((a, b) => a.localeCompare(b));

        let md = '';
        if (languages.length) md += `languages: ${languages.join(", ")}\n`;
        if (armors.length) md += `armor_training: ${armors.join(", ")}\n`;
        if (weapons.length) md += `weapon_proficiencies: ${weapons.join(", ")}\n`;
        if (tools.length) md += `tool_proficiencies: ${tools.join(", ")}`;

        return md;
    }

    buildWeaponMastery(): string {
        const mods = this.character.allModifiers.filter(m => m.type == "weapon-mastery" && !m.friendlySubtypeName?.includes(","));

        return `weapon_mastery:
${mods.map(m => `  - name: "${this.character.linkName(m.friendlySubtypeName ?? "", m.description ?? "")}"`).join("\n")}
`;
    }


}
    