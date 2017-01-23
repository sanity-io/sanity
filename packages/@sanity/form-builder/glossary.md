# Field
A data structure describing a form field. A field must always specify its type, and can have the following properties:

```
{
  type: <string>,
  title: <string>,
  placeholder: <string>,
  // ...
}
```

# Type
A data structure describing a data type. A type can be either primitive, compound or alias:

### Primitive types
Examples: `string`, `list`. A primitive type is a type without its own fields and be split into smaller parts.

### Alias type
This is a type that does nothing but aliasing another type. This is useful when you wish to introduce custom types that is semantically different, but shares the underlying type

Example:
```
const type = {
  name: 'country',
  alias: 'string'
}
```

### Compound types
Example: `customer` or `article`. A compound type consists of one or more fields.

#### Example: A customer type:

```
const customerType = {
  name: 'customer',
  fields: {
    name: {
      title: 'Customer name',
      type: 'string'
    },
    website: {
      title: 'Web site',
      type: 'string'
    }
  }
}
```

### Field type annotations
Field type annotations are type-specific metadata for a field. For instance, if a field is of type list, you may want to specify the type of items it may contain.

Currently, only lists and references defines type specific annotations.