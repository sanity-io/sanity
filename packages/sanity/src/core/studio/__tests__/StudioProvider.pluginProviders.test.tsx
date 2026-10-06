import {act, render, screen, waitFor} from '@testing-library/react'
import {type ComponentType, lazy, use} from 'react'
import {createContext} from 'sanity/_createContext'
import {describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../test/mocks/mockSanityClient'
import {type LayoutProps, type ProviderProps} from '../../config/studio/types'
import {createMockAuthStore} from '../../store/authStore/createMockAuthStore'
import {StudioLayout} from '../StudioLayout'
import {StudioProvider} from '../StudioProvider'

vi.mock('../components/navbar/new-document/NewDocumentButton')
vi.mock('../components/navbar/new-document/useNewDocumentOptions')
vi.mock('../components/navbar/presence/PresenceMenu')

/**
 * `StudioProvider` renders the `studio.components.provider` chain around its children, above
 * `StudioLayout` and its loading screen boundary: a configured provider wraps the layout with
 * nothing else mounting it.
 */

const AnswerPromiseContext = createContext<Promise<string> | null>(
  'sanity/_singletons/context/test-studio-provider-answer-promise',
  null,
)

const log: string[] = []
let resolveAnswer!: (answer: string) => void
const answerPromise = new Promise<string>((resolve) => {
  resolveAnswer = resolve
})

function AnswerProvider(props: ProviderProps) {
  log.push('provider rendered')
  return (
    <AnswerPromiseContext value={answerPromise}>{props.renderDefault(props)}</AnswerPromiseContext>
  )
}

function AnswerLayout() {
  const promise = use(AnswerPromiseContext)
  if (!promise) throw new Error('no provider above the layout')
  const answer = use(promise)
  log.push(`layout rendered with ${answer}`)
  return <div data-testid="layout">{answer}</div>
}

const LazyAnswerLayout = lazy(() => {
  log.push('layout chunk requested')
  return Promise.resolve({default: AnswerLayout as ComponentType<LayoutProps>})
})

describe('StudioProvider with studio.components.provider', () => {
  it('wraps StudioLayout in the configured provider', {timeout: 30_000}, async () => {
    const client = createMockSanityClientAsClient()
    const config = {
      projectId: 'test',
      dataset: 'test',
      schema: {types: []},
      auth: createMockAuthStore({
        client,
        currentUser: {
          id: 'doug',
          name: 'Doug',
          email: 'doug@sanity.io',
          // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
          role: 'admin',
          roles: [{name: 'administrator', title: 'Administrator'}],
        },
      }),
      studio: {components: {provider: AnswerProvider, layout: LazyAnswerLayout}},
    }

    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the layout suspends during mount
    await act(async () => {
      render(
        <StudioProvider config={config} unstable_noAuthBoundary>
          <StudioLayout />
        </StudioProvider>,
      )
    })

    await waitFor(() => expect(log).toContain('layout chunk requested'), {timeout: 15_000})
    expect(log).toContain('provider rendered')
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument()

    await act(async () => {
      resolveAnswer('42')
    })

    // The layout only ever rendered with the answer. The default plugins' layouts above it in the
    // chain re-render as their own feature checks settle, so the count is theirs, not ours.
    expect(await screen.findByTestId('layout')).toHaveTextContent('42')
    const layoutRenders = log.filter((entry) => entry.startsWith('layout rendered'))
    expect(layoutRenders.length).toBeGreaterThan(0)
    expect(layoutRenders.every((entry) => entry === 'layout rendered with 42')).toBe(true)
  })
})
