import {AdvState, DdbModifier} from "./types";

export default class Utilities {

    static toModString(mod: number): string {
        return `${mod >= 0 ? "+" : ""}${mod}`;
    }

    static getAdvantageState(allMods: DdbModifier[], subType: string, broadSubType: string): AdvState {
        const hasAdv = allMods.some((m) => m.type === "advantage" && (m.subType === subType || m.subType === broadSubType) && !m.restriction);
        const hasDis = allMods.some((m) => m.type === "disadvantage" && (m.subType === subType || m.subType === broadSubType) && !m.restriction);
        if (hasAdv && hasDis) return "none";
        if (hasAdv) return "advantage";
        if (hasDis) return "disadvantage";
        return "none";
    }

    static formatAdvMarkerMd(advState: AdvState): string {
        return {
            "advantage": "▲A",
            "disadvantage": "▼D",
            "none": ""
        }[advState];
    }
    
    static getOrdinal(n: number): string {
        let ord = 'th';

        if (n % 10 == 1 && n % 100 != 11)
        {
            ord = 'st';
        }
        else if (n % 10 == 2 && n % 100 != 12)
        {
            ord = 'nd';
        }
        else if (n % 10 == 3 && n % 100 != 13)
        {
            ord = 'rd';
        }

        return ord;
    }
}
