import {formatRelative, isValid, parse} from 'date-fns'

/**
 * date-fns `formatRelative` defaults to formatting as `mm/dd/yyyy` if the date is more/less than
 * a week away. `formatRelativeLocale` will adjust formatting in these cases to match the correct
 * locale format.
 * @internal
 */
export const formatRelativeLocale = (...args: Parameters<typeof formatRelative>) => {
  const dateFnsRelative = formatRelative(...args)

  // if date is of format mm/dd/yyyy, format as a locale string instead
  if (isValid(parse(dateFnsRelative, 'MM/dd/yyyy', new Date()))) {
    const [dateTime] = args
    return new Date(dateTime).toLocaleDateString()
  }
  return dateFnsRelative
}
