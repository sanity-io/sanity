import {describe, expect, it} from 'vitest'

import {definePlugin} from '../definePlugin'
import {flattenConfig} from '../flattenConfig'

const namesOf = (entries: ReturnType<typeof flattenConfig>) =>
  entries.map(({config}) => config.name)

describe('flattenConfig', () => {
  it('returns only the root config when plugins are omitted', () => {
    const flattened = flattenConfig({name: 'root'}, [])

    expect(namesOf(flattened)).toEqual(['root'])
    expect(flattened[0].path).toEqual(['root'])
    expect(flattened[0].config).toMatchObject({name: 'root'})
  })

  it('returns only the root config when plugins is an empty array', () => {
    const flattened = flattenConfig({name: 'root', plugins: []}, [])

    expect(namesOf(flattened)).toEqual(['root'])
    expect(flattened[0].path).toEqual(['root'])
  })

  it('applies nested plugins before their parent and the parent before the root', () => {
    const grandchild = definePlugin({name: 'grandchild'})
    const child = definePlugin({name: 'child', plugins: [grandchild()]})
    const flattened = flattenConfig({name: 'root', plugins: [child()]}, [])

    expect(namesOf(flattened)).toEqual(['grandchild', 'child', 'root'])
    expect(flattened.map(({path}) => path)).toEqual([
      ['root', 'child', 'grandchild'],
      ['root', 'child'],
      ['root'],
    ])
  })

  it('prefixes every path with the provided path argument', () => {
    const child = definePlugin({name: 'child'})
    const flattened = flattenConfig({name: 'root', plugins: [child()]}, ['workspace'])

    expect(flattened.map(({path}) => path)).toEqual([
      ['workspace', 'root', 'child'],
      ['workspace', 'root'],
    ])
  })

  it('keeps sibling plugins in declaration order', () => {
    const first = definePlugin({name: 'first'})
    const second = definePlugin({name: 'second'})
    const flattened = flattenConfig({name: 'root', plugins: [first(), second()]}, [])

    expect(namesOf(flattened)).toEqual(['first', 'second', 'root'])
  })

  it('strips scheduled-publishing plugins and injects the deprecated stub before the root', () => {
    const scheduledPublishing = definePlugin({name: 'scheduled-publishing'})
    const flattened = flattenConfig({name: 'root', plugins: [scheduledPublishing()]}, [])

    expect(namesOf(flattened)).toEqual(['sanity/deprecated/scheduled-publishing', 'root'])
    expect(flattened[0].path).toEqual(['root', 'scheduled-publishing'])
    expect(flattened[0].config.studio?.components?.layout).toEqual(expect.any(Function))
  })

  it('does not strip the built-in sanity/scheduled-publishing plugin', () => {
    const builtIn = definePlugin({name: 'sanity/scheduled-publishing'})
    const flattened = flattenConfig({name: 'root', plugins: [builtIn()]}, [])

    expect(namesOf(flattened)).toEqual(['sanity/scheduled-publishing', 'root'])
  })

  it('injects a single deprecated stub when scheduled-publishing appears more than once', () => {
    const scheduledPublishing = definePlugin({name: 'scheduled-publishing'})
    const flattened = flattenConfig(
      {name: 'root', plugins: [scheduledPublishing(), scheduledPublishing()]},
      [],
    )

    expect(namesOf(flattened)).toEqual(['sanity/deprecated/scheduled-publishing', 'root'])
    expect(flattened[0].path).toEqual(['root', 'scheduled-publishing'])
  })

  it('keeps nested plugins of a stripped scheduled-publishing plugin', () => {
    const nested = definePlugin({name: 'nested'})
    const scheduledPublishing = definePlugin({
      name: 'scheduled-publishing',
      plugins: [nested()],
    })
    const flattened = flattenConfig({name: 'root', plugins: [scheduledPublishing()]}, [])

    expect(namesOf(flattened)).toEqual(['nested', 'sanity/deprecated/scheduled-publishing', 'root'])
    expect(flattened[0].path).toEqual(['root', 'scheduled-publishing', 'nested'])
  })

  it('does not strip a root config named scheduled-publishing', () => {
    const flattened = flattenConfig({name: 'scheduled-publishing'}, [])

    expect(namesOf(flattened)).toEqual(['scheduled-publishing'])
    expect(flattened[0].path).toEqual(['scheduled-publishing'])
  })
})
