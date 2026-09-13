export class StateProperty<T> {
    #getValue: () => T;
    #setValue: (val: T) => void;
    #internalVal: T;
    #initialized = false;

    constructor(defaultVal: T) {
        this.#internalVal = defaultVal;
        this.#getValue = () => this.#internalVal;
        this.#setValue = (newVal) => this.#internalVal = newVal;
    }

    init(value: T) {
        this.#setValue(value);
        this.#internalVal = value;
        this.#initialized = true;
    }

    bind(getValue: () => T, setValue: (val: T) => void) {
        this.#getValue = getValue;
        this.#setValue = setValue;
        if(this.#initialized) setValue(this.#internalVal);
    }

    get value() {
        return this.#getValue();
    }

    set value(val: T) {
        this.#setValue?.(val);
    }
}

export class BindableProperty<T> {
    #getValue: () => T;
    #setValue: (val: T) => void;
    #internalVal: T;

    constructor(defaultVal: T) {
        this.#internalVal = defaultVal;
        this.#getValue = () => this.#internalVal;
        this.#setValue = (newVal) => this.#internalVal = newVal;
    }

    bind(getValue: () => T, setValue: (val: T) => void) {
        this.#getValue = getValue;
        this.#setValue = setValue;
        setValue(this.#internalVal);
    }

    get value() {
        return this.#getValue();
    }

    set value(val: T) {
        this.#setValue?.(val);
    }
}