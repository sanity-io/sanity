import {act, render, screen} from '@testing-library/react'
import {use, useContext, useMemo} from 'react'
import {useObservablePromise} from 'react-rx'
import {Subject} from 'rxjs'
import {createContext} from 'sanity/_createContext'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {type LayoutProps, type ProviderProps} from '../../config/studio/types'
import {type SingleWorkspace} from '../../config/types'
import {PluginProviders} from '../PluginProviders'
import {StudioLayout} from '../StudioLayout'

/**
 * `studio.components.provider` renders above `StudioLayout` and its loading screen's Suspense
 * boundary, so a promise it starts can be `use()`d by `studio.components.layout`.
 */

const AnswerPromiseContext = createContext<Promise<string> | null>(
  'sanity/_singletons/context/test-studio-layout-answer-promise',
  null,
)

const answer$ = new Subject<string>()
const log: string[] = []

function AnswerProvider(props: ProviderProps) {
  const promise = useObservablePromise(useMemo(() => answer$.asObservable(), []))
  log.push('provider rendered')
  return <AnswerPromiseContext value={promise}>{props.renderDefault(props)}</AnswerPromiseContext>
}

// Never calls `renderDefault`, so the default studio layout stays out of the test
function AnswerLayout(_props: LayoutProps) {
  const promise = useContext(AnswerPromiseContext)
  if (!promise) throw new Error('no provider above the layout')
  log.push('layout attempted')
  const answer = use(promise)
  log.push(`layout rendered with ${answer}`)
  return <div data-testid="layout">{answer}</div>
}

async function renderStudioLayout() {
  const config: Partial<SingleWorkspace> = {
    name: 'default',
    projectId: 'test',
    dataset: 'test',
    schema: {types: []},
    studio: {components: {provider: AnswerProvider, layout: AnswerLayout}},
  }
  const TestProvider = await createTestProvider({config})
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the layout suspends during mount, and React only resumes work that suspended inside an awaited async `act`
  await act(async () => {
    render(
      <TestProvider>
        <PluginProviders>
          <StudioLayout />
        </PluginProviders>
      </TestProvider>,
    )
  })
}

describe('StudioLayout with studio.components.provider', () => {
  it('commits the provider above the loading screen and lets the layout use() its promise', async () => {
    await renderStudioLayout()

    // The provider committed; the layout suspended on the unanswered promise behind the studio's
    // loading screen, with no boundary of its own
    expect(screen.getByTestId('loading-block')).toBeInTheDocument()
    expect(log).toContain('provider rendered')
    expect(log).toContain('layout attempted')
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument()
    expect(log.filter((entry) => entry.startsWith('layout rendered'))).toHaveLength(0)

    await act(async () => {
      answer$.next('42')
      answer$.complete()
    })

    // The layout only ever rendered with the answer. The default plugins' layouts above it in the
    // chain re-render as their own feature checks settle, so the count is theirs, not ours.
    expect(await screen.findByTestId('layout')).toHaveTextContent('42')
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
    const layoutRenders = log.filter((entry) => entry.startsWith('layout rendered'))
    expect(layoutRenders.length).toBeGreaterThan(0)
    expect(layoutRenders.every((entry) => entry === 'layout rendered with 42')).toBe(true)
  })
})
