import AbstractRenderer from "./abstract.renderer";

export default class EquipmentRenderer extends AbstractRenderer {

    render(): string {
        const equipment = this.character.raw.inventory ?? [];
        if (!equipment.length) return "";

        const renderedEquipment = equipment.map(item => {
            
            const details = [`**Quantity:** ${item.quantity ?? 1}`, `${item.definition?.weight ? `**Weight:** ${item.definition?.weight} lb.` : ""}`].join(', ');
            
            return `- name: "${this.character.linkName(item.definition?.name, item.definition?.description)}"
  desc: "— ${details}"`
        }).join("\n");
        
        return `equipment:
${renderedEquipment}`;
    }
    
}