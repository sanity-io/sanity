import {removeMissingReferences} from '../src/datastores/history/createHistoryStore'

const testDoc = {
  _id: 'foo',
  _type: 'test',
  string: 'value',
  number: 123,
  bool: true,
  subObject: {
    _type: 'sub',
    nested: {
      prop: true,
      array: [
        'contents',
        {_type: 'reference', _ref: 'abc123'},
        {_type: 'nonref', someProp: 'yes-it-exists'}
      ]
    }
  },
  arrayOfStrings: ['a', 'b', 'c'],
  arrayOfObjects: [
    {_type: 'foo', prop: 'yes'},
    {_type: 'reference', _ref: 'random'},
    {_type: 'foo', prop: 'no'},
    {_type: 'reference', _ref: 'd987abc'}
  ]
}

describe('removeMissingReferences', () => {
  test('removes references to missing docs, deeply', () => {
    const existingIds = {abc123: true, d987abc: false}
    const mapped = removeMissingReferences(testDoc, existingIds)
    expect(mapped).toMatchSnapshot()
  })
})
