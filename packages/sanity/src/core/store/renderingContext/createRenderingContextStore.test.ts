import {firstValueFrom} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {createRenderingContextStore} from './createRenderingContextStore'

const CORE_UI_SEARCH = `?_context=${encodeURIComponent(
  JSON.stringify({mode: 'core-ui', env: 'test'}),
)}`

describe('renderingContext', () => {
  it('emits rendering context', async () => {
    const {renderingContext} = createRenderingContextStore()

    expect(await firstValueFrom(renderingContext)).toEqual({
      name: 'default',
      metadata: {},
    })
  })

  it('resolves the rendering context synchronously when the store is created', () => {
    expect(createRenderingContextStore().getRenderingContext()).toEqual({
      name: 'default',
      metadata: {},
    })
    expect(createRenderingContextStore(CORE_UI_SEARCH).getRenderingContext()).toEqual({
      name: 'coreUi',
      metadata: {environment: 'test'},
    })
  })
})

describe('capabilities', () => {
  it('emits capabilities', async () => {
    const {capabilities} = createRenderingContextStore()
    expect(await firstValueFrom(capabilities)).toEqual({})
  })
})
