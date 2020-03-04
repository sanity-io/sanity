# Specification draft: Visual diff

## Using the Visual Diff in a Studio

In Studio context, a developer can import a component (e.g. `<VisualDiff>`) which takes two versions of a document as props and renders a complete diff.

The `<VisualDiff>` component does three things:

  1. Resolve all Summarizers and Visualizers which are loaded in the Studio context, both from Sanity defaults and from third-party plugins
  2. Call a function (currently located in `bateson.js`) which, based on the Summarizers and the two document versions, creates a Change Summary which describes all the differences between the two docs. See "The Change Summary" below for more details.
  3. Render a component which takes the Change Summary and the Visualizers (and probably the two document versions) and produces sweet, humanly grokable, description of all the changes.

It should be possible to pass styling and other useful UI options to the <VisualDiff> component.

## Custom Summarizers and Visualizers

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

### Visualizers

A developer can implement a part to define custom Visualizers. A Visualizer is defined per type _and_ change operation and it's output is a user friendly rendering of a particular change. An example could look like:

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

Defining Custom Visualizers will override any default Visualizers for the same type _and_ operation. Defining a Visualizer for type `a.operationX` won't affect the presence of a Visualizer `a.operationY` defined elsewhere.

## The Change Summary

Say a `person` document has changed the value on key `face.nose` from `Red` to `Long`. The current POC summary machine (`bateson.js`) outputs a nested structure like this:

```
[
  {
    "op": "modifyField",
    "type": "object",
    "field": "face",
    "changes": [
      {
        "op": "modifyField",
        "type": "string",
        "field": "nose",
        "changes": [
          {
            "op": "editText",
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

(Regarding the last bike-swap summary, the developer would probably write a custom summarizer and a custom visualizer in order to get a more useful visual diff)

A flat array is easier for developers to understand, debug and adapt their own code to. And, if we iterate through the compiled schema while rendering changes, the `path` provided on a summary should be suficcient to both understand each change that has occurred and render these in a nested or flat fashion, depending on what we want.

We should be able to access JavaScript objects with only the path. We could potentially use `lodash`s `get` method for that. If not (as `_key=something` might not be supported), we could do it manually by traversing the object and at the same time, supoort the `_key` syntax.

## There will be UI affordances to revert individual changes

Each distinct change summary should be enough to generate a "revert patch". A button will enable the user to apply that patch.

That said, that could bloat the contract (summarizers), as one would need to keep that information if you were to implement your own summarizer.

Let's say we use the flattened array approach. A change might look like this with the default summarizers:

```
[
  {
    "operation": "editText",
    "type": "string",
    "path": "image.asset._ref",
    "from": "image-ref-123",
    "to": "image-ref-456"
  }
]
```

If one were to create a custom summarizer for `image`, the contract could potentially end up as this:

```
[
  {
    "operation": "replaceImage",
    "type": "image",
    "path": "image", // Old: image.asset._ref. Could potentially use this to keep information to build the revert
    "from": "image-ref-123",
    "to": "image-ref-456"
  }
]
```

This will make it impossible for the machinery we create to build a revert for the `_ref` field. So how will we solve this? We could potentially make the users add a `revert` key on the summarizer output, which contains all the information needed to revert the change like this:

```
[
  {
    "operation": "replaceImage",
    "type": "image",
    "path": "image", // Old: image.asset._ref. Could potentially use this to keep information to build the revert
    "from": "image-ref-123",
    "to": "image-ref-456",
    "revert": {
      "operation": "editText",
      "type": "string",
      "path": "image.asset._ref",
      "from": "image-ref-123", // This might not necessarily be the same as `parent.from`
      "to": "image-ref-456" // This might not necessarily be the same as `parent.to`
    }
  }
]
```

That way we could easily build the revert, but it would bloat the contract, and seems very intrusive. We feel like the diffs themselves should be enough to construct whatever information/actions you need to show/do from this.

---

Another approach would be for the user to create their own reverter, much alike custom summarizers, as the kind of go hand-in-hand when overriding the summarizer, as the machinery wouldn't necessarily know how to revert your custom summarizer. This is very brittle, as if the create your own summarizer and later change it, you would need to remember in your brain to change the reverter accordingly. Let's take an example:

If I were to change this custom summarizer from:

```
{
  image: (a, b) => {
    if (a.asset && b.asset && a.asset._ref !== b.asset._ref) {
      return [{op: 'replaceImage', from: a.asset._ref, to: b.asset._ref}]
    }
    return null
  }
}
```

to:

```
{
  image: (a, b) => {
    if (a.asset && b.asset && a.asset._ref !== b.asset._ref) {
      return [{op: 'replaceImage', from: a.asset, to: b.asset}]
    }
    return null
  }
}
```

Since I have changed the contract here, I would also need to change the reverter to know that the `from` and `to` field doesn't contain the `_ref` anymore. It contains the asset itself, and not the full path. We need to make this very smooth.


## There will be a "blame" feature, which renders the username responsible along side each change

Hook up to the Mendoza stuff to enable this

## There should be excellent docs on how to create custom summarizers/visualizers

`!important`

## Challenges

* What happens if image summarizer is defined, but I, as a user, don't want to take control over other fields inside that type?
* How does the custom summarizer communicate which keys/types it can't handle?
* (How) do we handle multiple summarizers for the same type?
  * --> specificity
* [x] Rename differs to visualizers
* [x] The hierarchy can be contructed when a flattened array is used, as we can traverse the schema
* Reverting
    * If not revert function (receives a and b) defined for the type, use default revert based on path
* How do we handle data which doesn't match the current schema? E.g. docA has a different (typically unmigrated data) structure than docB
* Should we support that a summarizer can return `fields: ['key.otherKey']`?
* apply path key to all summaries
  * agree on summary shape

## Notes

```
zoo: {
  keeper: {
    name: 'Alice',
    age: '33',
    face: {
      nose: {
        color: 'red'
      },
      hasFreckles: true
    }
  },
  giraffe: {
    name: 'Zanzibar',
    age: '15',
    face: {
      nose: {
        color: 'pink'
      }
    },
    horns: 'yellow with knobs'
  }
}
```

```
const summarizers = {
  zoo: {
    resolve: (a, b, summarize) => {
      if (i dont want to handle this) {
        summarize()
      }
      return [{operation: 'editText', path: 'zoo.keeper.name', change: {from: 'Alice', to: 'Alfred'}}]
    },
    fields: ['zoo.keeper.name', 'zoo.keeper.face.nose']
  }
}

const summarizers = {
  face: {
    resolve: (a, b, path) => {
      return [{operation: 'editText', path: 'zoo.keeper.face.nose', change: {from: 'red', to: 'long'}}]
    },
    fields: ['face.nose', 'face.hasFreckles']
  }
}
```

* Bateson adds absolute path to all summarizer objects
* On startup, we should check for duplicate summarizers. What do we do? Give a warning and use the latest one, or fail?

- look up summarizers for type
- can it handle the current path?
- receive summarizers and handled fields
- record handled fields and keep nesting json remains

