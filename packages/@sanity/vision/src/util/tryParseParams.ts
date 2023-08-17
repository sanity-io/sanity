import JSON5 from 'json5'
import {TFunction} from 'sanity'

export function tryParseParams(
  val: string,
  t: TFunction<'vision', undefined>
): Record<string, unknown> | Error {
  try {
    const parsed = val ? JSON5.parse(val) : {}
    return typeof parsed === 'object' && parsed && !Array.isArray(parsed) ? parsed : {}
  } catch (err) {
    // JSON5 always prefixes the error message with JSON5:, so we remove it
    // to clean up the error tooltip
    err.message = `${t('query.error.params-invalid-json')}:\n\n${err.message.replace('JSON5:', '')}`
    return err
  }
}
