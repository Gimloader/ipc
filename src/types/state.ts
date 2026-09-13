export interface ScriptInfo {
    code: string;
    name: string;
}

export interface PluginInfo extends ScriptInfo {
    enabled: boolean;
}

export type LibraryInfo = ScriptInfo;

export interface ScriptInfoTypes {
    plugin: PluginInfo;
    library: LibraryInfo;
}

export type PluginStorage = Record<string, Record<string, any>>;

/** @inline */
export interface HotkeyTrigger {
    /** Should be a keyboardevent [code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) */
    key?: string;
    /** Should be keyboardevent [codes](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) */
    keys?: ReadonlyArray<string>;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
}

export type ConfigurableHotkeysState = Record<string, HotkeyTrigger | null>;

export interface LayoutItem {
    type: "folder" | "script";
    id: string;
}

export interface LayoutPath {
    parent?: string;
    name?: string;
    contents: LayoutItem[];
}

export type ScriptLayout = Record<string, LayoutPath>;

export interface Settings {
    pollerEnabled: boolean;
    autoUpdate: boolean;
    autoDownloadMissingLibs: boolean;
    autoDownloadMissingPlugins: boolean;
    menuView: "grid" | "list";
    showPluginButtons: boolean;
    suppressGimkitLogs: boolean;
}

export interface SavedState {
    plugins: PluginInfo[];
    libraries: LibraryInfo[];
    pluginLayout: ScriptLayout;
    libraryLayout: ScriptLayout;
    pluginStorage: PluginStorage;
    pluginSettings: PluginStorage;
    settings: Settings;
    hotkeys: ConfigurableHotkeysState;
    cacheInvalid: boolean;
}

export interface State extends SavedState {
    availableUpdates: string[];
}
