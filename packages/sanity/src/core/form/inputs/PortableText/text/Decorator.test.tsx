import {type Path} from '@sanity/types'
import {toString as pathToString} from '@sanity/util/paths'
import {render} from '@testing-library/react'
import {type ComponentProps} from 'react'
import {expect, it, vi} from 'vitest'

import {Decorator} from './Decorator'

vi.mock('@portabletext/editor', () => ({
  useEditor: () => ({
    getSnapshot: () => ({context: {value: []}}),
  }),
}))

vi.mock('@portabletext/sanity-bridge', () => ({
  getSanitySubSchema: () => ({decorators: []}),
}))

vi.mock('../contexts/PortableTextMemberSchemaTypes', () => ({
  usePortableTextMemberSchemaTypes: () => ({portableText: {}}),
}))

const SHARED_DECORATOR_PATH: Path = [
  {_key: 'sharedWarningBlock'},
  'children',
  {_key: 'sharedWarningSpan'},
]

type DecoratorRenderProps = Omit<ComponentProps<typeof Decorator>, 'portableTextPath'>

const DECORATOR_PROPS = {
  children: <span>schema-less decorator</span>,
  editorElementRef: {current: null},
  focused: false,
  path: SHARED_DECORATOR_PATH,
  schemaType: {name: 'regressionDecorator'} as DecoratorRenderProps['schemaType'],
  selected: false,
  value: 'regressionDecorator',
} satisfies DecoratorRenderProps

it('warns once for identical decorator locations in separate form fields', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

  try {
    render(
      <>
        <Decorator {...DECORATOR_PROPS} portableTextPath={['primaryBody']} />
        <Decorator {...DECORATOR_PROPS} portableTextPath={['secondaryBody']} />
      </>,
    )

    const expectedWarnings = ['primaryBody', 'secondaryBody'].map((fieldName) => {
      const qualifiedPath = pathToString([fieldName, ...SHARED_DECORATOR_PATH])
      return `Could not find schema type for decorator: regressionDecorator at ${qualifiedPath}`
    })
    const relevantWarnings = warnSpy.mock.calls
      .map(([message]) => message)
      .filter((message) => typeof message === 'string' && message.includes('regressionDecorator'))

    expect(relevantWarnings).toHaveLength(expectedWarnings.length)
    expect(relevantWarnings).toEqual(expect.arrayContaining(expectedWarnings))
  } finally {
    warnSpy.mockRestore()
  }
})
