import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {resolveDocumentTools, SANITY_DEFINED_TOOLS} from '../resolveDocumentTools'
import {type ContributedDocumentTool, type DocumentTool, SANITY_DEFINED_TOOL_IDS} from '../tools'

function Renderer() {
  return null
}

function OtherRenderer() {
  return null
}

const SPLIT_PANE: ContributedDocumentTool = {
  id: 'splitPane',
  placement: 'header',
  render: Renderer,
}

const FOCUS_MODE: ContributedDocumentTool = {
  id: 'focusMode',
  placement: 'header',
  render: Renderer,
}

function resolve(tools: readonly DocumentTool[] = SANITY_DEFINED_TOOLS) {
  return resolveDocumentTools(tools)
}

describe('resolveDocumentTools', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('seeds only the tools the form draws itself', () => {
    const {byId, header} = resolve()

    expect([...byId.keys()]).toEqual([
      'titleBar',
      'versionPicker',
      'copyActions',
      'inspect',
      'compareVersions',
      'inlineChanges',
      'productionPreview',
    ])
    expect(header).toEqual([])
  })

  it('leaves the structure ids out of the seed, so they resolve absent where nothing contributes them', () => {
    const {byId} = resolve()

    expect(byId.has('splitPane')).toBe(false)
    expect(byId.has('focusMode')).toBe(false)
    expect(byId.has('closePane')).toBe(false)
    expect(byId.has('closePaneGroup')).toBe(false)
  })

  it('keeps every seeded id inside the published id list', () => {
    const seeded = SANITY_DEFINED_TOOLS.map((tool) => tool.id)

    expect(SANITY_DEFINED_TOOL_IDS).toEqual(expect.arrayContaining(seeded))
  })

  it('removes a tool the resolver filtered out', () => {
    const {byId} = resolve(SANITY_DEFINED_TOOLS.filter((tool) => tool.id !== 'titleBar'))

    expect(byId.has('titleBar')).toBe(false)
    expect(byId.has('versionPicker')).toBe(true)
  })

  it('places a contributed header tool into the header', () => {
    const {header, byId} = resolve([...SANITY_DEFINED_TOOLS, SPLIT_PANE])

    expect(header).toEqual([SPLIT_PANE])
    expect(byId.get('splitPane')).toEqual(SPLIT_PANE)
  })

  it('keeps contributed tools in the order the resolver left them', () => {
    const {header} = resolve([FOCUS_MODE, ...SANITY_DEFINED_TOOLS, SPLIT_PANE])

    expect(header.map((tool) => tool.id)).toEqual(['focusMode', 'splitPane'])
  })

  it('never puts a built-in in the header', () => {
    const {header} = resolve([...SANITY_DEFINED_TOOLS, {id: 'copyActions'}])

    expect(header).toEqual([])
  })

  it('leaves the shortcut of an enabled tool alone', () => {
    const {byId} = resolve()

    expect(byId.get('inspect')).toHaveProperty('shortcut', 'Ctrl+Alt+I')
    expect(byId.get('productionPreview')).toHaveProperty('shortcut', 'Ctrl+Alt+O')
  })

  it('resolves a duplicate id to the last one, in the last position, and warns', () => {
    const {byId, header} = resolve([
      ...SANITY_DEFINED_TOOLS,
      SPLIT_PANE,
      FOCUS_MODE,
      {...SPLIT_PANE, render: OtherRenderer},
    ])

    expect(byId.get('splitPane')).toMatchObject({render: OtherRenderer})
    expect(header.map((tool) => tool.id)).toEqual(['focusMode', 'splitPane'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('`splitPane`'))
  })

  it('keeps an id it does not recognise', () => {
    const contributed = {
      id: 'myPluginPin' as ContributedDocumentTool['id'],
      placement: 'header',
      render: Renderer,
    } satisfies ContributedDocumentTool

    const {byId, header} = resolve([...SANITY_DEFINED_TOOLS, contributed])

    expect(byId.get('myPluginPin' as ContributedDocumentTool['id'])).toEqual(contributed)
    expect(header).toEqual([contributed])
  })
})
