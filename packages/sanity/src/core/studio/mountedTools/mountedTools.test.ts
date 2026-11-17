import {type RouterContextValue} from 'sanity/router'
import {describe, expect, it} from 'vitest'

import {type Tool} from '../../config/types'
import {MAX_MOUNTED_TOOLS, type MountedTool, updateMountedTools} from './mountedTools'

function makeTool(name: string): Tool {
  return {name, title: name, component: () => null}
}

function makeRouter(tool: string): RouterContextValue {
  return {state: {tool}} as unknown as RouterContextValue
}

const structure = makeTool('structure')
const presentation = makeTool('presentation')
const vision = makeTool('vision')
const media = makeTool('media')
const tools = [structure, presentation, vision, media]

describe('updateMountedTools', () => {
  it('mounts the active tool with the current router', () => {
    const router = makeRouter('structure')

    expect(updateMountedTools([], {tools, activeTool: structure, router})).toEqual([
      {tool: structure, router},
    ])
  })

  it('returns the same list when the active tool and its router are unchanged', () => {
    const router = makeRouter('structure')
    const mounted: MountedTool[] = [{tool: structure, router}]

    expect(updateMountedTools(mounted, {tools, activeTool: structure, router})).toBe(mounted)
  })

  it('records the latest router for the active tool on every navigation', () => {
    const first = makeRouter('structure')
    const second = makeRouter('structure')
    const mounted = updateMountedTools([], {tools, activeTool: structure, router: first})

    expect(updateMountedTools(mounted, {tools, activeTool: structure, router: second})).toEqual([
      {tool: structure, router: second},
    ])
  })

  it('keeps the previous tool with the router it was last active with', () => {
    const structureRouter = makeRouter('structure')
    const presentationRouter = makeRouter('presentation')
    const mounted = updateMountedTools([], {tools, activeTool: structure, router: structureRouter})

    expect(
      updateMountedTools(mounted, {tools, activeTool: presentation, router: presentationRouter}),
    ).toEqual([
      {tool: structure, router: structureRouter},
      {tool: presentation, router: presentationRouter},
    ])
  })

  it('moves a hidden tool to the end when it becomes active again, keeping the other entry frozen', () => {
    const structureRouter = makeRouter('structure')
    const presentationRouter = makeRouter('presentation')
    const structureAgain = makeRouter('structure')
    let mounted = updateMountedTools([], {tools, activeTool: structure, router: structureRouter})
    mounted = updateMountedTools(mounted, {
      tools,
      activeTool: presentation,
      router: presentationRouter,
    })

    const next = updateMountedTools(mounted, {tools, activeTool: structure, router: structureAgain})

    expect(next).toEqual([
      {tool: presentation, router: presentationRouter},
      {tool: structure, router: structureAgain},
    ])
    // the untouched entry keeps its identity, so its subtree sees a stable router context
    expect(next[0]).toBe(mounted[1])
  })

  it('drops the least recently used tool beyond the limit', () => {
    let mounted: MountedTool[] = []
    for (const tool of [structure, presentation, vision, media]) {
      mounted = updateMountedTools(mounted, {
        tools,
        activeTool: tool,
        router: makeRouter(tool.name),
      })
    }

    expect(MAX_MOUNTED_TOOLS).toBe(3)
    expect(mounted.map((entry) => entry.tool.name)).toEqual(['presentation', 'vision', 'media'])
  })

  it('honours a custom limit', () => {
    let mounted: MountedTool[] = []
    for (const tool of [structure, presentation, vision]) {
      mounted = updateMountedTools(mounted, {
        tools,
        activeTool: tool,
        router: makeRouter(tool.name),
        limit: 2,
      })
    }

    expect(mounted.map((entry) => entry.tool.name)).toEqual(['presentation', 'vision'])
  })

  it('evicts by recency of use, not by first mount', () => {
    let mounted: MountedTool[] = []
    for (const tool of [structure, presentation, vision, structure, media]) {
      mounted = updateMountedTools(mounted, {
        tools,
        activeTool: tool,
        router: makeRouter(tool.name),
      })
    }

    // structure was used again before media opened, so presentation is the one evicted
    expect(mounted.map((entry) => entry.tool.name)).toEqual(['vision', 'structure', 'media'])
  })

  it('keeps hidden tools mounted while no tool is active', () => {
    const mounted = updateMountedTools([], {
      tools,
      activeTool: structure,
      router: makeRouter('structure'),
    })

    expect(
      updateMountedTools(mounted, {tools, activeTool: undefined, router: makeRouter('missing')}),
    ).toBe(mounted)
  })

  it('matches tools by name, so re-resolved tool objects do not unmount hidden tools', () => {
    const structureRouter = makeRouter('structure')
    const presentationRouter = makeRouter('presentation')
    let mounted = updateMountedTools([], {tools, activeTool: structure, router: structureRouter})
    mounted = updateMountedTools(mounted, {
      tools,
      activeTool: presentation,
      router: presentationRouter,
    })

    // The workspace config re-resolves (e.g. the auth state emitted): same names, new objects
    const refreshedTools = tools.map((tool) => ({...tool}))
    const refreshedPresentation = refreshedTools[1]
    const next = updateMountedTools(mounted, {
      tools: refreshedTools,
      activeTool: refreshedPresentation,
      router: presentationRouter,
    })

    expect(next.map((entry) => entry.tool.name)).toEqual(['structure', 'presentation'])
    // entries point at the current tool objects, with their frozen routers intact
    expect(next[0].tool).toBe(refreshedTools[0])
    expect(next[0].router).toBe(structureRouter)
    expect(next[1].tool).toBe(refreshedPresentation)
    expect(next[1].router).toBe(presentationRouter)
  })

  it('drops tools that are no longer part of the workspace', () => {
    let mounted = updateMountedTools([], {
      tools,
      activeTool: structure,
      router: makeRouter('structure'),
    })
    mounted = updateMountedTools(mounted, {
      tools,
      activeTool: presentation,
      router: makeRouter('presentation'),
    })

    const next = updateMountedTools(mounted, {
      tools: [presentation, vision],
      activeTool: presentation,
      router: mounted[1].router,
    })

    expect(next.map((entry) => entry.tool.name)).toEqual(['presentation'])
  })
})
