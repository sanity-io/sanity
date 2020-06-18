## @sanity/mutator

## Features

* Sanity flavored jsonpath matching engine with flexible interface that plays
  well with React
* An implementation of the mutation operations of Sanity that can be applied to
  vanilla javascript objects, or through a flexible interface: any weird
  document representation you may require
* TODO: A model to track documents as they are mutated both locally and remotely
  through the real time query feature of Sanity
* Note: If `patch.id` doesn't match `document._id`, the patch will be ignored
  during `apply`.

## Usage

```javascript
import {Patcher} from '@sanity/mutator'

const document = {
  _id: 'a1b2c3',
  a: {}
}

const patcher = new Patcher({
  id: 'a1b2c3',
  set: {
    'a.b': 'My new value'
  }
})

console.log(patcher.apply(document))

=> {
  _id: 'a1b2c3',
  a: {
    b: 'My new value'
  }
}
```
