import type { DeleteResult } from "../types/messages";
import type { ScriptInfo } from "../types/state";
import type StateManager from ".";
import { englishList } from "../utils";
import { apply } from "./events";
import ScriptState from "./script";

export default class LibraryState extends ScriptState<"library"> {
    constructor(stateManager: typeof StateManager) {
        super(stateManager, "library");
    }

    getInfo(info: ScriptInfo) {
        return info;
    }

    tryDeleteAll(confirmed = false): DeleteResult {
        const allWillDisable = new Set<string>();
        const willDelete = new Set<string>();

        for(const lib of this.scripts.value) {
            this.checkDependents(lib.name, allWillDisable);
            willDelete.add(lib.name);
        }

        const willDisable = allWillDisable.difference(willDelete);

        if(willDisable.size > 0 && !confirmed) {
            const names = englishList([...willDisable]);
            const message = `Deleting all libraries will also disable ${names}. Continue?"`;
            return { status: "confirm", message };
        }

        for(const name of willDisable) {
            apply("pluginToggled", { name, enabled: false });
        }

        return { status: "success" };
    }
}
