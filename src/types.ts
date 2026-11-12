
export interface Stat {
    score: number;
    mod: number;
}

export interface Stats {
    str: Stat;
    dex: Stat;
    con: Stat;
    int: Stat;
    wis: Stat;
    cha: Stat;
    [key: string]: Stat;
}

export interface ActionUses {
    reset: string;
    used: number;
    maximum: number;
}

export interface CharacterAction {
    uses?: ActionUses;
    displayOrder?: number;
    save?: string;
    name: string;
    isWeaponAttack?: boolean;
    attackBonus: number | null;
    damageDice: string | null;
    damageBonus: number;
    damageType?: string;
    range: string;
    notes?: string;
    isSpell: boolean;
}

// ─── Typed interfaces for D&D Beyond API response ─────────────────────────────

export interface DdbStat {
    id: number;
    value: number | null;
}

export interface DdbDice {
    diceCount: number;
    diceValue: number;
    diceString: string;
}

export interface DdbModifier {
    atHigherLevels: {
        higherLevelDefinitions: {
            level: number;
            dice: DdbDice;
        }[];
    };
    restriction: string;
    description?: string;
    statId?: number;
    bonusTypes?: number[];
    entityId: number;
    type: string;
    subType: string;
    friendlySubtypeName?: string;
    value?: number;
    id?: number;
    dice: DdbDice;
    die: DdbDice;
}

interface DdbModifiers {
    class?: DdbModifier[];
    race?: DdbModifier[];
    background?: DdbModifier[];
    feat?: DdbModifier[];
    item?: DdbModifier[];
    condition?: DdbModifier[];
}

export interface DdbRange { 
    rangeValue?: number; 
    origin?: string 
}

export interface DdbDefinition {
    grantedModifiers: DdbModifier[];
    id?: number;
    definitionKey?: string;
    categoryId?: number;
    name?: string;
    description?: string;
    level?: number;
    school?: string;
    activation?: { activationTime?: number; activationType?: number };
    range?: DdbRange;
    concentration?: boolean;
    armorClass?: number;
    armorTypeId?: number;
    weight?: number;
    requiresAttackRoll?: boolean;
    requiresSavingThrow?: boolean;
    asPartOfWeaponAttack?: boolean;
    modifiers: DdbModifier[];
    saveDcAbilityId: number;
    requiredLevel: number;
    displayOrder: number;
    stealthCheck?: number;
    canCastAtHigherLevel?: boolean;
    duration?: {
        durationType: string;
        durationUnit: string;
        durationInterval: number;
    }
}

export interface DdbSpell {
    definition?: DdbDefinition;
    prepared?: boolean;
    activation?: { 
        activationType?: number;
    };
    spellCastingAbilityId?: number;
    range?: DdbRange;
    upcastLevel?: number;
}

export interface DdbClassSpell {
    spells?: DdbSpell[];
}

export interface DdbInventoryItem {
    grantedModifiers: DdbModifier[];
    definition?: DdbDefinition;
    equipped?: boolean;
    quantity?: number;
}

export interface DdbRacialTrait {
    definition?: DdbDefinition;
}

export interface DdbFeat {
    definition?: DdbDefinition;
}

export interface DdbRace {
    fullName?: string;
    baseName?: string;
    weightSpeeds?: { normal?: { walk?: number } };
    racialTraits?: DdbRacialTrait[];
    sizeId?: number;
}

export interface DdbClassFeature {
    definition?: DdbDefinition;
    levelScale?: { dice: DdbDice };
    indent?: boolean;
}

export interface DdbClassDefinition {
    hitDice?: string;
    name?: string;
    spellCastingAbilityId?: number;
    spellRules?: {
        levelSpellSlots: Record<number, DdbSpellSlot[]>;
    };
}

export interface DdbClass {
    hitDiceUsed?: number;
    subclassDefinition: DdbClass;
    classFeatures: DdbClassFeature[];
    level?: number;
    name?: string;
    definition?: DdbClassDefinition;
    stats?: DdbStat[];
    overrideStats?: DdbStat[];
    bonusStats?: DdbStat[];
    modifiers?: DdbModifiers;
}

export interface DdbBackground {
    definition?: { name?: string };
}

export interface DdbTraits {
    personalityTraits?: string;
    ideals?: string;
    bonds?: string;
    flaws?: string;
    appearance?: string;
}

export interface DdbNotes {
    backstory?: string;
    personalityTraits?: string;
    allies?: string;
    enemies?: string;
    organizations?: string;
    otherNotes?: string;
}

export interface DdbSpellSlot {
    level?: number;
    used?: number;
    max?: number;
}

export interface DdbCurrencies {
    cp?: number;
    sp?: number;
    ep?: number;
    gp?: number;
    pp?: number;
}

export interface CharacterValue {
    valueId: string;
    typeId: number;
    value: number;
}

export interface DdbAction {
    componentId: number;
    name: string;
    description: string;
    isSpell?: boolean;
    activation?: { activationType?: number };
}

export interface DdbCampaign {
    id: number;
    
}

export interface DdbCharacter {
    options: { class?: {
        definition: DdbDefinition;
        componentId: number
        }[] };
    hair: string;
    skin: string;
    eyes: string;
    weight: string;
    height: string;
    age: number;
    customProficiencies: {
        miscBonus?: number;
        magicBonus?: number;
        statId: number;
        override: boolean;
        name: string;
        proficiencyLevel: number;
    }[];
    customSenses: {
        senseId: number;
        distance: number;
        
        
    }[];
    customDefenseAdjustments?: {
        adjustmentId: number;
        
    }[];
    optionalClassFeatures: {
        classFeatureId: number;
    }[];
    actions?: Record<string, DdbAction[]>;
    characterValues: CharacterValue[];
    id: number;
    name?: string;
    avatarUrl?: string;
    currentXp?: number;
    alignmentId?: number;
    baseHitPoints?: number;
    bonusHitPoints?: number;
    overrideHitPoints?: number;
    removedHitPoints?: number;
    temporaryHitPoints?: number;
    race?: DdbRace;
    classes?: DdbClass[];
    stats?: DdbStat[];
    overrideStats?: DdbStat[];
    bonusStats?: DdbStat[];
    modifiers?: DdbModifiers;
    background?: DdbBackground;
    inventory?: DdbInventoryItem[];
    feats?: DdbFeat[];
    traits?: DdbTraits;
    currencies?: DdbCurrencies;
    classSpells?: DdbClassSpell[];
    spells?: Record<string, DdbSpell[]>;
    spellSlots?: DdbSpellSlot[];
    notes?: DdbNotes;
    decorations?: { avatarUrl?: string };
    campaign: DdbCampaign;
}

export interface DdbApiResponse {
    data?: DdbCharacter;
}

export interface DnDBeyondImporterSettings {
    importSkillValues: boolean;
    imageOutputFolder: string;
    includeDescriptions: boolean;
    importOnStartup: boolean;
    importWhenOpening: boolean;
    embedDndBeyond: boolean;
    outputFolder: string;
}

export const DEFAULT_SETTINGS: DnDBeyondImporterSettings = {
    outputFolder: "Characters",
    imageOutputFolder: "",
    importSkillValues: true,
    includeDescriptions: true,
    importOnStartup: true,
    importWhenOpening: true,
    embedDndBeyond: true,
};

// Advantage/disadvantage on a saving throw or skill check. Checks both the
// specific subType (e.g. "perception") and the broad subType D&D Beyond uses
// for blanket grants (e.g. "saving-throws" / "ability-checks"). Per 5e rules,
// if a creature has both advantage and disadvantage on the same roll they
// cancel out, so that case resolves to "none" — same as having neither.
// Every roll always resolves to one of the three states; nothing is ever
// "no status" — it's an explicit import of what D&D Beyond reports.
export type AdvState = "advantage" | "disadvantage" | "none";

export interface PartyInventory {
    data: {
        partyItems: {
            definition: DdbDefinition;
            quantity: number;
            equippedEntityId: number;
            grantedModifiers: DdbModifier[];
        }[];
    };
}