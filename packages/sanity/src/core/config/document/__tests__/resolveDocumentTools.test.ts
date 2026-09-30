import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {resolveDocumentTools, SANITY_DEFINED_TOOLS} from '../resolveDocumentTools'
import {
  type DocumentHeaderTool,
  type DocumentMenuTool,
  type DocumentToolId,
  type DocumentTool,
  SANITY_DEFINED_TOOL_IDS,
} from '../tools'

function Renderer() {
  return null
}

function OtherRenderer() {
  return null
}

const SPLIT_PANE: DocumentHeaderTool = {
  id: 'splitPane',
  placement: 'header',
  render: Renderer,
}

const FOCUS_MODE: DocumentHeaderTool = {
  id: 'focusMode',
  placement: 'header',
  render: Renderer,
}

const CLOSE_PANE: DocumentMenuTool = {
  id: 'closePane',
  placement: 'menu',
  title: 'Close pane',
  onAction: () => {},
}

const CLOSE_PANE_GROUP: DocumentMenuTool = {
  id: 'closePaneGroup',
  placement: 'menu',
  title: 'Close pane group',
  onAction: () => {},
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
    const {byId, header, menu} = resolve()

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
    expect(menu).toEqual([])
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

  it('places a contributed menu tool into the menu and not the header', () => {
    const {header, menu, byId} = resolve([...SANITY_DEFINED_TOOLS, CLOSE_PANE])

    expect(menu).toEqual([CLOSE_PANE])
    expect(header).toEqual([])
    expect(byId.get('closePane')).toEqual(CLOSE_PANE)
  })

  it('keeps menu tools in the order the resolver left them', () => {
    const {menu} = resolve([CLOSE_PANE_GROUP, ...SANITY_DEFINED_TOOLS, CLOSE_PANE])

    expect(menu.map((tool) => tool.id)).toEqual(['closePaneGroup', 'closePane'])
  })

  it('never puts a built-in or a header tool in the menu', () => {
    const {menu} = resolve([...SANITY_DEFINED_TOOLS, SPLIT_PANE, {id: 'copyActions'}])

    expect(menu).toEqual([])
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
      id: 'myPluginPin' as DocumentToolId,
      placement: 'header',
      render: Renderer,
    } satisfies DocumentHeaderTool

    const {byId, header} = resolve([...SANITY_DEFINED_TOOLS, contributed])

    expect(byId.get(contributed.id)).toEqual(contributed)
    expect(header).toEqual([contributed])
  })
})
