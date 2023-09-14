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
    expect(simpleParser('foo <Is/> greater than (>) bar')).toMatchObject([
      {type: 'text', text: 'foo '},
      {type: 'tagOpen', name: 'Is', selfClosing: true},
      {type: 'text', text: ' greater than (>) bar'},
    ])
    expect(simpleParser('foo <Is/> greater <Than/> (>) bar')).toMatchObject([
      {type: 'text', text: 'foo '},
      {type: 'tagOpen', name: 'Is', selfClosing: true},
      {type: 'text', text: ' greater '},
      {type: 'tagOpen', name: 'Than', selfClosing: true},
      {type: 'text', text: ' (>) bar'},
    ])
  })
  test('tags with children', () => {
    expect(simpleParser('foo <Em>is</Em> greater than (>) bar')).toMatchObject([
      {type: 'text', text: 'foo '},
      {type: 'tagOpen', name: 'Em'},
      {type: 'text', text: 'is'},
      {type: 'tagClose', name: 'Em'},
      {type: 'text', text: ' greater than (>) bar'},
    ])
  })

  test('valid tag names', () => {
    // tags cannot start with a number
    expect(
      simpleParser('<H2>heading</H2> <FooBar>foo bar</FooBar> <H3/> <FooBar123/> '),
    ).toMatchObject([
      {type: 'tagOpen', name: 'H2'},
      {type: 'text', text: 'heading'},
      {type: 'tagClose', name: 'H2'},
      {type: 'text', text: ' '},
      {type: 'tagOpen', name: 'FooBar'},
      {type: 'text', text: 'foo bar'},
      {type: 'tagClose', name: 'FooBar'},
      {type: 'text', text: ' '},
      {type: 'tagOpen', name: 'H3', selfClosing: true},
      {type: 'text', text: ' '},
      {type: 'tagOpen', name: 'FooBar123', selfClosing: true},
      {type: 'text', text: ' '},
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
describe('simpleParser - errors', () => {
  test('unpaired tags', () => {
    expect(() =>
      simpleParser('<Icon/> Your search for "<Red>{{keyword}}" took <Bold>{{time}}ms</Bold>'),
    ).toThrow(
      'Expected closing tag for <Red>, but found new opening tag <Bold>. Nested tags is not supported.',
    )
  })
  test('unclosed tags', () => {
    expect(() => simpleParser('foo <Icon> bar')).toThrow(
      'No matching closing tag for <Icon> found. Either make it self closing (e.g. "<Icon/>") or close it (e.g "<Icon>...</Icon>")',
    )
  })
  test('unclosed tags before another close tag', () => {
    expect(() => simpleParser('foo <Red> bar</Blue>')).toThrow(
      'Expected closing tag for <Red>, but found closing tag </Blue> instead. Make sure each opening tag has a matching closing tag.',
    )
  })
  test('tags must be title cased', () => {
    expect(() => simpleParser('foo <red> bar</Blue>')).toThrow(
      'Invalid tag "<red>". Tag names must start with an uppercase letter and can only include letters and numbers"',
    )
  })
  test('tags cant contain whitespace or special characters', () => {
    expect(() => simpleParser('foo <Em@ail> bar</Em@ail>')).toThrow(
      'Invalid tag "<Em@ail>". Tag names must start with an uppercase letter and can only include letters and numbers"',
    )
    expect(() => simpleParser('foo <Bold >bar</Bold>')).toThrow(
      'Invalid tag "<Bold >". Tag names must start with an uppercase letter and can only include letters and numbers"',
    )
  })
  test('handles tag chars at random positions', () => {
    expect(() => simpleParser('foo <> bar')).not.toThrow()
    expect(() => simpleParser('foo < or > bar')).not.toThrow()
    expect(() => simpleParser('<foo < or > bar>')).not.toThrow()
    expect(() => simpleParser('a < 1 < or > bar>')).not.toThrow()
    expect(() => simpleParser('0 <2 > 1')).not.toThrow()
  })
})
