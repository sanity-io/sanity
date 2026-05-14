import {tz as tzHelper} from '@date-fns/tz'
import {formatRelative} from 'date-fns/formatRelative'
import {isValid} from 'date-fns/isValid'
import {parse} from 'date-fns/parse'

type DateInput = Date | number | string

const RUNTIME_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

/**
 * Renders `date` relative to `baseDate` in `timeZone`. Replaces date-fns's en-US
 * `MM/dd/yyyy` fallback (used for dates more than ~6 days out) with the browser's
 * locale date format, so non-en-US users don't see American-style dates.
 *
 * `timeZone` defaults to the host runtime's TZ. Pass an explicit IANA zone for
 * non-browser contexts or to render in the user's selected studio timezone (e.g.
 * via a hook that wraps `useTimeZone`).
 *
 * @internal
 */
export const formatRelativeLocale = (
  date: DateInput,
  baseDate: DateInput,
  timeZone: string = RUNTIME_TIME_ZONE,
): string => {
  const relative = formatRelative(date, baseDate, {in: tzHelper(timeZone)})
  // Detect date-fns's en-US `MM/dd/yyyy` fallback and swap in a browser-locale string.
  if (isValid(parse(relative, 'MM/dd/yyyy', new Date()))) {
    return new Date(date).toLocaleDateString(undefined, {timeZone})
  }
  return relative
}
