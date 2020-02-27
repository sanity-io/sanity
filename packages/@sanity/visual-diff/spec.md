# Specification draft: Visual diff

## Using the Visual Diff in a Studio

In Studio context, a developer can import a component (e.g. `<VisualDiff>`) which takes two versions of a document as props and renders a complete diff.

The `<VisualDiff>` component does three things:

  1. Resolve all Summarizers and Differs which are loaded in the Studio context, both from Sanity defaults and from third-party plugins
  2. Call a function (currently located in `bateson.js`) which, based on the Summarizers and the two document versions, creates a Change Summary which describes all the differences between the two docs. See "The Change Summary" below for more details.
  3. Render a component which takes the Change Summary and the Differs (and probably the two document versions) and produces sweet, humanly grokable, description of all the changes.

It should be possible to pass styling and other useful UI options to the <VisualDiff> component.


## Custom Summarizers and Differs

### Summarizers

A developer can implement a part to define custom Summarizers. A Summarizer's task is to describe a distinct change which has happened between the two documents. A Summarizer is defined per type, and returns a function which compares the data for that type and produces a change summary. This could look something like:

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

A developer can implement a part to define custom Differs. A Differ is defined per type _and_ change operation and it's output is a user friendly rendering of a particular change. An example could look like:


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

Defining Custom Differs will override any default Differs for the same type _and_ operation. Defining a Differ for type `a.operationX` won't affect the presence of a Summarizer `a.operationY` defined elsewhere.



## The Change Summary

Say a `person` document has changed the value on key `face.nose` from `Red` to `Long`. The current POC summary machine (`bateson.js`) outputs a nested structure like this:

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
            "from": "Red",
            "to": "Long"
          }
        ]
      }
    ]
  }
]
```

**However**: It could make sense to model the change summary more "drily", as a flat array. The above nested structure could described by a single element:

```
[
  {
    "operation": "editText",
    "type": "string",
    "path": "face.nose",
    "from": "Red",
    "to": "Long"
  }
]
```


Here are some other examples of a flat output:

```
[
  {
    "operation": "remove", // I'm now nameless
    "type": "string",
    "path": "name"
  },
  {
    "operation": "edit", // I grew another eye!
    "type": "number",
    "path": "face.eyes",
    "from": 1,
    "to": 2
  },
  {
    "operation": "set", // I got a job!
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
  },
  {
    "operation": "editText", // I swapped some bike for another
    "type": "string",
    "path": "bikes[_key=yuio2345]._ref",
    "from": "bike-ref-888",
    "to": "bike-ref-999"
    }
  }
]
```

(Regarding the last bike-swap summary, the developer would probably write a custom summarizer and a custom differ in order to get a more useful visual diff)

A flat array is easier for developers to understand, debug and adapt their own code to. And, if we iterate through the compiled schema while rendering changes, the `path` provided on a summary should be suficcient to both understand each change that has occurred and render these in a nested or flat fashion, depending on what we want.


## There will be UI affordances to revert individual changes

Each distinct change summary should be enough to generate a "revert patch". A button will enable the user to apply that patch.

## There will be a "blame" feature, which renders the username responsible along side each change

Hook up to the Mendoza stuff to enable this

## There should be excellent docs on how to create custom summarizers/differs

`!important`


