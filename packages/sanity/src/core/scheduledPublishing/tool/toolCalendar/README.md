This folder contains a customised version of the Sanity Studio's [DateInput calendar](https://github.com/sanity-io/sanity/tree/next/packages/%40sanity/form-builder/src/inputs/DateInputs/base/calendar) component (for use in this plugin's tool) with the following changes:

- Ingested dates (e.g. `focusedDate` and `selectedDate` are now in 'wall time' – or time zone formatted dates). This is accomplished with extensive use of `date-fns-tz` helper functions.
- All dates returned in callbacks (e.g. `onSelect` and `onFocusedDateChange`) **always return values in UTC**
- a simplified header with next / previous month selection only
- simplified day headers ('Mon' -> 'M')
- larger calendar day buttons
- no time (HH:MM) dropdowns
- stripped 'features' (day + time presets)
- pips (and tooltips) on calendar days that contain schedules
