import {firstValueFrom} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {createRenderingContextStore} from './createRenderingContextStore'

describe('renderingContext', () => {
  it('emits rendering context', async () => {
    const {renderingContext} = createRenderingContextStore()

    expect(await firstValueFrom(renderingContext)).toEqual({
      name: 'default',
      metadata: {},
    })
  })
})

describe('capabilities', () => {
  it('emits capabilities', async () => {
    const {capabilities} = createRenderingContextStore()
    expect(await firstValueFrom(capabilities)).toEqual({})
  })
})
