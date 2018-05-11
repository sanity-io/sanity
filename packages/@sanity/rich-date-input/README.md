### @sanity/rich-date-input
A richer date/time type and input component for Sanity form builder

## Usage

- `sanity install @sanity/rich-date-input`
- In your schema:
  ```js
  import richDate from 'part:@sanity/form-builder/input/rich-date/schema'

  // ...
  export default createSchema({
    name: 'mySchema',
    types: [
      //...
      richDate
    ]
  })

  ```

Typical data output:

```js
{
  _type: 'richDate',
  local: '2017-02-21T10:15:00+01:00',
  utc: '2017-02-12T09:15:00Z',
  timezone: 'Europe/Oslo',
  offset: 60
}
```

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
