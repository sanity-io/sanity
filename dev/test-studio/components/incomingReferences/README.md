## TODO:

### Actions

- make actions component type, like document actions?
- Add option for a dialog or popover

### Query filter

- Support filter query for more specific selections.

### Decisions:

- Allow multiple types in same input? Why not?
  - Requires defining onLinkDocument action per type.
- Use array type? How will this build into the existing schema resolutions.
- How to show when multiple versions of the same document have a reference to this document. Example, published and draft refers to the document, how do we remove that reference? What do we do with versions in this cases?

### Code:

- Reorganize code and divide into components, specially focus on AddIncomingReference and rename files to better express what they are doing.
