## @sanity/mutator
[![Build Status](https://travis-ci.org/sanity-io/mutator.svg?branch=master)](https://travis-ci.org/sanity-io/mutator)

## Features
- Sanity flavored jsonpath matching engine with flexible interface that plays well with React
- An implementation of the mutation operations of Sanity that can be applied to vanilla javascript objects, or through a flexible interface: any weird document representation you may require
- TODO: A model to track documents as they are mutated both locally and remotely through the real time query feature of Sanity

## Usage

```javascript
import {Patcher} from '@sanity/mutator'

const document = {
  a: {}
}

const patcher = new Patcher({
  set: {
    'a.b': 'My new value'
  }
})

console.log(patcher.apply(document))

=> {
  a: {
    b: 'My new value'
  }
}
```
