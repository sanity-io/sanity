# Schema descriptors

The _schema descriptors_ provides a serialized version of the schema using the [`@sanity/descriptors`](https://github.com/sanity-io/descriptors) package.

- See the [types.ts](./types.ts) for reference documentation.
- Read below for an introduction to the concepts.

## Structure

The complete schema is represented as a _registry_ (`sanity.schema.registry`).
This is a set consisting of _named types_ (`sanity.schema.namedType`) and (potentially) other registries.
For instance, a regular Studio with a single document type would be presented like this:

- Registry:
  - Named type: `blogPost`
    - Subtype of: `document`
    - Fields: `title`, `body`
  - Registry (builtins):
    - Named type: `document`
    - Named type: `object`
    - … _(all the other built in types)_

Here we've created a separate registry for the built-in types which Studio provides.
This makes the synchronization of the schema towards Content Lake more efficient:
The server can re-use the registry of built-in types across many different schemas.

The basic way of defining a type is through a **type definition**.
This is very similar to the regular type definition in Studio, with one exception:
In the world of descriptor the name is **not** part of the type definition.

Instead, there are three scenarios where a "name" is given to a type definition:

- The top-level `sanity.schema.namedType` descriptor registers a type definition with a name.
- Each field definition (e.g. `fields: [{name: …, typeDef: …}]`) has a name.
  The name is attached to the _field_ and not the type however.
- Each array element (e.g. `to: [{name: …, typeDef: …}]`) can have a name.
  Once again, this just gives the meaning of the name _in this context_.

Another core concept to realize, which actually comes from the type model of Sanity, is that **you don't refer to a type, but you can only create a _subtype_**.
Look at this:

```ts
{
  type: 'sanity.schema.namedType',
  name: 'blogPost',
  typeDef: {
    extends: 'document',
    fields: [
      {
        name: 'title',
        typeDef: { extends: 'string' },
      },
      {
        name: 'description',
        typeDef: {
          extends: 'string',
          description: 'Hello!'
        },
      }
    ]
  }
}
```

When you're writing `fields: [{name: 'title', type: 'string'}]` in your Studio schema definition you're actually _not_ declaring that that `title` is of type `string`.
You're _actually_ declaring a completely new type, inheriting from `string`, and it just happen to not override any of its properties.
This is why in the descriptor language we've changed `type: …` into `extends: …` to make this more explicit.

However, for references, when declaring the `to` types the descriptor language uses explicitly named types:

```ts
{
  type: 'sanity.schema.namedType'
  name: 'blogPost',
  typeDef: {
    extends: 'document',
    fields: [
      {
        name: 'author',
        typeDef: {
          extends: 'reference'
          to: ['author']
        },
      }
    ]
  }
}
```

The Studio schema definition uses `to: [{type: 'author'}]` in this scenario which _does_ actually internally create a subtype, _but_ the properties of said subtype is never used to anything.
The only thing which matters is its `name`.

## Markers

When serializing user definitions there can be values which can't be represented natively in JSON.
In these scenarios we're using _markers_ to denote what type of value it originally was.
This is an object with a `__type` property.
We have the following markers:

- `__type: "function"` is used to represent a function.
- `__type: "cyclic"` is used to represent a cyclic reference.
- `__type: "number"` is used to represent a number, serialized as a string.
  This is needed because the descriptors themselves don't support numbers since these are very underspecified in JSON.
- `__type: "undefined"` is used to represent an undefined value inside an array.
- `__type: "unknown"` is used to represent any other unknown value.
