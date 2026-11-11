import {
	Notice,
	normalizePath,
	Plugin,
	requestUrl,
	TFile,
	WorkspaceLeaf,
} from "obsidian";
import {DdbApiResponse, DEFAULT_SETTINGS, DnDBeyondImporterSettings, PartyInventory} from "./src/types";
import DnDBeyondSettingTab from "./src/settings-tab";
import ImportModal from "./src/import-modal";
import MarkdownBuilder from "./src/markdown.builder";
import 'src/array-extensions';
import TemplateManager from "./src/TemplateManager";
import AtlasRegistrator from "./src/AtlasRegistrator";

declare global {
	interface Array<T> {
		sum(predicate?: (value: T) => number): number;
		deduplicate(predicate: (value: T) => unknown): T[];
	}
}

function extractCharacterId(url: string): string | null {
	const match = url.match(/\/characters\/(\d+)/);
	if (match) return match[1];
	if (/^\d+$/.test(url.trim())) return url.trim();
	return null;
}

export default class DnDBeyondImporterPlugin extends Plugin {
	pluginSettings: Partial<DnDBeyondImporterSettings> = {
		importWhenOpening: true,
		importOnStartup: true,
		includeDescriptions: true
	}
	activeFilePath: string | null = null;
	
	async onload() {
	
		await this.loadSettings();
		
		this.app.workspace.onLayoutReady(async () => {
			this.app.workspace.on('active-leaf-change', async(leaf: WorkspaceLeaf | null) => {
				
				// checked on each leaf change so that changing relevant setting doesn't require a restart to take effect
				if (!this.pluginSettings.importWhenOpening) {
					return;
				}
				
                if (leaf) {
                    const activeFile = this.app.workspace.getActiveFile();
					if(activeFile?.path == this.activeFilePath) {
						return;
					}

					this.activeFilePath = activeFile?.path ?? null;

						if (activeFile instanceof TFile) {
							const fileCache = this.app.metadataCache.getFileCache(activeFile);
						
							const frontmatter = fileCache?.frontmatter;

							if (frontmatter?.["dndbeyond_id"]) {
								this.importCharacter(frontmatter["dndbeyond_id"].toString());
							}
						}
						
					}
            	})


			if (!this.pluginSettings.importOnStartup) {
				return;
			}
			
			for (const file of this.app.vault.getMarkdownFiles()) {
				const fm: Record<string, unknown> | undefined =
					this.app.metadataCache.getFileCache(file)?.frontmatter;
				if (!fm?.["dndbeyond_id"]) continue;
				await this.importCharacter(fm?.["dndbeyond_id"].toString());
			}
		});

		this.addSettingTab(new DnDBeyondSettingTab(this.app, this));

		this.addRibbonIcon("user-plus", "Import D&D Beyond character", () => {
			new ImportModal(this.app, this).open();
		});

		this.addCommand({
			id: "import-dndbeyond-character",
			name: "Import D&D Beyond character",
			callback: () => {
				new ImportModal(this.app, this).open();
			},
		});

		this.addCommand({
			id: "refresh-dndbeyond-characters",
			name: "Sync D&D Beyond characters",
			callback: () => {
				for (const file of this.app.vault.getMarkdownFiles()) {
					const fm: Record<string, unknown> | undefined =
						this.app.metadataCache.getFileCache(file)?.frontmatter;
					if (!fm?.["dndbeyond_id"]) continue;
					this.importCharacter(fm?.["dndbeyond_id"].toString());
				}
			}
		});

		this.registerMarkdownCodeBlockProcessor("dnd-sheet-launcher-atlas", (source: string, el: HTMLElement) => {
			const params: Record<string, string> = {};
			for (const line of source.split("\n")) {
				const parts = line.split(":");
				const k = parts[0] ?? "";
				const v = parts[1] ?? "";
				if (k && v) params[k.trim()] = v.trim();
			}
			const rawCharId = params["charId"];
			const charId = rawCharId && rawCharId !== "0" ? rawCharId : null;

			const row = el.createDiv({ cls: "dndbi-atlas-launcher-row dont-hide" });

			const refreshBtn = row.createEl("button", { cls: "dndbi-refresh-btn" });
			refreshBtn.setText("🔄 Refresh sheet from D&D Beyond");

			if (!charId) {
				refreshBtn.disabled = true;
				refreshBtn.title = "This note has no D&D Beyond character ID.";
			} else {
				refreshBtn.addEventListener("click", () => {
					const originalLabel = "🔄 Refresh from D&D Beyond";
					refreshBtn.setText("⏳ Refreshing…");
					refreshBtn.disabled = true;
					refreshBtn.classList.remove("dndbi-flash-success", "dndbi-flash-error");

					this.app.workspace.activeLeaf?.rebuildView();
		
					this.importCharacter(charId).then(() => {
						refreshBtn.setText("✅ Refreshed");
						refreshBtn.classList.add("dndbi-flash-success");
					}).catch((e: unknown) => {
						const msg = e instanceof Error ? e.message : String(e);
						new Notice(`❌ Refresh failed: ${msg}`, 4000);
						refreshBtn.setText("❌ Refresh failed");
						refreshBtn.classList.add("dndbi-flash-error");
						console.error("[DnD Beyond Importer]", e);
					}).finally(() => {
						window.setTimeout(() => {
							refreshBtn.setText(originalLabel);
							refreshBtn.classList.remove("dndbi-flash-success", "dndbi-flash-error");
							refreshBtn.disabled = false;
						}, 1600);
					});
				});
			}
		});
	}

	async loadSettings() {
		const loaded = (await this.loadData()) as Partial<DnDBeyondImporterSettings> | null;
		this.pluginSettings = Object.assign({}, DEFAULT_SETTINGS, loaded ?? {});
	}

	async saveSettings() {
		await this.saveData(this.pluginSettings);
	}
	
	async importCharacter(idOrUrl: string): Promise<void> {
		
		await TemplateManager.installTemplate(this.app);
		
		const id = extractCharacterId(idOrUrl);
		if (!id) {
			new Notice("Couldn't find a D&D Beyond character ID in that input.", 4000);
			throw new Error("Invalid D&D Beyond character URL or ID.");
		}

		let data: DdbApiResponse;
		let partyInventory: PartyInventory = { data: { partyItems: [] } };
		try {
			const resp = await requestUrl({
				url: `https://character-service.dndbeyond.com/character/v5/character/${id}?includeCustomItems=true`,
				headers: { Accept: "application/json" },
			});
			data = resp.json as DdbApiResponse;
			
			if(data?.data?.campaign) {
				const partyInv = await requestUrl({
					url: `https://character-service.dndbeyond.com/character/v5/party/inventory/${data.data.campaign.id}`,
					headers: { Accept: "application/json" },
				});
				partyInventory = partyInv.json as PartyInventory;
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			new Notice(`❌ Couldn't fetch character ${id}. Make sure the sheet is set to Public on D&D Beyond.`, 5000);
			throw new Error(`Failed to fetch D&D Beyond character ${id}: ${msg}`);
		}

		const char = data?.data;
		if (!char) {
			new Notice("❌ Unexpected response from D&D Beyond. Is the character set to Public?", 5000);
			throw new Error("Unexpected D&D Beyond API response structure.");
		}

		const partyItems = partyInventory?.data?.partyItems?.filter(i => i.equippedEntityId == char.id)?.map(i => i.definition.grantedModifiers ?? [])?.flat() ?? [];
		char.modifiers?.item?.push(...partyItems);

		const existing: TFile | undefined = this.app.vault.getMarkdownFiles().find(
			(f: TFile) => {
				const fm: Record<string, unknown> | undefined =
					this.app.metadataCache.getFileCache(f)?.frontmatter;
				return fm?.["dndbeyond_id"] === char.id;
			}
		);
		
		let markdown: string;
		try {
			markdown = MarkdownBuilder.buildMarkdown(data, this.pluginSettings, existing ? this.app.metadataCache.getFileCache(existing)?.frontmatter : undefined);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			new Notice(`❌ Failed to build character note: ${msg}`, 5000);
			throw e;
		}

		const folder = (this.pluginSettings.outputFolder || "Characters").trim();
		if (folder && !this.app.vault.getAbstractFileByPath(folder)) {
			try {
				await this.app.vault.createFolder(folder);
			} catch {
				/* folder already exists (race with another note); safe to ignore */
			}
		}

		const safeName = (char.name ?? `Character ${id}`).replace(/[\\/:*?"<>|]/g, "-").trim();
		const defaultPath = normalizePath(`${folder}/${safeName}.md`);
		let imagePath = folder;
		
		let targetPath = defaultPath;

		try {
			if (existing) {
				imagePath = existing.parent?.path ?? '';
				await this.app.vault.modify(existing, markdown);
				
			} else {
				let suffix = 2;
				while (this.app.vault.getAbstractFileByPath(targetPath)) {
					targetPath = normalizePath(`${folder}/${safeName} (${suffix}).md`);
					suffix++;
				}
				const createdFile = await this.app.vault.create(targetPath, markdown);
				
				const leaf = this.app.workspace.getLeaf(false);
				await leaf.openFile(createdFile);
				
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			new Notice(`❌ Failed to write character note: ${msg}`, 5000);
			throw e;
		}
		
		const imageOutputFolder = this.pluginSettings.imageOutputFolder || '~/Images/';

		const imageDirectory = imageOutputFolder?.startsWith('~') ?
			normalizePath(`${imagePath}/${imageOutputFolder.replace('~/', '').replace('~', '')}`) :
			normalizePath(`${imageOutputFolder}`);

		const existingImage = this.app.vault.getFiles().find(f => f.name === `${char.name ?? "character"}_${char.id}.jpg`);
		
		if (!existingImage) {

			if (imageDirectory && !this.app.vault.getAbstractFileByPath(imageDirectory)) {
				try {
					await this.app.vault.createFolder(imageDirectory);
				} catch {
					/* folder already exists (race with another note); safe to ignore */
				}
			}

			try {
				await this.app.vault.createBinary(`${imageDirectory}/${char.name ?? "character"}_${char.id}.jpg`, await requestUrl({url: char.decorations?.avatarUrl ?? ""}).arrayBuffer);
			} catch (e) {
				console.error(e);
			}
		}

		if (this.pluginSettings.autoCreateAtlasToken){
			await AtlasRegistrator.registerTokenWithAtlas(this.app, char, targetPath, `${imageDirectory}/${char.name ?? "character"}_${char.id}.jpg`);
			await AtlasRegistrator.registerInventoryWithAtlas(this.app, char);
		}
		
		new Notice(`✅ Imported ${char.name ?? "character"}.`, 3000);
	}
}