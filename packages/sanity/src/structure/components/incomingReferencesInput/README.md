## TODO:

### Actions

- make actions component type, like document actions?
- Add option for a dialog or popover
- onLinkDocument action as part of the actions array?
- Add option to disable creation of new references, only link to existing.

### Query filter

- Support filter query for more specific selections. [done]

### Decisions:

- How to show when multiple versions of the same document have a reference to this document. Example, published and draft refers to the document, how do we remove that reference? What do we do with versions in this cases?
- Use array type? How will this build into the existing schema resolutions.
- How will the schema resolution handle this, this field is more of a presentation field which doesn't update the value of the document.
  - Will AI be confused by this field which represents a reference but an incoming one?
  - Maybe define it as a new type of field?
  - Disable validations on this new type of field?

### Code:

- Reorganize code and divide into components, specially focus on AddIncomingReference and rename files to better express what they are doing.

### Known bugs:

- Start a new reference creation, reference input goes into loading, then close the new pane, reference input stays in loading, it should go back to idle state.
