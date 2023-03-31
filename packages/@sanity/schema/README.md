# Sanity schema

## Terminology

- **`Schema`** A collection of types
- **`Type`** A specification of a data structure. Available through schema lookup.
- **`Member type`** A member type is a type contained by a schema type. For example, an array may specify the allowed item types by defining members types from schema types. A reference may be a reference to a set of other types. A member type is not added to the schema and is not available through schema lookup, but rather exists as a property of the owner type.

## Constraints

### No inheritance

You are almost always better off using composition, rather than inheritance hierarchies

E.g.:

```js
const PERSON = {
  type: 'object',
  name: 'person',
  fields: [
    {name: 'firstName', type: 'string'},
    {
      name: 'address',
      type: 'object',
      fields: [
        {
          name: 'street',
          type: 'string',
        },
      ],
    },
  ],
}
```

If one were to introduce a user type, it would be tempting to think of it as a subtype of person, adding a few additional fields specific for the user type, like this:

```js
const USER = {
  // modelling user as a subtype of person
  name: 'user',
  type: 'person',
  fields: [
    {
      name: 'username',
      type: 'string',
    },
  ],
}
```

A problem with the above is: how do we merge the fields? Should the fields from `PERSON` be placed before the fields from `USER`? What if both types define the same field, should the subtype override? What if that field is an object where we'd like to keep some of the fields, but remove others? It quite quickly becomes messy.

A better solution would be to define common fields outside, and re-use them across types:

e.g.:

```js
const FIRST_NAME_FIELD = {name: 'firstName', type: 'string'}
const ADDRESS_FIELD = {
  name: 'address',
  type: 'object',
  fields: [
    {
      name: 'zip',
      type: 'string',
    },
    {
      name: 'street',
      type: 'string',
    },
    {
      name: 'city',
      type: 'string',
    },
  ],
}

const PERSON = {
  type: 'object',
  name: 'person',
  fields: [FIRST_NAME_FIELD, ADDRESS_FIELD],
}

const USER = {
  type: 'object',
  name: 'person',
  fields: [FIRST_NAME_FIELD, {name: 'username', type: 'string'}, ADDRESS_FIELD],
}
```

You could even take this further by extracting the individual fields of the `address` type and compose in different ways.
