import AbstractRenderer from "./abstract.renderer";
import {CharacterAction, DdbAction, DdbDefinition, DdbDice, DdbSpell} from "../types";
import {statKeys} from "../damageTypes";

const optionalClassFeatureIds = [
    12373767,
    12654574,
    12373777,
    12373823,
    12373822,
    12373821,
    12373816,
    13185703,
    12373811,
    12373810,
    12373807
]

export default class ActionsRenderer extends AbstractRenderer {

    render(): string {

        const actionsObj = this.extractActions();
        
        function formatUses(uses: { reset: string; used: number, maximum: number} | undefined): string {
            if (!uses) return "";
            const checkboxes = Array.from({ length: uses.maximum }, (_, index) => `<input class='action-use' type='checkbox' ${index < uses.used ? 'checked':''}/>`).join("");
            return `Uses: ${checkboxes}/ ${uses.reset}`;
        }
        
        function formatAttackDetails(a: CharacterAction): string {
            const atkStr = a.attackBonus != null
                ? (a.attackBonus >= 0 ? `+${a.attackBonus}` : `${a.attackBonus}`)
                : "";
            const dmgStr = a.damageDice
                ? `${a.damageDice}${a.damageBonus !== 0 ? (a.damageBonus >= 0 ? `+${a.damageBonus}` : `${a.damageBonus}`) : ""}`
                : (a.damageBonus !== 0 ? `${a.damageBonus}` : "");
            
            const hitSave = a.save ? a.save : atkStr;

            return `- name: "${a.name}"\n  range: "${a.range}"\n  attack: "${hitSave}"\n  damage: "${dmgStr}"\n  type: "${a.damageType}"\n  desc: "${a.notes ?? ''} ${formatUses(a.uses)}"\n`;
        }

        let md = `actions:\n`;
        for (const a of actionsObj.actions.toSorted((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))) {
            const attackDetails = formatAttackDetails(a);
            md += attackDetails;
        }
        if (actionsObj.bonusActions.length) {
            md += `bonus_actions:\n`;
            for (const a of actionsObj.bonusActions) {
                const attackDetails = formatAttackDetails(a);
                md += attackDetails;
            }
            md += "\n";
        }
        if (actionsObj.reactions.length) {
            md += `reactions:\n`;
            for (const a of actionsObj.reactions) {
                const attackDetails = formatAttackDetails(a);
                md += attackDetails;
            }
            md += "\n";
        }
        if (actionsObj.other.length) {
            md += `otheractions:\n`;
            for (const a of actionsObj.other) {
                const attackDetails = formatAttackDetails(a);
                md += attackDetails;
            }
            md += "\n";
        }
        return md;
    }
    
    extractActions(): { actions: CharacterAction[]; bonusActions: CharacterAction[]; reactions: CharacterAction[]; other: CharacterAction[] } {
        
        const weaponAttacks = this.extractWeaponAttacks();
        const spellAttacks = this.extractSpellAttacks();
        const otherActions = this.extractOtherActions();
        const customActions = this.extractCustomActions();
        
        return {
            actions: [...weaponAttacks[0], ...spellAttacks[0], ...otherActions[0], ...customActions[0]],
            bonusActions: [...weaponAttacks[3], ...spellAttacks[3], ...otherActions[3], ...customActions[3]],
            reactions: [...weaponAttacks[4], ...spellAttacks[4], ...otherActions[4], ...customActions[4]],
            other: [...weaponAttacks[8], ...spellAttacks[8], ...otherActions[8], ...customActions[8]],
        }
    }

    private extractWeaponAttacks() {
        const responses = this.getActionResponse();

        for (const item of this.character.raw.inventory ?? []) {
            const def = item.definition as (DdbDefinition & {
                weaponBehaviors?: Array<{
                    attackType?: number;
                    damage?: { diceString?: string; fixedValue?: number };
                    properties?: Array<{ name?: string }>
                }>;
                isMonkWeapon?: boolean;
                weaponTypeRange?: number;
                range: number;
                longRange?: number;
                categoryId?: number;
                damage?: { diceString?: string; fixedValue?: number };
                properties?: Array<{ name?: string }>;
                damageType?: string;
            });
            if (!def || !item.equipped) continue;

            // Accept categoryId 1 (standard weapons) or items that have weaponBehaviors (custom/magic weapons)
            const hasWeaponBehaviors = Array.isArray(def.weaponBehaviors) && def.weaponBehaviors.length > 0;
            if (def.categoryId !== 1 && def.categoryId !== 2 && !hasWeaponBehaviors) continue;
            const propNames = (def.properties ?? []).map((p) => p.name ?? "").filter(Boolean);

            const isFinesse = def.properties?.some((p) => p.name === "Finesse") ?? false;

            const isRanged = def.properties?.some((p) => p.name === "Range") ?? false;
            const atkMod = isRanged ? 
                this.character.stats.dex.mod :
                (isFinesse ? Math.max(this.character.stats.str.mod, this.character.stats.dex.mod) : this.character.stats.str.mod);
            
            let isProficient = this.character.allModifiers.find(mod => mod.type === "proficiency" && mod.entityId == item.definition?.categoryId && mod.subType.includes('weapon')) != null;
            isProficient = isProficient || this.character.raw.characterValues?.find(cv => cv.typeId === 33 && cv.valueId === item.definition?.id?.toString()) != null;
            
            const attackBonus = ([
                [true, atkMod],
                [isProficient, this.character.proficiencyBonus],
                [isRanged, this.character.allModifiers.filter(mod => mod.type === "bonus" && mod.subType === "ranged-weapon-attacks").sum(m => m.value ?? 0)],
            ] as [boolean, number][]).filter(([condition, _]) => condition).sum(([_, value]) => value ?? 0);
            
            // Only use damage dice if explicitly defined on the item — homebrew items with no
            // damage field (e.g. utility weapons) are ATK-only and show no DMG roll.
            const dmgDice: string | null = def.damage?.diceString ?? null;
            const fixedVal: number | null = def.damage?.fixedValue ?? null;
            
            const dmgBonus = ([
                [true, dmgDice != null || fixedVal != null ? atkMod + (fixedVal ?? 0) : 0], 
                [!isRanged, this.character.findModifiers("damage", "one-handed-melee-attacks").sum(v => v.value ?? 0)],
                [propNames.map(n => n.toLowerCase()).includes('thrown'), this.character.findModifiers("damage", "thrown-weapon-attacks").sum(v => v.value ?? 0)],
            ] as [boolean, number][]).filter(([condition]) => condition).sum(([, value]) => value ?? 0);
            
            // Build range string — prefer explicit rangeValue, then properties, then defaults
            const rangeVal = `${def.range} ft ${def.longRange && def.longRange != def.range ? `(${def.longRange} ft)`.trim() : ""}`;

            responses[0].push({
                name: def.name ?? "Unknown Weapon",
                isWeaponAttack: true,
                attackBonus,
                damageDice: dmgDice,
                damageBonus: dmgBonus,
                damageType: def.damageType ?? "",
                range: rangeVal,
                notes: propNames.join(", "),
                isSpell: false,
                // uses: this.getUses(item),
            });
        }

        // Unarmed strike always present
        const unarmedModifier = Math.max(this.character.stats.str.mod, this.character.raw.classes?.some(c => c.definition?.name === "Monk") ? this.character.stats.dex.mod : 0);

        const unarmedDamageDie: {
            diceValue: number; 
            unarmedBaseDamage?: number;
            diceString: string
        } = [
            ...this.character.findModifiers("set", "unarmed-damage-die"),
            ...(this.character.raw.classes?.flatMap(c => c.classFeatures?.map(cf => cf)).filter(m => m.definition?.definitionKey == 'class-feature:10292256').map(m => m.levelScale) ?? [])
        ].reduce((max, mod) => {
            if ((mod?.dice?.diceValue ?? 0) > max.diceValue) return mod!.dice as DdbDice & {unarmedBaseDamage: number};
            return max;
        }, ({diceValue: 0, unarmedBaseDamage: 1, diceString: ''}));
        
        const unarmedDmg = (unarmedDamageDie.unarmedBaseDamage ?? 0) + unarmedModifier;
        if (unarmedDmg > 0) {
            responses[0].push({
                name: "Unarmed Strike",
                attackBonus: unarmedModifier + this.character.proficiencyBonus,
                isWeaponAttack: true,
                damageDice: unarmedDamageDie.diceString ?? null,
                damageBonus: unarmedDmg,
                range: "5 ft",
                damageType: "Bludgeoning",
                notes: "",
                isSpell: false,
                // uses: this.getUses(action),
            });
        }

        return responses.map(response => response.toSorted((a, b) => a.name.localeCompare(b.name)));
    }


    private extractSpellAttacks() {
        
        const responses = this.getActionResponse();
        
        for (const action of [...(this.character.raw.spells?.class ?? []), ...this.character.raw.spells?.feat ?? [], ...this.character.raw.classSpells?.flatMap(cs => cs.spells?.map(s => ({...s, characterClassId: cs.characterClassId})) ?? []) ?? []]) {
            
            if (!action.definition?.requiresAttackRoll || action.definition?.requiresSavingThrow || action.definition?.asPartOfWeaponAttack) {
                if (action.activation?.activationType != 3) continue;
            }
            
            const spellcastingAbilityId = action.spellCastingAbilityId ?? this.character.raw.classes?.find(c => c.id == action.characterClassId)?.definition?.spellCastingAbilityId;
            
            const spellAttackBonus = spellcastingAbilityId ?
                (this.character.getSpellcastingModifier(spellcastingAbilityId) +
                this.character.proficiencyBonus +
                (this.character.allModifiers.find(mod => mod.type === "bonus" && mod.subType === "spell-attacks")?.value ?? 0))
                : null;
            
            const spellSaveDc = 8 + this.character.proficiencyBonus + this.character.getSpellcastingModifier(action.spellCastingAbilityId) + (this.character.allModifiers.filter(mod => mod.type === "bonus" && mod.subType === "spell-save-dc")?.sum(m => m.value ?? 0) ?? 0);
            
            const damages = action.definition?.modifiers?.filter(mod => mod.type === "damage") ?? [];
            const damageBonuses = this.character.allModifiers.filter(mod => mod.subType === "bonus-damage" && mod.friendlyTypeName === action.definition?.name)?.sum(m => (m.statId ? this.character.statsById[m.statId].mod : m.value) ?? 0) ?? 0;
            
            const builtAction = {
                name: this.character.linkName(action.definition?.name, action.definition?.description),
                isWeaponAttack: !!action.definition?.saveDcAbilityId || !!action.spellCastingAbilityId,
                attackBonus: action.activation?.activationType === 1 ? spellAttackBonus : null,
                save: action.definition?.saveDcAbilityId ? `DC${spellSaveDc} ${statKeys[action.definition?.saveDcAbilityId - 1]?.label}` : undefined,
                spellSaveDc,
                damageDice: damages.map(d => d.die.diceString?.replace(' + ', '+')).join(" + ") || null,
                damageBonus: damageBonuses,
                range: action.range?.rangeValue ? `${action.range?.rangeValue} ft` : (action.range?.origin ?? ''),
                damageType: damages.map(d => d.friendlySubtypeName).join(", ") || null,
                notes: ``,
                isSpell: true,
                uses: this.getUses(action),
            };

            responses[action.activation?.activationType ?? 0]?.push(builtAction);
        }

        responses[3] = responses[3]?.length > 0 ? [{name: 'Spells', range: '', damageDice: '', damageType: '', damageBonus: 0, notes: responses[3].map(a => a.name).join(", ")} as CharacterAction] : [];
        
        return responses.map(response => response.toSorted((a, b) => a.name.localeCompare(b.name)));

    }

    private extractOtherActions() {

        const responses = this.getActionResponse();
        
        for (const action of [...(this.character.raw.actions?.class ?? []), ...(this.character.raw.actions?.feat ?? []), ...(this.character.raw.actions?.race ?? []), ...(this.character.raw.actions?.background ?? [])]) {
            // skip optional class features that aren't enabled, like circle castings
            if (optionalClassFeatureIds.includes(action.componentId) && !this.character.raw.optionalClassFeatures?.find(feat => feat.classFeatureId === action.componentId)) continue;
            
            const builtAction = {
                name: this.character.linkName(action.name ?? "", action.description),
                isWeaponAttack: false,
                attackBonus: null,
                damageDice: null,
                damageBonus: 0,
                range: '',
                damageType: '',
                isSpell: action.isSpell ?? false,
                uses: this.getUses(action),
            };
            responses[action.activation?.activationType ?? 0]?.push(builtAction);
        }
        
        return responses.map(response => response.toSorted((a, b) => a.name.localeCompare(b.name)));
    }

    private extractCustomActions() {
        const responses = this.getActionResponse();

        for (const action of this.character.raw.customActions ?? []) {

            const attackBonus = this.character.statsById[action.statId ?? 1]?.mod + (action.isProficient ? this.character.proficiencyBonus : 0);
            
            const damageDice = action.diceCount && action.diceType ? `${action.diceCount}d${action.diceType}` : null;

            const builtAction = {
                name: this.character.linkName(action.name ?? "", action.description),
                isWeaponAttack: false,
                attackBonus,
                damageDice,
                damageBonus: action.damageBonus ?? 0,
                range: action.range ? `${action.range} ft` : '',
                damageType: '',
                isSpell: action.isSpell ?? false,
                uses: this.getUses(action),
            };
            responses[action.activation?.activationType ?? 0]?.push(builtAction);
        }

        return responses.map(response => response.toSorted((a, b) => a.name.localeCompare(b.name)));
    }

    private getUses(action: DdbAction | DdbSpell){
        if (!action.limitedUse){
            return undefined;
        }
        const maximum = action.limitedUse.statModifierUsesId ? this.character.statsById[action.limitedUse.statModifierUsesId]?.mod : action.limitedUse.maxUses;
        
        return {used: action.limitedUse.numberUsed, maximum, reset: [null, "short rest", "long rest", "day"][action.limitedUse.resetType ?? 0] ?? null};
    }
    
    private getActionResponse() {
        let actions: CharacterAction[] = [];
        let otherActions: CharacterAction[] = [];
        return [
            actions,
            actions,
            [],
            [],
            [],
            otherActions,
            otherActions,
            otherActions,
            otherActions
        ];
    }
}