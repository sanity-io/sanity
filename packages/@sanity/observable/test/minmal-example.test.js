const {test} = require('tap')
const Observable = require('../src/SanityObservableMinimal')

test('it works', t => {
  new Observable(observer => {
    ;['tiger', 'lion', 'SKIP', 'cheetah'].forEach(word => {
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
      t.same(wordLengths, {TIGER: 5, LION: 4, CHEETAH: 7})
      t.end()
    })
})
