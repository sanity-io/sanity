/**
 * Whether an event happened in the params panel (its view tabs, the JSON editor or the form, all
 * under `data-vision-params-content`), so Copy and Format act on the params
 */
export function isParamsContentTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-vision-params-content]') !== null
}
