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
* Better object-move semantics (based on \_key)
