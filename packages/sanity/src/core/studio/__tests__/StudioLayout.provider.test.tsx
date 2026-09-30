import {type SanityClient} from '@sanity/client'
import {act, render, screen, waitFor} from '@testing-library/react'
import {type ComponentType, lazy, use, useContext, useMemo} from 'react'
import {useObservablePromise} from 'react-rx'
import {Subject} from 'rxjs'
import {createContext} from 'sanity/_createContext'
import {describe, expect, it} from 'vitest'

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {type LayoutProps, type ProviderProps} from '../../config/studio/types'
import {type SingleWorkspace} from '../../config/types'
import {StudioLayout} from '../StudioLayout'

/**
 * The contract of `studio.components.provider`: it renders under the studio providers and
 * above the loading screen's Suspense boundary, so a promise it starts can be `use()`d by
 * `studio.components.layout`, which suspends up to that screen and renders once, settled.
 */

const AnswerPromiseContext = createContext<Promise<string> | null>(
  'sanity/_singletons/context/test-studio-layout-answer-promise',
  null,
)

const answer$ = new Subject<string>()
const log: string[] = []

function AnswerProvider(props: ProviderProps) {
  const promise = useObservablePromise(useMemo(() => answer$.asObservable(), []))
  log.push('providers rendered')
  return (
    <AnswerPromiseContext.Provider value={promise}>
      {props.renderDefault(props)}
    </AnswerPromiseContext.Provider>
  )
}

function AnswerLayout() {
  const promise = useContext(AnswerPromiseContext)
  if (!promise) throw new Error('no providers above the layout')
  const answer = use(promise)
  log.push(`layout rendered with ${answer}`)
  return <div data-testid="layout">{answer}</div>
}

// A lazy layout, like the plugins' own, that never calls `renderDefault`, so the test stays clear
// of the default studio layout and everything it needs. The workspace's default plugins wrap it
// with their (lazy) layouts, so it is reached once those have loaded.
const LazyAnswerLayout = lazy(() => {
  log.push('layout chunk requested')
  return Promise.resolve({default: AnswerLayout as ComponentType<LayoutProps>})
})

async function renderStudioLayout() {
  const config: Partial<SingleWorkspace> = {
    name: 'default',
    projectId: 'test',
    dataset: 'test',
    schema: {types: []},
    studio: {components: {provider: AnswerProvider, layout: LazyAnswerLayout}},
  }
  const TestProvider = await createTestProvider({
    client: createMockSanityClient() as unknown as SanityClient,
    config,
  })
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- the layout suspends during mount, and React only resumes work that suspended inside an awaited async `act`
  await act(async () => {
    render(
      <TestProvider>
        <StudioLayout />
      </TestProvider>,
    )
  })
}

describe('StudioLayout with studio.components.provider', () => {
  it(
    'commits the providers above the loading screen and lets the layout use() their promise',
    {timeout: 30_000},
    async () => {
      await renderStudioLayout()

      // The providers committed (so their request started) while the layout chain is still
      // loading behind the studio's own loading screen.
      expect(screen.getByTestId('loading-block')).toBeInTheDocument()
      expect(log).toContain('providers rendered')

      // The default plugins' lazy layouts load through the module loader, outside `act`; wait for
      // the chain to reach this layout. It then suspends on the unanswered promise: still the same
      // loading screen, no boundary of the plugin's making, and no layout render yet.
      await waitFor(() => expect(log).toContain('layout chunk requested'), {timeout: 15_000})
      expect(screen.getByTestId('loading-block')).toBeInTheDocument()
      expect(screen.queryByTestId('layout')).not.toBeInTheDocument()
      expect(log.filter((entry) => entry.startsWith('layout rendered'))).toHaveLength(0)

      await act(async () => {
        answer$.next('42')
        answer$.complete()
      })

      // One committed layout render, with the settled answer.
      expect(await screen.findByTestId('layout')).toHaveTextContent('42')
      expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
      expect(log.filter((entry) => entry.startsWith('layout rendered'))).toEqual([
        'layout rendered with 42',
      ])
    },
  )
})
