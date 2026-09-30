import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import noop from 'lodash-es/noop.js'
import {type ReactNode} from 'react'
import {route, RouterProvider} from 'sanity/router'
import {describe, expect, it} from 'vitest'

import {IntentButton} from '../IntentButton'

const router = route.create('/test', [route.intents('/intent')])

function Wrapper({children}: {children: ReactNode}) {
  return (
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    <ThemeProvider theme={studioTheme}>
      <RouterProvider onNavigate={noop} router={router} state={{}}>
        {children}
      </RouterProvider>
    </ThemeProvider>
  )
}

const intentProps = {
  intent: 'create',
  params: {type: 'author', template: 'author'},
  searchParams: [['perspective', 'rXYZ']] as [string, string][],
}

describe('IntentButton', () => {
  it('renders an intent link when enabled', () => {
    render(<IntentButton {...intentProps} text="Create" />, {wrapper: Wrapper})

    const link = screen.getByRole('link', {name: 'Create'})
    expect(link).toHaveAttribute('href', expect.stringContaining('/test/intent/create/'))
    expect(link).toHaveAttribute('href', expect.stringContaining('perspective=rXYZ'))
  })

  it('does not forward the intent props to the anchor when disabled', () => {
    render(<IntentButton {...intentProps} disabled text="Create" />, {wrapper: Wrapper})

    const link = screen.getByRole('link', {name: 'Create'})
    expect(link).toHaveAttribute('aria-disabled', 'true')
    for (const attribute of ['intent', 'params', 'replace', 'searchparams']) {
      expect(link.hasAttribute(attribute)).toBe(false)
    }
  })
})
