# @sanity/date-input

Date/time input components for Sanity form builder

Typical data output:

```js
{
  local: '2017-02-21T10:15:00+01:00',
  utc: '2017-02-12T09:15:00Z',
  timezone: 'Europe/Oslo',
  offset: 60
}
```

Using https://github.com/dubert/react-kronos for date/time input.

## Options

This component accepts the following options via the Sanity schema:

```
options.dateFormat || 'YYYY-MM-DD'
options.timeFormat || 'HH:mm'
options.calendarTodayLabel || 'Today'
options.timeStep || 15
options.inputUtc || false
options.inputDate || true
options.inputTime || true
options.placeholderDate || moment().format(options.dateFormat)
options.placeholderTime || moment().format(options.timeFormat)
```
