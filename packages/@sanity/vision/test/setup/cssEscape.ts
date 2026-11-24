// jsdom has no `CSS.escape`, which react-dom calls when it names the `<ViewTransition>` boundaries
// of a transition that animates them, whether or not the browser can run a view transition
if (typeof globalThis.CSS === 'undefined') {
  Object.defineProperty(globalThis, 'CSS', {value: {}, configurable: true})
}
if (typeof CSS.escape !== 'function') {
  CSS.escape = (value: string) =>
    value.replace(
      /^(-?)(\d)|[^\w-]/g,
      (match, dash: string | undefined, digit: string | undefined) =>
        digit === undefined ? `\\${match}` : `${dash}\\3${digit} `,
    )
}
