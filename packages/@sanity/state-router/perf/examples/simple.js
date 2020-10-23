exports.routes = [
  '/',
  [
    ['something/:something'],
    ['otherthing/:otherthing', [['sub-otherthing/:cow', [['/sub-sub/:sheep']]]]],
  ],
]

exports.states = [
  ['/', {}],
  ['/something/foo', {something: 'foo'}],
  ['/otherthing/anotherthing', {otherthing: 'anotherthing'}],
  [
    '/otherthing/anotherthing/sub-otherthing/moo',
    {
      otherthing: 'anotherthing',
      cow: 'moo',
    },
  ],
  [
    '/otherthing/anotherthing/sub-otherthing/moo/sub-sub/baah',
    {
      otherthing: 'anotherthing',
      cow: 'moo',
      sheep: 'baah',
    },
  ],
].slice(0, 1)
