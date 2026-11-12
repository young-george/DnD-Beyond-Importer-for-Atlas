import AbstractRenderer from "./abstract.renderer";

export default class FeaturesRenderer extends AbstractRenderer {

    featsToExclude = ["Dark Bargain", "Character Threads", "Runestones", "Hero's Journey Boon", "Faction Renown", "Neutral Faction Renown", "Subfaction Renown"];
    
    render(): string {
return `${this.renderClassFeatures()}
${this.renderSpeciesFeatures()}
${this.renderFeats()}`
    }
    
    renderClassFeatures(): string {
        
        const availableFeats = this.character.raw.classes
            ?.flatMap(c => {
                
                const classFeatures = c.classFeatures?.flatMap(f => [f, ...(this.character.raw.options?.class?.filter(o => o.componentId === f.definition?.id) ?? []).map(o => ({
                    ...o, 
                    indent: true,
                    definition: {
                        ...o.definition,
                        displayOrder: f.definition?.displayOrder ?? 0,
                    }}
                ))]) ?? [];

                return classFeatures
                    .filter(f => (f.definition?.requiredLevel ?? 0) <= (c.level ?? 0) && !this.featsToExclude.includes(f.definition?.name ?? ""))
                    .toSorted((a, b) => (a.definition?.displayOrder ?? 0) - (b.definition?.displayOrder ?? 0)) ?? []
            })
            .deduplicate(f => f.definition?.name) ?? [];
        
        return `class_features:
${availableFeats.map(f => `- name: "${f.indent ? "&nbsp;&nbsp;&nbsp;&nbsp;" : ""}${this.character.linkName(f.definition?.name ?? "", f.definition?.description)}"
`).join('')}`
    }

    renderSpeciesFeatures(): string {
        const availableFeats = this.character.raw.race?.racialTraits
            ?.filter(f => !this.featsToExclude.includes(f.definition?.name ?? ""))
            .toSorted((a, b) => (a.definition?.displayOrder ?? 0) - (b.definition?.displayOrder ?? 0))
            .deduplicate(f => f.definition?.name) ?? [];

        return `species_traits:
${availableFeats.map(f => `- name: "${this.character.linkName(f.definition?.name ?? "", f.definition?.description)}"
`).join('')}`
    }

    renderFeats(): string {
        const availableFeats = this.character.raw.feats
            ?.filter(f => !this.featsToExclude.includes(f.definition?.name ?? ""))
            .toSorted((a, b) => (a.definition?.displayOrder ?? 0) - (b.definition?.displayOrder ?? 0))
            .deduplicate(f => f.definition?.name) ?? [];

        return `feats:
${availableFeats.map(f => `- name: "${this.character.linkName(f.definition?.name ?? "", f.definition?.description)}"
`).join('')}`
    }

}