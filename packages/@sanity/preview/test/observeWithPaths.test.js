import {combineSelections, reassemble, toGradientQuery} from '../src/utils/optimizeQuery'

const INPUT = [
  ['doc1', ['fieldA', 'fieldB', 'fieldC.fieldCA']],
  ['doc2', ['fieldA', 'fieldB', 'fieldC.fieldCA']],
  ['doc7', ['fieldX', 'fieldY']],
  ['doc3', ['fieldA', 'fieldB', 'fieldC.fieldCA']]
]

const RESULTS = {
  doc1: {
    _id: 'doc1',
    _type: 'foo',
    fieldA: 'valueOfFieldA',
    fieldB: 'valueOfFieldB',
    fieldC: {fieldCA: 'valueOfFieldC.fieldCA'}
  },
  doc2: {
    _id: 'doc2',
    _type: 'foo',
    fieldA: 'valueOfFieldA',
    fieldB: 'valueOfFieldB',
    fieldC: {fieldCA: 'valueOfFieldC.fieldCA'}
  },
  doc3: {
    _id: 'doc3',
    _type: 'foo',
    fieldA: 'valueOfFieldA',
    fieldB: 'valueOfFieldB',
    fieldC: {fieldCA: 'valueOfFieldC.fieldCA'}
  },
  doc7: {
    _id: 'doc7',
    _type: 'other',
    fieldX: 'valueOfFieldX',
    fieldY: 'valueOfFieldY'
  }
}

const MOCKED_QUERY_RESULT = [
  [RESULTS.doc2, RESULTS.doc1, RESULTS.doc3], // note: out of order
  [RESULTS.doc7]
]

test('combineSelections()', () => {
  expect(combineSelections(INPUT)).toEqual([
    {
      fields: ['fieldA', 'fieldB', 'fieldC.fieldCA'],
      ids: ['doc1', 'doc2', 'doc3'],
      map: [0, 1, 3]
    },
    {fields: ['fieldX', 'fieldY'], ids: ['doc7'], map: [2]}
  ])
})

test('toGradientQuery()', () => {
  expect(toGradientQuery(combineSelections(INPUT))).toEqual(
    '[*[_id in ["doc1","doc2","doc3"]][0...3]{_id,_rev,_type,fieldA,fieldB,fieldC.fieldCA},*[_id in ["doc7"]][0...1]{_id,_rev,_type,fieldX,fieldY}][0...2]'
  )
})

test('reassemble()', () => {
  expect(reassemble(MOCKED_QUERY_RESULT, combineSelections(INPUT))).toEqual([
    RESULTS.doc1,
    RESULTS.doc2,
    RESULTS.doc7,
    RESULTS.doc3
  ])
})
