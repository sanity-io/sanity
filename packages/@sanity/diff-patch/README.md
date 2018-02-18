# @sanity/diff-patch

Generates a patch of operations needed to change an item from shape to another.

## Getting started

    npm install --save @sanity/diff-patch

## Usage

```js
import diffPatch from '@sanity/diff-patch'

const patch = diffPatch(itemA, itemB)
// { set: {...}, unset: [...]}
```

## Example usage

```js
import diffPatch from '@sanity/diff-patch'
import sanityClient from './myConfiguredSanityClient'

const itemA = {
  _id: 'die-hard-iii',
  _type: 'movie',
  name: 'Die Hard 3',
  year: 1995,
  characters: [
    {
      _key: 'ma4sg31',
      name: 'John McClane'
    },
    {
      _key: 'l13ma92',
      name: 'Simon Gruber'
    }
  ]
}

const itemB = {
  _id: 'die-hard-iii',
  _type: 'movie',
  name: 'Die Hard with a Vengeance',
  characters: [
    {
      _key: 'ma4sg31',
      name: 'John McClane'
    },
    {
      _key: 'l13ma92',
      name: 'Simon Grüber'
    }
  ]
}

const patch = diffPatch(itemA, itemB)
await sanityClient.patch(itemA._id, patch).commit()

// Patch generated:
const generatedPatch = {
  set: {
    'name': 'Die Hard with a Vengeance',
    'characters[_key=="l13ma92"].name': 'Simon Grüber'
  },
  unset: ['year']
}
```

## Needs checking/improvement

* Using keys are a bit tricky:
  * How do we detect a move, and which patch operation should we use?
  * If new items are added, there are no efficient ways that I can think of in which we
    can insert at correct locations. For one, we don't support multiple insert patches,
    secondly there are no way to reference paths provided by the same patch:
    If an array currently has [a, z] and we want to insert two new items, [b, c] after `a`,
    the b-item can use a "insert after a"-patch, but the second (c) can't use a
    "insert after b"-patch, as far as I can tell.
