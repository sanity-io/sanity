import {toState, toPath} from '../router'

describe('toPath', () => {
  it('takes in multiple pane groups and serializes them to a panes path for the state router', () => {
    const path = toPath([[{id: 'level1'}], [{id: 'level2'}]])
    expect(path).toBe('level1;level2')
  })

  it('takes in multiple panes groups with split panes with parameters and payload', () => {
    const input = [
      [{id: 'level1'}, {id: 'level1SplitPane'}, {id: 'level1WithParams', params: {a: 'b'}}],
      [{id: 'level2'}, {id: 'level2SplitPane'}, {id: 'level2WithPayload', payload: {foo: 'bar'}}],
    ]
    const path = toPath(input)
    expect(path).toBe(
      'level1%7Clevel1SplitPane%7Clevel1WithParams%2Ca%3Db;' +
        'level2%7Clevel2SplitPane%7Clevel2WithPayload%2CeyJmb28iOiJiYXIifQ',
    )
    expect(decodeURIComponent(path)).toBe(
      'level1|level1SplitPane|level1WithParams,a=b;' +
        'level2|level2SplitPane|level2WithPayload,eyJmb28iOiJiYXIifQ',
    )
  })

  it('omits falsy params', () => {
    const input = [[{id: 'level1', params: {a: ''}}]]
    const path = toPath(input)

    expect(path).toBe('level1')
    expect(decodeURIComponent(path)).toBe('level1')
  })

  it('(per pane group) omits duplicate IDs if same as the first split view', () => {
    const input = [[{id: 'level1'}, {id: 'differentId'}, {id: 'level1'}], [{id: 'level2'}]]
    const path = toPath(input)

    expect(path).toBe('level1%7CdifferentId%7C%2C;level2')
    expect(decodeURIComponent(path)).toBe('level1|differentId|,;level2')
  })

  it('(per pane group) omits duplicate params if same as the first split view (if not exclusiveParams)', () => {
    const input = [
      [
        {id: 'level1', params: {a: '1', b: '2', view: 'preview'}},
        {id: 'level1', params: {a: 'differentParams', b: '2'}},
        {id: 'level1', params: {a: '1', b: '2', view: 'mobile'}},
      ],
      [{id: 'level2'}],
    ]
    const path = toPath(input)

    expect(path).toBe(
      'level1%2Ca%3D1%2Cb%3D2%2Cview%3Dpreview%7C%2Ca%3DdifferentParams%7C%2Cview%3Dmobile;level2',
    )
    expect(decodeURIComponent(path)).toBe(
      'level1,a=1,b=2,view=preview|,a=differentParams|,view=mobile;level2',
    )
  })

  it('is the inverse of toState', () => {
    const input = [
      [
        {id: 'level1', params: {a: '1', b: '2'}, payload: {a: 'b'}},
        {id: 'level1', params: {a: 'changed', b: '2'}, payload: {a: 'b'}},
        {id: 'level1', params: {a: '1', b: '2'}, payload: {a: 'changed'}},
        {id: 'level1', params: {a: '1', b: '2'}, payload: {a: 'b'}},
      ],
      [{id: 'level2', params: {}, payload: undefined}],
    ]
    const path = toPath(input)
    const state = toState(path)

    expect(state).toEqual(input)
  })
})

describe('toState', () => {
  it('works with the legacy panes segments', () => {
    const input = 'level1,{"a":"b"}'
    const state = toState(input)

    expect(state).toEqual([[{id: 'level1', payload: {a: 'b'}}]])
  })

  it('creates pane groups for every `;` and split panes for every `|`', () => {
    const input = 'level1;level2|level2'
    const state = toState(input)

    expect(state).toMatchObject([
      // first level is delimited by `;`
      [{id: 'level1'}],
      // second level has two split panes denoted by `|`
      [{id: 'level2'}, {id: 'level2'}],
    ])
  })

  it('parses params and payloads delimited by `,`', () => {
    const base64 = btoa(JSON.stringify({a: 'b'}))
    const input = `level1,${base64}`
    expect(input).toBe('level1,eyJhIjoiYiJ9')
    const state = toState(input)

    expect(state).toEqual([[{id: 'level1', params: {}, payload: {a: 'b'}}]])
  })

  it('returns the first ID of the first split pane in each pane group if one is not found', () => {
    const input = `level1||`
    const state = toState(input)

    expect(state).toEqual([
      [
        {id: 'level1', params: {}},
        {id: 'level1', params: {}},
        {id: 'level1', params: {}},
      ],
    ])
  })

  it('returns the first ID of the first split pane considering different params, exclusiveParams, and payloads', () => {
    const input = `level1,a=1,b=2,view=preview,eyJhIjoiYiJ9|,a=differentParams|,`
    const state = toState(input)

    expect(state).toEqual([
      [
        {id: 'level1', params: {a: '1', b: '2', view: 'preview'}, payload: {a: 'b'}},
        {id: 'level1', params: {a: 'differentParams', b: '2'}, payload: {a: 'b'}},
        {id: 'level1', params: {a: '1', b: '2'}, payload: {a: 'b'}},
      ],
    ])
  })

  it('returns the first ID of the first split pane considering different params, exclusiveParams, payloads and non-URL-safe payloads', () => {
    const input = `level1,a=1,b=2,view=preview,eyJmb28iOiLigqzihKIifQ|,a=differentParams|,`
    const state = toState(input)

    expect(state).toEqual([
      [
        {id: 'level1', params: {a: '1', b: '2', view: 'preview'}, payload: {foo: '€™'}},
        {id: 'level1', params: {a: 'differentParams', b: '2'}, payload: {foo: '€™'}},
        {id: 'level1', params: {a: '1', b: '2'}, payload: {foo: '€™'}},
      ],
    ])
  })

  it('is the inverse of `toPath`', () => {
    const input =
      'level1,a=1,b=2,eyJhIjoiYiJ9|,a=changed,eyJhIjoiYiJ9|,eyJhIjoiY2hhbmdlZCJ9|,eyJhIjoiYiJ9;level2'
    const state = toState(input)
    const path = toPath(state)

    expect(decodeURIComponent(path)).toBe(input)
  })
})
