import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, screen} from '@testing-library/react'
import * as embedded from 'sanity/_unstable-embedded'
import * as i18nEntry from 'sanity/_unstable-i18n'
import {describe, expect, it} from 'vitest'

import {getMockWorkspace} from './testUtils/getMockWorkspaceFromConfig'

const theme = buildTheme()

function Probe() {
  const {t} = i18nEntry.useTranslation()
  const locale = i18nEntry.useCurrentLocale()
  const year = i18nEntry
    .useDateTimeFormat({year: 'numeric', timeZone: 'UTC'})
    .format(new Date('2020-01-01T00:00:00Z'))

  return (
    <div data-testid="probe">
      {locale.id} {year} {t('common.loading')}{' '}
      <i18nEntry.Translate t={t} i18nKey="inputs.array.action.add-item" />
    </div>
  )
}

describe('sanity/_unstable-i18n', () => {
  it('re-exports the same bindings as sanity/_unstable-embedded', () => {
    const exports = Object.entries(i18nEntry)
    const embeddedExports = new Map(Object.entries(embedded))

    expect(exports.map(([name]) => name).toSorted()).toEqual([
      'Translate',
      'useCurrentLocale',
      'useDateTimeFormat',
      'useRelativeTime',
      'useTranslation',
    ])
    for (const [name, value] of exports) {
      expect(embeddedExports.get(name), name).toBe(value)
    }
  })

  it('resolves translations and the locale from the embedded LocaleProvider', async () => {
    const workspace = await getMockWorkspace()

    render(
      <ThemeProvider theme={theme}>
        <embedded.WorkspaceProvider workspace={workspace}>
          <embedded.SourceProvider source={workspace.unstable_sources[0]}>
            <embedded.LocaleProvider>
              <Probe />
            </embedded.LocaleProvider>
          </embedded.SourceProvider>
        </embedded.WorkspaceProvider>
      </ThemeProvider>,
    )

    expect(await screen.findByTestId('probe')).toHaveTextContent('en-US 2020 Loading Add item')
  })
})
