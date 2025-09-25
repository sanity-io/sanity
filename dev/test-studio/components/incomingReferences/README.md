## TODO:

### Actions

- make actions component type, like document actions?
- Add option for a dialog or popover
- onLinkDocument action as part of the actions array?

### Query filter

- Support filter query for more specific selections.

### Decisions:

- Use array type? How will this build into the existing schema resolutions.
- How to show when multiple versions of the same document have a reference to this document. Example, published and draft refers to the document, how do we remove that reference? What do we do with versions in this cases?
- How will the schema resolution handle this, this field is more of a presentation field, it shouldn't. Will AI be confused by this field which represents a reference but an incoming one?
  - Maybe define it as a new type of field?
  - Disable validations on this new type of field?

### Code:

- Reorganize code and divide into components, specially focus on AddIncomingReference and rename files to better express what they are doing.
