import AbstractRenderer from "./abstract.renderer";

export default class CurrenciesRenderer extends AbstractRenderer {

    render(): string {
        return `currency:
- ${this.character.raw.currencies?.cp}
- ${this.character.raw.currencies?.sp}
- ${this.character.raw.currencies?.ep}
- ${this.character.raw.currencies?.gp}
- ${this.character.raw.currencies?.pp}`;
    }
    
}