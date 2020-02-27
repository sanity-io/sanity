# Draft: Visual diff dev experience

## Using the Visual Diff in a Studio

In Studio context, a developer can import a component (e.g. `<VisualDiff>`) which takes two documents as props and will render a complete diff between the two documemnts.

The `<VisualDiff>` has three distinct task:
  - Resolves all Summarizers and Differs which are loaded in the Studio context, both from Sanity defaults and from third-party plugins
  - Call a function which, based on the Summarizers and the two documents, create a Change Summary which describes all the differences between the two docs.
  - Render a component which takes the Change Summary and the Differs (and probably the docs) to produce a humanly useful description of the changes.

It should be possible to pass styling and other useful UI options to the <VisualDiff> component


## Custom Summarizers and Differs

### Summarizers

As a developer, I can implement a part wherein I define my own Summarizers

A summarizer's task is to describe a distinct change which has happened between the two documemnts. A summarizer is defined per type, and returns a function which compares the data for that type and produces a change summary. This could look something like:

```
{
  string: (a, b) => {
    if (a && b && a !== b) {
      return [{operation: 'edit', type: 'string', from: a, to: b}]
    }
  }
}
```

Custom defined Summarizers override any default Summarizers for the same type. Defining a Summarizer for type `a` won't affect the presence of a Summarizer for type `b` defined elsewhere.

### Differs

As a developer, I can implement a part wherein I define my own Differs. A Differ is defined per type _and_ change operation and it's output is a user friendly rendering of a particular change. An example could look like:


```
string: {
  editText: {
    component: props => {
      const {op: operation, field, from, to} = props.item
      return (
        <div>{field} [{operation}] "{from}" --> "{to}"</div>
      )
    }
  }
}
```

Custom defined Differs override any default Differs for the same type and operation. Defining a Differ for type `a` won't affect the presence of a Summarizer for type `b` defined elsewhere.



## Change summary example

Say a `person` document has changed a value `face.nose` from `Red` to `Long`. The full summary might look something like:

```
[
  {
    "operation": "modifyField",
    "type": "object",
    "field": "face",
    "changes": [
      {
        "operation": "modifyField",
        "type": "string",
        "field": "nose",
        "changes": [
          {
            "operation": "editText",
            "type": "string",
            "path": "face.nose",
            "from": "Red",
            "to": "Long"
          }
        ]
      }
    ]
  }
]
```

Question: Would it make sense to model a change summary more "drily", in a flat array? E.g.

```
[
  {
    "operation": "remove",
    "type": "string",
    "path": "name"
  },
  {
    "operation": "editText",
    "type": "string",
    "path": "face.nose",
    "from": "Red",
    "to": "Long"
  },
  {
    "operation": "edit",
    "type": "number",
    "path": "face.eyes",
    "from": 1,
    "to": 2
  },
  {
    "operation": "set",
    "type": "object",
    "path": "job",
    "value": {
      "_ref": "job-ref-12",
      "_type": "reference"
    }
  },
  {
    "operation": "set", // I got my third bike!
    "type": "object",
    "path": "bikes[2]",
    "value": {
      "_key": "asdf876",
      "_ref": "bike-ref-123",
      "_type": "reference"
    }
  }
]
```


## There will be UI affordances to revert individual changes

## There will be a "blame" feature, which renders the username responsible along side each change

## There should be excellent docs on how to create custom summarizers/differs


