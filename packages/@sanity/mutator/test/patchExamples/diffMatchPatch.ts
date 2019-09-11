/* eslint-disable id-length, quote-props */

export default [
  {
    name: 'Diff match patch',
    before: {
      a: 'The rabid dog'
    },
    patch: {
      diffMatchPatch: {
        a: '@@ -1,13 +1,12 @@\n The \n-rabid\n+nice\n  dog\n'
      }
    },
    after: {
      a: 'The nice dog'
    }
  },
  {
    name: 'Diff match patch in array',
    before: {
      a: ['The rabid dog']
    },
    patch: {
      diffMatchPatch: {
        'a[0]': '@@ -1,13 +1,12 @@\n The \n-rabid\n+nice\n  dog\n'
      }
    },
    after: {
      a: ['The nice dog']
    }
  }
]
