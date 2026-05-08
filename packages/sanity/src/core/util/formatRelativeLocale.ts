import {tz as tzHelper} from '@date-fns/tz'
import {formatRelative} from 'date-fns/formatRelative'
import {isValid} from 'date-fns/isValid'
import {parse} from 'date-fns/parse'

type DateInput = Date | number | string

const RUNTIME_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

/**
 * date-fns `formatRelative` defaults to formatting as `MM/dd/yyyy` (en-US) when the date is more
 * than ~6 days from `baseDate`. `formatRelativeLocale` substitutes that fallback with the
 * browser's locale date format so non-en-US users don't see American-style dates.
 *
 * Relative-day boundaries, time portions, and the locale fallback are all interpreted in
 * `timeZone`. When omitted, the host runtime's timezone is used (matching native JS date
 * formatting defaults). In browsers this is the user's system TZ; in Node/SSR it is the host
 * machine's TZ — pass an explicit IANA zone in non-browser environments. To render in the
 * user's selected studio timezone, callers should pass the appropriate zone — typically
 * from a hook that binds the current studio timezone (e.g., one that wraps `useTimeZone`).
 *
 * @internal
 */
export const formatRelativeLocale = (
  date: DateInput,
  baseDate: DateInput,
  timeZone: string = RUNTIME_TIME_ZONE,
): string => {
  const relative = formatRelative(date, baseDate, {in: tzHelper(timeZone)})
  // Heuristic: date-fns's en-US "Other" bucket renders as MM/dd/yyyy. Detecting it lets us
  // swap in a browser-locale calendar string so non-en-US users don't see American dates.
  // If date-fns ever changes that fallback shape (or a locale option is threaded through),
  // this branch silently stops triggering.
  if (isValid(parse(relative, 'MM/dd/yyyy', new Date()))) {
    return new Date(date).toLocaleDateString(undefined, {timeZone})
  }
  return relative
}
