# Value containers

If an input component needs to maintain its own internal representation of the input value, a value container provides a way to deserialize / serialize the raw value into this internal representation.

The value container must be a class that has a static method `deserialize` that converts a raw value into a value container that holds its internal state. The `deserialize` method has the signature

`deserialize(rawValue, context) : ValueContainer`

It receives the raw value, and a context object that has two properties: `field` and `schema`. The `schema` property holds the schema and the `field` property points to the field from the schema type that this value belongs to.

Also, `deserialize()` must return a `ValueContainer` object that implements the following methods:

- `serialize() : any`

- `patch(patch) : ValueContainer`

- `validate() : ValidationResult`

- `isEmpty() : boolean`