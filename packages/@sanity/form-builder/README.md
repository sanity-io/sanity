# ⚠️ THIS PACKAGE IS DEPRECATED

> This package is part of Sanity Studio v2, which has been superseded by **Sanity Studio v3**, the current major version released on Dec 7th, 2022. This package is no longer used/needed for Sanity Studio in its current version and will be retired on Dec 7th, 2023. The core packages for Sanity Studio v2 will only receive critical bug fixes until this date.
>
> Please head over to [the documentation for Sanity Studio v3](https://www.sanity.io/docs/sanity-studio) to learn more.

# Form Builder

## Disclaimer: Work in progress

There is an example of a consumer app in the `./example` that can be started with `npm start`

## Limitations

Polymorphic arrays may only contain elements of one primitive type. Thus, this is invalid:

```json
{
  "types": [
    {
      "name": "myType",
      "type": "array",
      "of": [
        {"type": "string", "title": "Street"},
        {"type": "string", "title": "E-mail"}
      ]
    }
  ]
}
```

## Terminology

### Type

Types are the building blocks for your schema. A type defines the structure and behavior of your data model.

There is a distiction between _primitive types_ and _container types_.

A container type is a type that contains data of other types, e.g. `array` or `object`. A primitive type only represents one simple value, like the number `3` or the string `foobar`

### Field

If you define an object type, you must also define its fields. E.g. if you are defining a `person` type, it may look like this:

```json
{
  "name": "person",
  "type": "object",
  "fields": [
    {
      "name": "firstName",
      "title": "First name",
      "type": "string"
    },
    {
      "name": "lastName",
      "title": "Last name",
      "type": "string"
    }
  ]
}
```

You cannot create an object type that has no fields. We haven't yet had the need for a `hash` type that can have arbitrary key => value pairs (where keys are strings and value can be anything), but will consider supporting it in the future.

## Input widgets

All input fields must follow a simple convention based protocol.
Every input field must:

- Accept a `value` prop which is the field's value
- Accept an `onChange` function as prop which is called whenever a value changes

## Schema

When writing a schema, `type` is implicitly `object`, unless otherwise specified. You're not allowed to set type: 'object' (redundant definition).

Only built-in types can take options. Below, `email.placeholder` is an option to `string` and `versions.of` is an option to `list`.

```js
const schema = {
  name: 'someSchema',
  types: [
    {
      name: 'user',
      fields: [
        {
          name: 'email',
          type: 'string',
          title: 'E-mail address',
          placeholder: 'murgh@example.com',
        },
        {
          name: 'profilePicture',
          type: 'image',
        },
      ],
    },
    {
      name: 'image',
      fields: [
        {
          name: 'fullSizeUrl',
          type: 'string',
        },
        {
          name: 'aspectRatio',
          type: 'number',
        },
        {
          name: 'versions',
          type: 'list',
          of: [{type: 'imageVersion'}],
        },
      ],
    },
    {
      name: 'imageVersion',
      fields: [
        {
          name: 'width',
          type: 'number',
        },
        {
          name: 'square',
          type: 'boolean',
        },
        {
          name: 'url',
          type: 'string',
        },
      ],
    },
  ],
}
```

## Considerations / todo

- Support for collaborative editing
- Powerful validation rules
- i18n
- List item edit modality
- Styling
