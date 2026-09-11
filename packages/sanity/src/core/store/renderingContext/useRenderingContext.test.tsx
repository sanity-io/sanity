import {render} from '@testing-library/react'
import {of, shareReplay} from 'rxjs'
import {beforeEach, expect, it, vi} from 'vitest'

import {useRenderingContextStore} from '../datastores'
import {coreUiRenderingContext} from './coreUiRenderingContext'
import {defaultRenderingContext} from './defaultRenderingContext'
import {listCapabilities} from './listCapabilities'
import {type RenderingContextStore, type StudioRenderingContext} from './types'
import {useRenderingContext} from './useRenderingContext'

vi.mock('../datastores')

const CORE_UI_SEARCH = `?_context=${encodeURIComponent(
  JSON.stringify({mode: 'core-ui', env: 'test'}),
)}`

// The same pipeline as `createRenderingContextStore`, for a given URL query string
function createStore(urlSearch: string): RenderingContextStore {
  const renderingContext = of(undefined).pipe(
    coreUiRenderingContext(urlSearch),
    defaultRenderingContext(),
    shareReplay(1),
  )
  return {renderingContext, capabilities: renderingContext.pipe(listCapabilities(), shareReplay(1))}
}

function Consumer({frames}: {frames: (StudioRenderingContext | undefined)[]}) {
  frames.push(useRenderingContext())
  return null
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('resolves the core ui rendering context in the render that mounts the consumer', () => {
  vi.mocked(useRenderingContextStore).mockReturnValue(createStore(CORE_UI_SEARCH))
  const frames: (StudioRenderingContext | undefined)[] = []

  render(<Consumer frames={frames} />)

  // no frame — and so no effect of the first commit — sees the context unresolved
  expect(frames[0]).toEqual({name: 'coreUi', metadata: {environment: 'test'}})
  expect(frames.every((frame) => frame?.name === 'coreUi')).toBe(true)
})

it('resolves the default rendering context in the render that mounts the consumer', () => {
  vi.mocked(useRenderingContextStore).mockReturnValue(createStore(''))
  const frames: (StudioRenderingContext | undefined)[] = []

  render(<Consumer frames={frames} />)

  expect(frames[0]).toEqual({name: 'default', metadata: {}})
})
