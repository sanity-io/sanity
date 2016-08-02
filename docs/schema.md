# Schema

The schema defines the *structure* of the data produced by the form builder and their relation. To create a schema, you call `Schema.compile()` with a JSON representation of the schema types, e.g.:

```js
const mySchema = Schema.compile({
  name: 'my-schema',
  types: [
    {
      name: 'book',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string'
        }
      ]
    }
  ]
})
```
<!-- refer to more detailed documentation about schemas -->
   
   