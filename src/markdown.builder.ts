import {DdbApiResponse, DnDBeyondImporterSettings} from "./types";
import CharacterSheet from "./character-sheet";
import FrontmatterRenderer from "./renderers/frontmatter.renderer";
import BasicDetailsRenderer from "./renderers/basic-details.renderer";
import HitpointsRenderer from "./renderers/hitpoints.renderer";
import CombatStatsRenderer from "./renderers/combat-stats.renderer";
import StatsRenderer from "./renderers/stats.renderer";
import SkillsRenderer from "./renderers/skills.renderer";
import DefensesRenderer from "./renderers/defenses.renderer";
import SensesRenderer from "./renderers/senses.renderer";
import ProficienciesRenderer from "./renderers/proficiencies.renderer";
import ActionsRenderer from "./renderers/actions.renderer";
import SpellcastingRenderer from "./renderers/spellcasting.renderer";
import FeaturesRenderer from "./renderers/features.renderer";
import EquipmentRenderer from "./renderers/equipment.renderer";
import CurrenciesRenderer from "./renderers/currencies.renderer";
import NotesRenderer from "./renderers/notes.renderer";

export default class MarkdownBuilder {
    static buildMarkdown(
        data: DdbApiResponse,
        settings: Partial<DnDBeyondImporterSettings>,
        existingFrontmatter?: Record<string, unknown>
    ): string {

        const char = data.data;
        if (!char) throw new Error("Unexpected API response structure");

        const sheet = new CharacterSheet(char, settings);

        const renderers = [
            new FrontmatterRenderer(sheet, settings, existingFrontmatter),
            new BasicDetailsRenderer(sheet, settings),
            new HitpointsRenderer(sheet, settings),
            new CombatStatsRenderer(sheet, settings),
            new StatsRenderer(sheet, settings),
            new SkillsRenderer(sheet, settings),
            new DefensesRenderer(sheet, settings),
            new SensesRenderer(sheet, settings),
            new ProficienciesRenderer(sheet, settings),
            new ActionsRenderer(sheet, settings),
            new SpellcastingRenderer(sheet, settings),
            new FeaturesRenderer(sheet, settings),
            new EquipmentRenderer(sheet, settings),
            new CurrenciesRenderer(sheet, settings),
            new NotesRenderer(sheet, settings, existingFrontmatter)
        ]

        let md = `---
${renderers.map(r => r.render().trim()).join("\n")}
---

\`\`\`dnd-sheet-launcher-atlas
charId:${char.id}
\`\`\`\n\n

${settings.embedDndBeyond ? `<iframe class="dnd-frame" src="https://www.dndbeyond.com/characters/${char.id}"></iframe>` : ''}

${this.buildDetails(sheet)}
`
        md = md.replace(/{{modifier:([a-z]{3})(.*)}}/g, '@$1.mod');
        md = md.replace(/<p>/g, '\n').replace(/<\/p>/g, '\n\n');
        md = md.replace(/\[skill\](.*?)\[\/skill\]/g, '[$1](skills.md#$1)');
        md = md.replace(/\[wprop\](.*?)\[\/wprop\]/g, '[$1](item-properties.md#$1)');
        md = md.replace(/\[condition\](.*?)\[\/condition\]/g, '[$1](conditions.md#$1)');
        md = md.replace(/\[action\](.*?)\[\/action\]/g, '[$1](actions.md#$1)');
        md = md.replace(/\[action\](.*?)\[\/action\]/g, '[$1](actions.md#$1)');
        md = md.replace(/\[rules\](.*?)\[\/rules\]/g, '$1');
        md = md.replace(/\[rules\](.*?)\[\/rules\]/g, '$1');
        md = md.replace(/\[rules\](.*?)\[\/rules\]/g, '$1');

        return md;
    }

    static buildDetails(sheet: CharacterSheet): string {
        return sheet.linkedDescriptions
            ?.filter(d => d?.description && d?.description.trim() !== "")
            ?.map(d => `### ${d?.name ?? ""}\n${d?.description}\n`).join('\n');
    }

}