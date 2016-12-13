# @sanity/observable

[![Build Status](https://travis-ci.org/sanity-io/observable.svg?branch=master)](https://travis-ci.org/sanity-io/observable)

A small-ish RxJS based Observable implementation for Sanity

## Installation

```
npm install --save @sanity/observable
```

## Usage

```js
import Observable from '@sanity/observable'

Observable
    .of('Foo, bar, SKIP, Baz')
    .flatMap(str => str.split(/,\s*/))
    .filter(word => word !== 'SKIP')
    .map(word => word.toUpperCase())
    .flatMap(word => Promise.resolve(`prefix-${word}`))
    .subscribe(prefixedWord => {
      console.log(prefixedWord)
    })

// => 'prefix-FOO'
// => 'prefix-BAR'
// => 'prefix-BAZ'

```

## A minimal Observable

For bundle size sensitive contexts there is an absolute minimal observable implementation (still RxJS based) that can be imported from `@sanity/observable/minimal`. This observable has none of the static methods (`create`, `from`), and implements only the `map`, `filter` and `reduce` instance methods. It weighs around 3.3 KB minified and gzipped.

```js
import Observable from '@sanity/observable/minimal'

new Observable(observer => {
  ['tiger', 'lion', 'SKIP', 'cheetah'].forEach(word => {
    observer.next(word)
  })
  observer.complete()
})
  .filter(word => word !== 'SKIP')
  .map(word => word.toUpperCase())
  .reduce((wordLengths, word) => {
    wordLengths[word] = word.length
    return wordLengths
  }, {})
  .subscribe(wordLengths => {
    assert.deepEqual(wordLengths, {TIGER: 5, LION: 4, CHEETAH: 7})
  })
```


## License

MIT-licensed
