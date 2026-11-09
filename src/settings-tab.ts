import {App, Plugin, PluginSettingTab, Setting, SettingDefinitionGroup, TFile, WorkspaceLeaf} from "obsidian";
import {DnDBeyondImporterSettings} from "./types";
import DnDBeyondImporterPlugin from "../main";

type PluginWithSettings = InstanceType<typeof Plugin> & {
    pluginSettings: DnDBeyondImporterSettings;
    saveSettings: () => Promise<void>;
};

export default class DnDBeyondSettingTab extends PluginSettingTab {
    plugin: PluginWithSettings;

    constructor(app: App, plugin: PluginWithSettings) {
        super(app, plugin);
        this.plugin = plugin;
    }
    
    getSettingDefinitions() {
        return [
            {
                name: "Output folder",
                desc: "Vault folder where character notes are saved (leave blank for vault root).",
                render: (setting: Setting) => {
                    setting.addText((text) =>
                        text
                            .setPlaceholder("Characters")
                            .setValue(this.plugin.pluginSettings.outputFolder)
                            .onChange((value) => {
                                this.plugin.pluginSettings.outputFolder = value;
                                void this.plugin.saveSettings();
                            })
                    );
                },
            },
            {
                name: "Image output folder",
                desc: "Vault folder where character images are saved. Start with ~ to specify relative to imported sheet location.",
                render: (setting: Setting) => {
                    setting.addText((text) =>
                        text
                            .setPlaceholder("~/Images/")
                            .setValue(this.plugin.pluginSettings.imageOutputFolder)
                            .onChange((value) => {
                                this.plugin.pluginSettings.imageOutputFolder = value;
                                void this.plugin.saveSettings();
                            })
                    );
                },
            },
            {
                name: "Include detailed descriptions",
                desc: "Include detailed descriptions of features, traits, and spells in the character note, linked in the statblock. The descriptions can be viewed by hovering over the links in the statblock.",
                render: (setting: Setting) => {
                    setting.addToggle((toggle) =>
                        toggle
                            .setValue(this.plugin.pluginSettings.includeDescriptions ?? true)
                            .onChange((value) => {
                                this.plugin.pluginSettings.includeDescriptions = value;
                                void this.plugin.saveSettings();
                            })
                    );
                }
            },
            {
                name: "Embed D&D Beyond page",
                desc: "Embed the D&D Beyond character sheet page in the note. This allows you to view the full character sheet in Obsidian without leaving the app.",
                render: (setting: Setting) => {
                    setting.addToggle((toggle) =>
                        toggle
                            .setValue(this.plugin.pluginSettings.embedDndBeyond ?? true)
                            .onChange((value) => {
                                this.plugin.pluginSettings.embedDndBeyond = value;
                                void this.plugin.saveSettings();
                            })
                    );
                }
            },
            {
                type: 'group',
                heading: 'Automatically Sync...',
                items: [
                    {
                        name: "When Obsidian opens",
                        desc: "Automatically sync all character sheets in the vault when Obsidian starts.",
                        render: (setting: Setting) => {
                            setting.addToggle((toggle) =>
                                toggle
                                    .setValue(this.plugin.pluginSettings.importOnStartup ?? true)
                                    .onChange((value) => {
                                        this.plugin.pluginSettings.importOnStartup = value;
                                        void this.plugin.saveSettings();
                                    })
                            );
                        }
                    },
                    {
                        name: "When opening sheet",
                        desc: "Automatically sync character sheet when opening & viewing the note in Obsidian. This will not sync the sheet when viewing the statblock in Atlas.",
                        render: (setting: Setting) => {
                            setting.addToggle((toggle) =>
                                toggle
                                    .setValue(this.plugin.pluginSettings.importWhenOpening ?? true)
                                    .onChange((value) => {
                                        this.plugin.pluginSettings.importWhenOpening = value;
                                        void this.plugin.saveSettings();
                                    })
                            );
                        }
                    }
                ]
            }  as SettingDefinitionGroup,
            {
                type: 'group',
                heading: 'Advanced Settings',
                items: [
                    {
                        name: "Don't import skill modifiers",
                        desc: "Don't import skill modifiers when syncing character sheets, use Atlas' automatically calculated modifiers instead. This might cause Atlas' skill modifiers to differ from D&D Beyond's if you have items, feats, homebrew rules or other modifiers applied.",
                        render: (setting: Setting) => {
                            setting.addToggle((toggle) =>
                                toggle
                                    .setValue(!this.plugin.pluginSettings.importSkillValues)
                                    .onChange((value) => {
                                        this.plugin.pluginSettings.importSkillValues = !value;
                                        void this.plugin.saveSettings();
                                    })
                            );
                        }
                    },
                ]
            } as SettingDefinitionGroup
        ];
    }
}
