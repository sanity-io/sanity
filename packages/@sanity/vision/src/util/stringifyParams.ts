/**
 * The params of a new tab: an empty object with an indented empty line, so the first param can be
 * typed without breaking the braces apart first
 */
export const DEFAULT_PARAMS = '{\n  \n}'

/**
 * Params as the tool writes them into a tab: JSON indented by two spaces, and an object without
 * keys as `DEFAULT_PARAMS` rather than `{}`. Only for params the tool produces (a URL, a form edit,
 * a generated query); text the user typed is kept as it is.
 */
export function stringifyParams(params: Record<string, unknown>): string {
  return Object.keys(params).length === 0 ? DEFAULT_PARAMS : JSON.stringify(params, null, 2)
}
