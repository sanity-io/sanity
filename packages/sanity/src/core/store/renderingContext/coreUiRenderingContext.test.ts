import {expect, it} from 'vitest'

import {coreUiRenderingContext} from './coreUiRenderingContext'

const coreUiProductionContext = {
  mode: 'core-ui',
  env: 'production',
}

const coreUiStagingContext = {
  mode: 'core-ui',
  env: 'staging',
}

const coreUiUnsupportedContext = {
  mode: 'evil-mode',
  env: 'production',
}

it('ignores the `_context` URL search parameter if the mode is not "core-ui"', () => {
  expect(() => coreUiRenderingContext(urlSearch(coreUiUnsupportedContext))).toMatchEmissions([
    [undefined, undefined],
  ])
})

it('parses the `_context` URL search parameter', () => {
  expect(() => coreUiRenderingContext(urlSearch(coreUiProductionContext))).toMatchEmissions([
    [
      undefined,
      {
        name: 'coreUi',
        metadata: {
          environment: 'production',
        },
      },
    ],
  ])

  expect(() => coreUiRenderingContext(urlSearch(coreUiStagingContext))).toMatchEmissions([
    [
      undefined,
      {
        name: 'coreUi',
        metadata: {
          environment: 'staging',
        },
      },
    ],
  ])
})

it('fails gracefully if the `_context` URL search parameter cannot be parsed', () => {
  const invalidCoreUiContextString = urlSearch(coreUiProductionContext).slice(0, -10)

  expect(() => coreUiRenderingContext(invalidCoreUiContextString)).toMatchEmissions([
    [undefined, undefined],
  ])
})

function urlSearch(context: unknown): string {
  return new URLSearchParams({
    _context: JSON.stringify(context),
  }).toString()
}
