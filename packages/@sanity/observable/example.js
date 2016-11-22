const Observable = require('./')

Observable
  .of('Foo, bar, SKIP, Baz')
  .flatMap(str => str.split(/,\s*/))
  .filter(word => word !== 'SKIP')
  .map(word => word.toUpperCase())
  .flatMap(word => Promise.resolve(`prefix-${word}`))
  .subscribe(prefixedWord => {
    console.log(prefixedWord)
  })
