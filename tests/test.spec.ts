import { expect,  it} from "vitest";
import fs from 'fs';
import {DdbApiResponse} from "../src/types";
import MarkdownBuilder from "../src/markdown.builder";
import '../src/array-extensions';

it.each(fs.readdirSync('tests/ddb-characters'))('%s', async (fileName) => {

    const file = fs.readFileSync(`tests/ddb-characters/${fileName}`, 'utf-8');
    
    const markdown = MarkdownBuilder.buildMarkdown(JSON.parse(file) as DdbApiResponse, {embedDndBeyond: true, importSkillValues: true});
    
    await expect(markdown).toMatchFileSnapshot(`snapshots/${fileName}.md`);
    
}); 