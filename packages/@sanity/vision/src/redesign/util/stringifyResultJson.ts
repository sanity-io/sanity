import {safeJsonStringify} from '../../util/safeJsonStringify'

/** Pretty-printed JSON past this many characters is truncated before the editor loads it */
export const MAX_RESULT_JSON_CHARS = 500_000

export type StringifyResultJson =
  | {ok: true; text: string}
  | {ok: false; text: string; truncated: true; originalChars: number}
  | {ok: false; text: string; error: true}

/**
 * Pretty-prints a result for the JSON viewer. Non-JSON values and circular structures become an
 * error notice instead of throwing during render. Enormous payloads are truncated so CodeMirror
 * does not freeze the response pane.
 */
export function stringifyResultJson(
  value: unknown,
  maxChars = MAX_RESULT_JSON_CHARS,
): StringifyResultJson {
  const text = safeJsonStringify(value, 2)
  if (text === undefined) {
    return {
      ok: false,
      error: true,
      text: '/* Result could not be shown as JSON */\nnull',
    }
  }
  if (text.length <= maxChars) {
    return {ok: true, text}
  }
  return {
    ok: false,
    truncated: true,
    originalChars: text.length,
    text: `${text.slice(0, maxChars)}\n/* … truncated (${text.length.toLocaleString()} characters) */`,
  }
}
