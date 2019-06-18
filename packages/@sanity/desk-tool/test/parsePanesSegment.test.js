import {parsePanesSegment} from '../src/utils/parsePanesSegment'

test('parsePanesSegment()', () => {
  ;[
    'foo;bar,{"title":"foo;heisann"};baz;banana;hei',
    'foo;bar,{"nested":{"title":"foo;heisann","number":123}};baz;banana;hei',
    'fOo,{"invalid};',
    'fOo,{"invalid}',
    'foo,;bar',
    '  ',
    'foo;bar,{"inv};',
    'foo;bar,["foo"];baz'
  ].forEach(str => {
    expect(parsePanesSegment(str)).toMatchSnapshot(`Input: ${str}`)
  })
})
