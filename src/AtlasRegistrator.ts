import {DdbCharacter} from "./types";
import {App, Notice} from "obsidian";
import TurndownService from "turndown";

export default class AtlasRegistrator {
    
    static async registerTokenWithAtlas(app: App, character: DdbCharacter, statblockPath: string, imagePath: string) {

        const folder = 'atlas-vtt/collections/Default/tokens';

        if (!app.vault.getAbstractFileByPath(folder)) {
            new Notice(`❌ Could not find Default collection to create player token`, 4000);

            return;
        }

        const filename = `token-${character.id}.json`;

        const tokenData = {
            "atlasRecord": {
                "format": 1,
                "type": "token",
                "showRing": true,
                "name": character.name,
                "imagePath": imagePath,
                "size": 1,
                "statblockPath": statblockPath,
                "collection": "Default",
                "tags": [],
                "thumbnailPath": imagePath,
                "id": `token-${character.id}`,
                "createdAt": Date.now(),
                "modifiedAt": Date.now(),
                "playerCharacter": true
            }
        }
        
        try {
            await app.vault.create(`${folder}/${filename}`, JSON.stringify(tokenData, null, 2));
        } catch (e) {
            // If the file already exists, we can just update it
        } 
    }
    
    static async registerInventoryWithAtlas(app: App, character: DdbCharacter) {
        const characterFiles = app.vault.getFiles().filter(f => f.path.startsWith(`atlas-vtt/campaigns`) && f.name == 'characters.json');
        
        const campaigns = [];
        
        for (const file of characterFiles) {
            const content = await app.vault.read(file);
            const json = JSON.parse(content);
            
            if (json.characters?.hasOwnProperty(`token-${character.id}`)) {
                campaigns.push({path: file.parent?.path, campaignId: json.campaignId});
            }
        }
        
        const characterInventory = this.getCharacterInventory(character);
        
        for (const campaign of campaigns) {
            const book = app.vault.getAbstractFileByPath(`${campaign.path}/books.json`);
            const bookContent = book ? await app.vault.read(book) : `{"format":1,"campaignId":"${campaign.campaignId}","books":{}}`;
            
            const bookJson = JSON.parse(bookContent);
            bookJson.books = {...bookJson.books, ...characterInventory};
            if (!book) {
                await app.vault.create(`${campaign.path}/books.json`, JSON.stringify(bookJson, null, 2));
            } else {
                await app.vault.modify(book, JSON.stringify(bookJson, null, 2));
            }
            console.log(bookContent);
        }
        console.log(campaigns);
    }

    static getCharacterInventory(character: DdbCharacter) {
        
        const turndownService = new TurndownService();
        
        return {[`token-${character.id}`]: {
            "items": character.inventory?.map(item => ({
                "id": `${item.id}`.padEnd(24, '0'),
                "name": item.definition?.name,
                "description": turndownService.turndown(item.definition?.description || ''),
                // "description": item.definition?.description,
                "rarity": item.definition?.rarity ?? null,
                "type": item.definition?.type ?? null,
                "tone": item.definition?.rarity?.toLowerCase() ?? null,
                "properties": [],// item.definition?.properties?.map(p => p.name) ?? [],
                "at": Date.now(),
                "price": `${item.definition?.cost} GP`
            })),
        }};
    }
    
}