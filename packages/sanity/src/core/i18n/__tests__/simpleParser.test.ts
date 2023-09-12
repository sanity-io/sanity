import {simpleParser} from '../simpleParser'

describe('simpleParser', () => {
  test('simple string', () => {
    expect(simpleParser('foo')).toMatchObject([{text: 'foo', type: 'text'}])
    expect(simpleParser('foo bar baz')).toMatchObject([{text: 'foo bar baz', type: 'text'}])
    expect(simpleParser('foo. This is a bar, baz')).toMatchObject([
      {type: 'text', text: 'foo. This is a bar, baz'},
    ])
  })
  test('tag characters among text', () => {
    expect(simpleParser('foo is greater than (>) bar')).toMatchObject([
      {type: 'text', text: 'foo is greater than (>) bar'},
    ])
  })
  test('self closing tags', () => {
    expect(simpleParser('foo <is/> greater than (>) bar')).toMatchObject([
      {type: 'text', text: 'foo '},
      {type: 'tagOpen', name: 'is', selfClosing: true},
      {type: 'text', text: ' greater than (>) bar'},
    ])
    expect(simpleParser('foo <is/> greater <than/> (>) bar')).toMatchObject([
      {type: 'text', text: 'foo '},
      {type: 'tagOpen', name: 'is', selfClosing: true},
      {type: 'text', text: ' greater '},
      {type: 'tagOpen', name: 'than', selfClosing: true},
      {type: 'text', text: ' (>) bar'},
    ])
  })
  test('tags with children', () => {
    expect(simpleParser('foo <em>is</em> greater than (>) bar')).toMatchObject([
      {type: 'text', text: 'foo '},
      {type: 'tagOpen', name: 'em'},
      {type: 'text', text: 'is'},
      {type: 'tagClose', name: 'em'},
      {type: 'text', text: ' greater than (>) bar'},
    ])
  })
  test('mixed', () => {
    expect(
      simpleParser('<Icon/> Your search for "<Red>{{keyword}}</Red>" took <Bold>{{time}}ms</Bold>'),
    ).toMatchObject([
      {type: 'tagOpen', name: 'Icon', selfClosing: true},
      {type: 'text', text: ' Your search for "'},
      {type: 'tagOpen', name: 'Red'},
      {type: 'text', text: '{{keyword}}'},
      {type: 'tagClose', name: 'Red'},
      {type: 'text', text: '" took '},
      {type: 'tagOpen', name: 'Bold'},
      {type: 'text', text: '{{time}}ms'},
      {type: 'tagClose', name: 'Bold'},
    ])
  })
})
