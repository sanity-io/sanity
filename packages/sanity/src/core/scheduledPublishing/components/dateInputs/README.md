This folder contains a customised version Sanity Studio's [DateInput](https://github.com/sanity-io/sanity/tree/next/packages/%40sanity/form-builder/src/inputs/DateInputs) and accompanying calendar components.

Some changes have been made to make both `<DateTimeInput>` and its calendar component _time zone aware_:

## DateTimeInput

- This continues to handle all dates in UTC, though it formats + parses values using the _current time zone_
- Date and time handling uses `date-fns` formatting (rather than moment - which the studio is moving away from anyway)
- Added the `customValidation` option, a callback function used to validate whether certain date ranges are selectable in the calendar
- Added the `customValidationMessage` option, a custom error message displayed when `customValidation` fails

  ```js
  // E.g. No scheduling on weekends!
  const {utcToCurrentZoneDate} = useTimeZone()

  const handleCustomValidation = (selectedDate: Date): boolean => {
    return !isWeekend(utcToCurrentZoneDate(selectedDate))
  }

  return (
    <DateTimeInput
      type={{
        name: 'date',
        options: {
          customValidation: handleCustomValidation,
          customValidationmessage: 'No schedules on weekends please',
        },
        title: 'Date and time',
      }}
    />
  )
  ```

## DateTimeInput calendar

- Ingested dates (e.g. `focusedDate` and `selectedDate` are now in 'wall time' – or time zone formatted dates). This is accomplished with extensive use of `date-fns-tz` helper functions.
- All dates returned in callbacks (e.g. `onSelect` and `onFocusedDateChange`) **always return values in UTC** (for the corresponding `<DateInput>` to ingest).

These changes ensure correct days / hours etc are highlighted in various calendar UI elements when switching between time zones.
