import {expect, it} from 'vitest'

import {defaultRenderingContext} from './defaultRenderingContext'

it("emits the subject if it's not `undefined`", () => {
  expect(defaultRenderingContext).toMatchEmissions([
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

it('emits the the default context if the subject is `undefined`', () => {
  expect(defaultRenderingContext).toMatchEmissions([
    [
      undefined,
      {
        name: 'default',
        metadata: {},
      },
    ],
  ])
})
