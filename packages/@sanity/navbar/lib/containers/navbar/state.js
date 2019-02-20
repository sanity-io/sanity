"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const config_1 = require("./config");
const itemParts_1 = require("./itemParts");
// TODO:
// const resize$ = fromEvent(window, 'resize')
// const windowWidth$ = resize$.pipe(map(() => window.innerWidth))
// windowWidth$.pipe(tap(console.log)).subscribe()
const elements = config_1.default.items.map(() => null);
function setElement(el, idx) {
    elements[idx] = el;
}
exports.setElement = setElement;
// Build `items` prop
const items = config_1.default.items.map((itemConfig, idx) => {
    const { name } = itemConfig;
    const itemPart = itemParts_1.default.find(i => i.name === name) || null;
    if (!itemPart) {
        return {
            component: (() => null),
            layout: {},
            minimized: false,
            name,
            options: {},
            setElement: (element) => setElement(element, idx)
        };
    }
    const layout = Object.assign({}, (itemConfig.layout || {}), ((itemPart && itemPart.layout) || {}));
    const options = Object.assign({}, (itemConfig.options || {}), ((itemPart && itemPart.options) || {}));
    const item = {
        component: itemPart.component,
        layout,
        minimized: false,
        name,
        options,
        setElement: element => setElement(element, idx)
    };
    return item;
});
exports.state$ = rxjs_1.of({ items });

//# sourceMappingURL=state.js.map
