import {defaultRenderingContext} from './defaultRenderingContext'
import {expect, it} from 'vitest'

it("emits the subject if it's not `undefined`", async () => {
  await expect(defaultRenderingContext).toMatchEmissions([
    [
      {
        name: 'coreUi',
        metadata: {
          environment: 'production',
        },
      },
      {
        name: 'coreUi',
        metadata: {
          environment: 'production',
        },
      },
    ],
  ])
})

it('emits the the default context if the subject is `undefined`', async () => {
  await expect(defaultRenderingContext).toMatchEmissions([
    [
      undefined,
      {
        name: 'default',
        metadata: {},
      },
    ],
  ])
})
