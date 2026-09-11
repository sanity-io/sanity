// The ui5 reset is what leaves the document at `color-scheme: light dark`; the studio entry point
// loads it, so load it here too.
import 'ui5/styles.css'

import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ColorSchemeValueContext} from 'sanity/_singletons'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'

import {type Workspace} from '../../config/types'
import {type StudioColorScheme} from '../../theme/types'
import {ColorSchemeProvider} from '../colorScheme'
import {GlobalStyle} from '../GlobalStyle'
import {WorkspaceProvider} from '../workspace'

// `GlobalStyle` reads one workspace flag; nothing else of the workspace takes part here
const workspace = {advancedVersionControl: {enabled: false}} as unknown as Workspace

// ui5 tokens are `light-dark()` values, which resolve against the document colour scheme: the probe
// shows which side such a token would take.
const LIGHT = 'rgb(1, 2, 3)'
const DARK = 'rgb(4, 5, 6)'

function Harness({scheme}: {scheme: StudioColorScheme}) {
  return (
    <WorkspaceProvider workspace={workspace}>
      <ColorSchemeProvider scheme={scheme}>
        <GlobalStyle />
        <span data-testid="probe" style={{color: `light-dark(${LIGHT}, ${DARK})`}} />
      </ColorSchemeProvider>
    </WorkspaceProvider>
  )
}

function documentColorScheme() {
  return getComputedStyle(document.documentElement).colorScheme
}

function probeColor() {
  return getComputedStyle(document.querySelector('[data-testid="probe"]')!).color
}

// The `html:root { color-scheme }` rules as injected (styled-components appends text in
// development and inserts rules through the CSSOM in production, so read both)
function injectedRootRules() {
  return Array.from(document.querySelectorAll('style'))
    .map(
      (style) =>
        style.textContent +
        Array.from(style.sheet?.cssRules ?? [])
          .map((rule) => rule.cssText)
          .join(''),
    )
    .join('\n')
    .match(/html:root\s*\{[^}]*\}/g)
}

describe('GlobalStyle', () => {
  it('starts from the ui5 reset, which lets the OS decide', () => {
    expect(documentColorScheme()).toBe('light dark')
  })

  it('leaves both schemes allowed until the persisted scheme is known', async () => {
    // What `ColorSchemeLocalStorageProvider` hands out in the render before its store has
    // initialized: nothing, despite the type
    await render(
      <WorkspaceProvider workspace={workspace}>
        <ThemeProvider theme={buildTheme()}>
          <ColorSchemeValueContext.Provider value={undefined as never}>
            <GlobalStyle />
          </ColorSchemeValueContext.Provider>
        </ThemeProvider>
      </WorkspaceProvider>,
    )

    // an explicit rule — an unknown value must not silently drop the declaration or emit an
    // invalid one
    await expect
      .poll(() => injectedRootRules()?.join('\n'))
      .toMatch(/^html:root\s*\{\s*color-scheme:\s*light dark;?\s*\}$/)
    expect(documentColorScheme()).toBe('light dark')
  })

  it.each([
    ['light', LIGHT],
    ['dark', DARK],
  ] as const)('pins the document colour scheme to the %s appearance', async (scheme, color) => {
    const screen = await render(<Harness scheme={scheme} />)

    await expect.poll(documentColorScheme).toBe(scheme)
    expect(probeColor()).toBe(color)

    // the pin goes with the global styles
    await screen.unmount()
    await expect.poll(documentColorScheme).toBe('light dark')
  })

  it('leaves both schemes allowed under the system appearance', async () => {
    await render(<Harness scheme="system" />)

    await expect.poll(documentColorScheme).toBe('light dark')
    const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches
    expect(probeColor()).toBe(prefersDark ? DARK : LIGHT)
  })

  it('follows the appearance as it changes', async () => {
    const screen = await render(<Harness scheme="light" />)
    await expect.poll(documentColorScheme).toBe('light')
    expect(probeColor()).toBe(LIGHT)

    await screen.rerender(<Harness scheme="dark" />)
    await expect.poll(documentColorScheme).toBe('dark')
    expect(probeColor()).toBe(DARK)

    await screen.rerender(<Harness scheme="system" />)
    await expect.poll(documentColorScheme).toBe('light dark')
  })
})
