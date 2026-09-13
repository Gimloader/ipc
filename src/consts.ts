import type { Settings, State } from "./types/state";

export const isFirefox = navigator.userAgent.includes("Firefox");

export const portCryptoAlgorithm: HmacKeyGenParams = {
    name: "HMAC",
    hash: { name: "SHA-512" }
};

export const defaultSettings: Settings = {
    pollerEnabled: false,
    autoUpdate: true,
    autoDownloadMissingLibs: true,
    autoDownloadMissingPlugins: false,
    menuView: "grid",
    showPluginButtons: true,
    suppressGimkitLogs: false
};

export const defaultState: State = {
    availableUpdates: [],
    cacheInvalid: false,
    hotkeys: {},
    libraries: [],
    plugins: [],
    pluginLayout: { root: { contents: [] } },
    libraryLayout: { root: { contents: [] } },
    pluginSettings: {},
    settings: defaultSettings,
    pluginStorage: {}
};