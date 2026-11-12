import {DdbCharacter, DdbModifier, DdbStat, DnDBeyondImporterSettings, Stat, Stats} from "./types";

export default class CharacterSheet {
    
    linkedDescriptions: {name?: string, description?: string}[] = [];
    
    level = this.raw.classes?.reduce((sum, c) => sum + (c.level ?? 0), 0) ?? 0
    
    get allModifiers(): DdbModifier[] {
        
        const isMultiClass = (this.raw.classes?.length ?? 0) > 1;
        const hasBackground = this.raw.background?.definition?.id != null;
        const raceStatIncreasesId = this.raw.options?.race.find(o => o.componentTypeId === 1960452172)?.definition?.entityTypeId;
        
        return [
            ...(this.raw.modifiers?.class ?? []),
            ...(this.raw.modifiers?.race?.filter(m => !(hasBackground && m.componentTypeId === raceStatIncreasesId)) ?? []),
            ...(this.raw.modifiers?.background ?? []),
            ...(this.raw.modifiers?.feat ?? []),
            ...(this.raw.modifiers?.item ?? []),
            ...(this.raw.inventory?.flatMap(item => item.grantedModifiers ?? []) ?? [])
        ].filter(m => {
            if (isMultiClass){
                return m.availableToMulticlass || (this.raw.classes?.[0].definition.classFeatures.some(f => f.id === m.componentId) ?? false);
            }
            return true;
        })
            
    }
    
    get proficiencyBonus(): number {
        return Math.ceil(this.level / 4) + 1;
    }
    
    public stats: Stats;
    
    public statsById: Stat[];

    get spellcastingModifier() {
        const spellcastingAbilityId = this.raw.classes?.find(c => c.definition?.spellCastingAbilityId)?.definition?.spellCastingAbilityId;
        if (!spellcastingAbilityId) return 0;
        return this.statsById[spellcastingAbilityId]?.mod ?? 0;
    }
    
    getSpellcastingModifier(spellcastingAbilityId?: number): number {
        if(!spellcastingAbilityId) return 0;
        return this.statsById[spellcastingAbilityId]?.mod ?? 0;
    }
    
    constructor(public raw: DdbCharacter, private settings: Partial<DnDBeyondImporterSettings> = {}) {
        this.stats = this.computeStats(raw);
        this.statsById = [
            {} as Stat, // 0 index is unused
            this.stats.str,
            this.stats.dex,
            this.stats.con,
            this.stats.int,
            this.stats.wis,
            this.stats.cha
        ];
    }

    private getStatValue(
        stats: DdbStat[],
        overrides: DdbStat[],
        bonuses: DdbStat[],
        id: number
    ): number {
        const base = stats.find((s) => s.id === id)?.value ?? 10;
        const override = overrides.find((s) => s.id === id)?.value;
        if (override != null) return override;
        const bonus = bonuses
            .filter((b) => b.id === id)
            .reduce((acc, b) => acc + (b.value ?? 0), 0);
        return (base ?? 10) + bonus;
    }
    
    private getStatAndModifier(stats: DdbStat[],
                               overrides: DdbStat[],
                               bonuses: DdbStat[],
                               id: number): Stat {
        const score = this.getStatValue(stats, overrides, bonuses, id);
        const mod = Math.floor((score - 10) / 2);
        return { score, mod };
    }
    
    findModifiers(type: string, subType?: string | string[]): DdbModifier[] {
        return this.allModifiers.filter((m) => m.type === type && (subType == null || m.subType === subType || (Array.isArray(subType) && subType.includes(m.subType ?? ''))));
    }
    
    computeStats(char: DdbCharacter): Stats {
        const statSubTypeToId: Record<string, number> = {
            "strength-score": 1, "dexterity-score": 2, "constitution-score": 3,
            "intelligence-score": 4, "wisdom-score": 5, "charisma-score": 6,
        };
        const modifierStatBonuses: DdbStat[] = this.allModifiers
            .filter((m) => m.type === "bonus" && m.subType in statSubTypeToId && m.value != null)
            .map((m) => ({ id: statSubTypeToId[m.subType], value: m.value! }));
        const effectiveBonusStats = [
            ...(char.bonusStats ?? []).filter((s) => s.value != null),
            ...modifierStatBonuses,
        ];
        return {
            str: this.getStatAndModifier(char.stats ?? [], char.overrideStats ?? [], effectiveBonusStats, 1),
            dex: this.getStatAndModifier(char.stats ?? [], char.overrideStats ?? [], effectiveBonusStats, 2),
            con: this.getStatAndModifier(char.stats ?? [], char.overrideStats ?? [], effectiveBonusStats, 3),
            int: this.getStatAndModifier(char.stats ?? [], char.overrideStats ?? [], effectiveBonusStats, 4),
            wis: this.getStatAndModifier(char.stats ?? [], char.overrideStats ?? [], effectiveBonusStats, 5),
            cha: this.getStatAndModifier(char.stats ?? [], char.overrideStats ?? [], effectiveBonusStats, 6),
        };
    }
    
    linkName(name?: string, description?: string): string {
        if (!this.settings.includeDescriptions || !description || description.trim() === '') {
            return name ?? '';
        }
        // return name;
        this.linkedDescriptions.push({name, description});
        return `**[${name}](#${name?.replace(/\s+/g, '%20').replace(':', '') ?? ""})**`;
    }
}