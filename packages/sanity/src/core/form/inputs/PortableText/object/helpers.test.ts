import {type ObjectSchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {_getModalOption, _withLegacyMarkdownArgs} from './helpers'

const withModal = (modal: unknown): ObjectSchemaType =>
  ({options: {modal}}) as unknown as ObjectSchemaType

describe('_getModalOption', () => {
  it('returns undefined when no modal option is set', () => {
    expect(_getModalOption({} as ObjectSchemaType)).toBeUndefined()
    expect(_getModalOption({options: {}} as unknown as ObjectSchemaType)).toBeUndefined()
  })

  it('returns the default width (1) when modal is set without a width', () => {
    // Regression test for the narrow annotation popover: an unspecified width must
    // resolve to a real container width — previously an empty array bypassed the edit
    // dialog width defaults and collapsed the popover to auto width.
    const result = _getModalOption(withModal({type: 'popover'}))
    expect(result?.type).toBe('popover')
    expect(result?.width).toEqual([1])
  })

  it('returns an undefined width (not an empty array) for an explicit empty width array', () => {
    // An empty responsive array still falls through to the edit dialog width defaults.
    const result = _getModalOption(withModal({type: 'popover', width: []}))
    expect(result?.width).toBeUndefined()
  })

  it('parses an explicit numeric width', () => {
    expect(_getModalOption(withModal({type: 'popover', width: 1}))?.width).toEqual([1])
  })

  it('parses a responsive width array', () => {
    expect(_getModalOption(withModal({type: 'dialog', width: [0, 1, 2]}))?.width).toEqual([0, 1, 2])
  })

  it("parses an 'auto' width", () => {
    expect(_getModalOption(withModal({width: 'auto'}))?.width).toEqual(['auto'])
  })

  it('ignores an invalid modal type', () => {
    expect(_getModalOption(withModal({type: 'sidebar'}))?.type).toBeUndefined()
  })
})

describe('_withLegacyMarkdownArgs', () => {
  const schema = {decorators: [{name: 'strong'}]}

  type BoldDecoratorField = {
    boldDecorator: (arg: {context: {schema: typeof schema}}) => unknown
  }
  type HeadingStyleField = {
    headingStyle: (arg: {context: {schema: typeof schema}; props: {level: number}}) => unknown
  }

  it('feeds an old-shape callback a `schema` merged in from `context.schema`', () => {
    const oldShape = ({schema: s}: {schema: unknown}) => s
    const wrapped = _withLegacyMarkdownArgs<BoldDecoratorField>({boldDecorator: oldShape})

    // Simulates the plugin calling the callback with only `context`, as it does
    // once the deprecated top-level `schema` param is removed.
    expect(wrapped.boldDecorator({context: {schema}})).toBe(schema)
  })

  it('an old-shape callback called directly (unwrapped) gets `undefined` for `schema`', () => {
    const oldShape = ({schema: s}: {context?: unknown; schema?: unknown}) => s

    // Same call shape as above, but skipping `_withLegacyMarkdownArgs`: this is
    // what breaks once the plugin stops passing the deprecated top-level `schema`.
    expect(oldShape({context: {schema}})).toBeUndefined()
  })

  it('feeds an old-shape `headingStyle` callback a `level` merged in from `props.level`', () => {
    const oldShape = ({level}: {level: number}) => level
    const wrapped = _withLegacyMarkdownArgs<HeadingStyleField>({headingStyle: oldShape})

    expect(wrapped.headingStyle({context: {schema}, props: {level: 2}})).toBe(2)
  })

  it('passes a new-shape callback through unharmed', () => {
    const newShape = ({context}: {context: {schema: typeof schema}}) => context.schema
    const wrapped = _withLegacyMarkdownArgs<BoldDecoratorField>({boldDecorator: newShape})

    expect(wrapped.boldDecorator({context: {schema}})).toBe(schema)
  })

  it('passes a non-function field through untouched', () => {
    const wrapped = _withLegacyMarkdownArgs<{enabled: boolean}>({enabled: false})

    expect(wrapped.enabled).toBe(false)
  })

  it('wraps the same callback reference to the same wrapped function across separate calls', () => {
    // The plugin keys its behaviors on callback identity, so a config rebuilt from
    // scratch on every render (the documented spread-and-override pattern) must still
    // produce the same wrapped function for the same underlying callback, or every
    // render re-registers the plugin's behaviors.
    const boldDecorator = ({context}: {context: {schema: typeof schema}}) => context.schema

    const first = _withLegacyMarkdownArgs<BoldDecoratorField>({boldDecorator})
    const second = _withLegacyMarkdownArgs<BoldDecoratorField>({boldDecorator})

    expect(second.boldDecorator).toBe(first.boldDecorator)
  })
})
