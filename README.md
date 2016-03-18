# Form Builder

## Big fat disclaimer: Work in progress

There is an example of a consumer app in the `./example` that can be started with `npm start`


## Input fields

All input fields must follow a simple convention based protocol.
Every input field must:
 - Accept a `value` prop which is the field's value
 - Accept an `onChange` function as prop which is called whenever a value changes


## Schema
When writing a schema, `type` is implicitly `object`, unless otherwise specified. You're not allowed to set type: 'object' (redundant definition).


## Considerations / todo
 - Support for collaborative editing
 - Powerful validation rules
 - i18n
 - List item edit modality
 - Styling
