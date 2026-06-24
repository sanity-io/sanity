import {type ClientError, ServerError} from '@sanity/client'
import {
  Box,
  Button,
  Card,
  Code,
  Container,
  Flex,
  Heading,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text,
} from '@sanity/ui'
import {lazy, type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {CorsOriginErrorScreen, useClient, useProjectId, useStudioErrorHandler} from 'sanity'
import {useRouter} from 'sanity/router'

import {
  installCheckCorsFetchInterceptor,
  makeDemoClient,
  setCorsDemoActive,
} from './demoInterceptor'

function triggerCustomErrorOnEvent() {
  throw new Error('Custom error triggered')
}

function triggerImportError() {
  const filename = '/does-not-exist.js'
  void import(/* @vite-ignore */ filename)
}

function triggerTypeErrorOnEvent(evt: any) {
  evt.someFunctionThatDoesntExist()
}

function triggerTimeoutError() {
  setTimeout(() => {
    throw new Error('Custom error in setTimeout')
  }, 1000)
}

function triggerPromiseError() {
  return new Promise((resolve, reject) => {
    requestAnimationFrame(() => {
      reject(new Error('Custom error in promise'))
    })
  })
}

type TabId = 'boundary' | 'request'

const DEFAULT_TAB: TabId = 'boundary'

function isTabId(value: unknown): value is TabId {
  return value === 'boundary' || value === 'request'
}

export function ErrorReportingTest() {
  const router = useRouter()
  const routeTab = (router.state as {tab?: string}).tab
  const activeTab: TabId = isTabId(routeTab) ? routeTab : DEFAULT_TAB

  const setActiveTab = useCallback(
    (tab: TabId) => {
      router.navigate({tab})
    },
    [router],
  )

  const [doRenderError, setRenderError] = useState(false)
  const handleShouldRenderWithError = useCallback(() => setRenderError(true), [])
  const [triggerReactLazyImportError, setTriggerReactLazyImportError] = useState(false)
  const [triggerEffectError, setTriggerEffectError] = useState(false)
  const handleTriggerReactLazyImportError = useCallback(
    () => setTriggerReactLazyImportError(true),
    [],
  )
  const handleTriggerEffectError = useCallback(() => setTriggerEffectError(true), [])
  const [triggerResizeObserverLoop, setTriggerResizeObserverLoop] = useState(false)
  const handleTriggerResizeObserveLoop = useCallback(() => setTriggerResizeObserverLoop(true), [])
  const [triggerRequestRenderError, setTriggerRequestRenderError] = useState(false)
  const handleTriggerRequestRenderError = useCallback(() => setTriggerRequestRenderError(true), [])

  useEffect(() => {
    if (triggerEffectError) {
      throw new Error('Error triggered in effect')
    }
  }, [triggerEffectError])

  const reportingDemos: DemoEntry[] = useMemo(
    () => [
      {label: 'Import error from event handler', onClick: triggerImportError},
      {label: 'Import error from React.lazy', onClick: handleTriggerReactLazyImportError},
      {label: 'Custom error on event handler', onClick: triggerCustomErrorOnEvent},
      {label: 'Error in useEffect', onClick: handleTriggerEffectError},
      {label: 'Type error on event handler', onClick: triggerTypeErrorOnEvent as () => void},
      {label: 'Async background error (timeout)', onClick: triggerTimeoutError},
      {label: 'Unhandled promise rejection', onClick: triggerPromiseError},
      {label: 'React render error', onClick: handleShouldRenderWithError},
      {label: 'Resize observer loop', onClick: handleTriggerResizeObserveLoop},
      {
        label: 'Uncaught request error (reaches boundary)',
        description:
          'Throws a ServerError during render — an unhandled, undelegated request error. In dev the fallback screen shows the "use useStudioErrorHandler()" tip.',
        onClick: handleTriggerRequestRenderError,
      },
    ],
    [
      handleShouldRenderWithError,
      handleTriggerReactLazyImportError,
      handleTriggerEffectError,
      handleTriggerResizeObserveLoop,
      handleTriggerRequestRenderError,
    ],
  )

  return (
    <Box overflow="auto" padding={[3, 4, 5]}>
      <Container width={1}>
        <Stack space={4}>
          <TabList space={2}>
            <Tab
              aria-controls="errors-panel-boundary"
              id="errors-tab-boundary"
              label="Error boundary"
              onClick={() => setActiveTab('boundary')}
              selected={activeTab === 'boundary'}
            />
            <Tab
              aria-controls="errors-panel-request"
              id="errors-tab-request"
              label="Request errors"
              onClick={() => setActiveTab('request')}
              selected={activeTab === 'request'}
            />
          </TabList>

          <TabPanel
            aria-labelledby="errors-tab-boundary"
            hidden={activeTab !== 'boundary'}
            id="errors-panel-boundary"
          >
            <DemoSection
              demos={reportingDemos}
              description="Verifies that uncaught errors of various flavors reach the studio's error reporter (Sentry) and surface the right fallback UI."
              heading="Error boundary"
            />
          </TabPanel>

          <TabPanel
            aria-labelledby="errors-tab-request"
            hidden={activeTab !== 'request'}
            id="errors-panel-request"
          >
            <RequestErrorsDemo />
          </TabPanel>
        </Stack>
      </Container>

      {triggerReactLazyImportError && <ReactLazyError />}
      {doRenderError && <WithRenderError />}
      {triggerResizeObserverLoop && <ResizeObserverLoop />}
      {triggerRequestRenderError && <RequestRenderError />}
    </Box>
  )
}

const ReactLazyError = lazy(() => {
  const name = '/does-not-exist.js'
  return import(/* @vite-ignore */ name)
})

function WithRenderError({text}: any) {
  return <div>{text.toUpperCase()}</div>
}

// Throws a request error (ServerError) during render — simulating a
// plugin that neither handles its request error locally nor delegates it
// via `useStudioErrorHandler()`, so it escapes to the StudioErrorBoundary.
// In dev, the fallback screen detects the client-request error and shows
// the opt-in tip.
function RequestRenderError(): never {
  throw new ServerError({
    statusCode: 503,
    headers: {},
    body: {error: {description: 'Example 503 thrown during render'}},
    url: 'https://example.api.sanity.io/v1/data/query/production',
    method: 'GET',
    statusMessage: 'Service Unavailable',
  })
}

function ResizeObserverLoop() {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          elementRef.current!.style.width = `${entry.contentRect.width + 1}px`
        }
      }
    })

    if (elementRef.current) {
      resizeObserver.observe(elementRef.current)
    }
  }, [])

  return (
    <div ref={elementRef} style={{backgroundColor: 'red'}}>
      err err
    </div>
  )
}

interface DemoEntry {
  label: string
  description?: ReactNode
  onClick: () => void
  tone?: 'default' | 'primary' | 'caution' | 'critical'
  /**
   * The most recent in-place result for this demo. Used for locally-handled
   * errors, which have no dialog/toast — the outcome is shown inline with
   * the row that produced it.
   */
  result?: string
}

function DemoSection(props: {heading: string; description?: ReactNode; demos: DemoEntry[]}) {
  return (
    <Card padding={4} radius={3} shadow={1}>
      <Stack space={4}>
        <Stack space={3}>
          <Heading size={2}>{props.heading}</Heading>
          {props.description && (
            <Text muted size={1}>
              {props.description}
            </Text>
          )}
        </Stack>
        <Stack space={2}>
          {props.demos.map((demo) => (
            <DemoRow key={demo.label} demo={demo} />
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}

function DemoRow({demo}: {demo: DemoEntry}) {
  return (
    <Card border padding={4} radius={2} tone="transparent">
      <Stack space={3}>
        <Flex align="center" gap={4} wrap="wrap">
          <Box flex={1} style={{minWidth: 240}}>
            {demo.description ? (
              <Stack space={3}>
                <Text size={1} weight="medium">
                  {demo.label}
                </Text>
                <Text muted size={1}>
                  {demo.description}
                </Text>
              </Stack>
            ) : (
              <Text size={1} weight="medium">
                {demo.label}
              </Text>
            )}
          </Box>
          <Button
            mode="ghost"
            onClick={demo.onClick}
            padding={3}
            text="Trigger"
            tone={demo.tone ?? 'default'}
          />
        </Flex>
        {demo.result && (
          <Card padding={3} radius={2} tone="transparent" border>
            <Stack space={2}>
              <Text muted size={0} weight="semibold">
                Result
              </Text>
              <Code size={1} style={{whiteSpace: 'pre-wrap'}}>
                {demo.result}
              </Code>
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  )
}

/**
 * Drop-in replacement for `<Code>` inline. `@sanity/ui` ships `<Code>` as a
 * block element, which breaks line flow when embedded mid-sentence. This
 * keeps the same monospace look but stays inline.
 */
function InlineCode({children}: {children: ReactNode}) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-family-code, ui-monospace, SFMono-Regular, monospace)',
        fontSize: '0.95em',
        padding: '0 0.25em',
        borderRadius: 2,
        background: 'var(--card-code-bg-color, rgba(127, 127, 127, 0.15))',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

/**
 * Demonstrates the call-site request-error API (`useStudioErrorHandler`)
 * against the real studio pipeline. Each demo client is wrapped with
 * `makeDemoClient` (see `demoInterceptor.ts`), which composes the studio's
 * request handler so the CORS detection + observability flow runs
 * unchanged, but matched demo URLs get synthetic responses.
 *
 * The studio never intercepts errors on its own — every demo shows a
 * call site deciding what to do: handle locally, or delegate to the
 * studio dialog via `attempt()` / `handle`.
 */
const demoUrl = (kind: string) => `/demo/global-error/${kind}`

function RequestErrorsDemo() {
  const baseClient = useClient({apiVersion: '2025-02-19'})
  const client = useMemo(() => makeDemoClient(baseClient), [baseClient])
  const {attempt, handle} = useStudioErrorHandler()
  const projectId = useProjectId()

  // Full-screen preview of the CORS "Connect this Studio" screen for a
  // custom (registerable) domain. Unlike the request-triggered CORS demos,
  // this renders the screen directly with a mock origin: the live flow reads
  // `window.location.origin`, which is localhost here and hides the "Register
  // Studio" option — passing a custom domain shows both that option and "Add
  // CORS origin".
  const [showCustomDomainPreview, setShowCustomDomainPreview] = useState(false)

  // The CORS demo synthesizes the studio's bare `/check/cors` fetch via a
  // global window.fetch patch. Scope it to this view so it isn't routing
  // every studio request through the interceptor once you navigate away.
  useEffect(() => installCheckCorsFetchInterceptor(), [])

  // Per-demo results, keyed by label. Locally-handled errors have no dialog
  // or toast, so their outcome is shown in place under the row that produced
  // it (rather than a single shared "last result").
  const [results, setResults] = useState<Record<string, string>>({})
  const setResult = useCallback((label: string, text: string) => {
    setResults((prev) => ({...prev, [label]: text}))
  }, [])

  const runRetryable = useCallback(
    async (label: string, kind: string) => {
      setResult(label, `Issuing "${label}" request…`)
      try {
        // `attempt()` + retryable: the dialog's "Try again" re-invokes the
        // thunk; this promise resolves with the first successful attempt.
        const result = await attempt(() => client.request({url: demoUrl(kind), tag: 'demo'}), {
          retryable: true,
        })
        setResult(label, `Resolved after retry — ${JSON.stringify(result)}`)
      } catch (err) {
        setResult(
          label,
          `Rejected (unclaimed error) — ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    },
    [client, attempt, setResult],
  )

  const fireAndSurface = useCallback(
    async (label: string, kind: string) => {
      setResult(label, `Issuing "${label}" request…`)
      try {
        // `.catch(handle)`: claimable errors show the
        // reload-only dialog and park the chain; unclaimable errors are
        // re-thrown to the next .catch.
        await client.request({url: demoUrl(kind), tag: 'demo'}).catch(handle)
        setResult(label, 'Request succeeded (unexpected for a demo).')
      } catch (err) {
        setResult(
          label,
          `Local catch ran (unclaimed) — ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    },
    [client, handle, setResult],
  )

  const triggerLocalHandling = useCallback(
    async (label: string) => {
      setResult(label, 'Issuing request with purely local handling…')
      try {
        await client.request({url: demoUrl('server-error'), tag: 'demo'})
        setResult(label, 'Request succeeded (unexpected).')
      } catch (err) {
        setResult(
          label,
          `Caught locally, no dialog — ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    },
    [client, setResult],
  )

  const triggerUnauthorized = useCallback(
    async (label: string) => {
      setResult(label, 'Issuing 401 request via the reporter…')
      const bogusClient = client.withConfig({
        token: 'invalid-demo-token-not-a-real-key',
        ignoreBrowserTokenWarning: true,
      })
      try {
        await attempt(() => bogusClient.request({uri: '/users/me', tag: 'demo-401'}), {
          retryable: true,
        })
        setResult(label, 'Request succeeded (unexpected).')
      } catch (err) {
        const cerr = err as ClientError & {statusCode?: number}
        setResult(
          label,
          `401 propagated to local catch: statusCode=${cerr.statusCode ?? '?'}. The studio ` +
            `verified your real session via /auth/id and found it valid, so no forced logout.`,
        )
      }
    },
    [client, attempt, setResult],
  )

  const triggerCors = useCallback(
    async (label: string, mode: 'denied' | 'no-credentials') => {
      setResult(label, `Issuing CORS-misconfig request (${mode})…`)
      setCorsDemoActive(mode)
      // Leave the flag on long enough for the polling re-check to also
      // exercise the CORS-probe interception. Reset so the next demo
      // isn't affected.
      setTimeout(() => setCorsDemoActive(false), 30_000)
      const result = await client.request({url: demoUrl('cors-misconfig'), tag: 'demo'}).then(
        () => 'CORS request succeeded (unexpected).',
        (err) => `CORS local catch: ${err instanceof Error ? err.message : String(err)}`,
      )
      setResult(label, result)
    },
    [client, setResult],
  )

  const demos: DemoEntry[] = useMemo(
    () => [
      {
        label: 'attempt() · 5xx, recovers on retry',
        description: (
          <>
            <InlineCode>{`attempt(thunk, {retryable: true})`}</InlineCode> · synthetic 503 that
            succeeds on the second attempt · expect the &quot;Server error&quot; dialog with
            &quot;Try again&quot; — clicking it re-runs the thunk and resolves.
          </>
        ),
        onClick: () =>
          runRetryable('attempt() · 5xx, recovers on retry', 'server-error-recoverable'),
        result: results['attempt() · 5xx, recovers on retry'],
      },
      {
        label: 'attempt() · network error, recovers on retry',
        description: (
          <>
            Same shape with a synthetic network failure · expect the &quot;Network error&quot;
            dialog with &quot;Try again&quot;.
          </>
        ),
        onClick: () =>
          runRetryable('attempt() · network error, recovers on retry', 'network-error-recoverable'),
        result: results['attempt() · network error, recovers on retry'],
      },
      {
        label: 'attempt() · 429 with Retry-After countdown',
        description: (
          <>
            Synthetic 429 with a 12s window · expect the countdown dialog; &quot;Try again&quot;
            enables at 0 and succeeds once the window has passed.
          </>
        ),
        onClick: () => runRetryable('attempt() · 429 with Retry-After countdown', 'rate-limited'),
        result: results['attempt() · 429 with Retry-After countdown'],
      },
      {
        label: 'handle · persistent 5xx, fire-and-surface',
        description: (
          <>
            <InlineCode>.catch(handle)</InlineCode> · no thunk to re-run · expect the reload-only
            dialog with conservative &quot;may not have been saved&quot; copy.
          </>
        ),
        onClick: () => fireAndSurface('handle · persistent 5xx, fire-and-surface', 'server-error'),
        tone: 'caution',
        result: results['handle · persistent 5xx, fire-and-surface'],
      },
      {
        label: 'Local handling only (no reporter)',
        description: (
          <>
            Plain <InlineCode>client.request().catch(...)</InlineCode> · the studio never intercepts
            · expect the local catch to run, no dialog.
          </>
        ),
        onClick: () => triggerLocalHandling('Local handling only (no reporter)'),
        result: results['Local handling only (no reporter)'],
      },
      {
        label: '401 via reporter · verified, then propagated',
        description: (
          <>
            Real 401 from <InlineCode>/users/me</InlineCode> using a bogus token, delegated via{' '}
            <InlineCode>attempt()</InlineCode>. The studio probes <InlineCode>/auth/id</InlineCode>{' '}
            with your real (valid) session → resource-level 401 → propagated to the local catch.{' '}
            <Text as="span" weight="semibold">
              You will NOT be logged out.
            </Text>
          </>
        ),
        onClick: () => triggerUnauthorized('401 via reporter · verified, then propagated'),
        tone: 'caution',
        result: results['401 via reporter · verified, then propagated'],
      },
      {
        label: 'CORS misconfig · origin not allowed',
        description: (
          <>
            <InlineCode>/check/cors</InlineCode> returns{' '}
            <InlineCode>{`{allowed: false}`}</InlineCode>. CORS is always studio-handled (no
            opt-in): full-screen &quot;Connect this studio&quot; view with registration links.
          </>
        ),
        onClick: () => triggerCors('CORS misconfig · origin not allowed', 'denied'),
        tone: 'caution',
        result: results['CORS misconfig · origin not allowed'],
      },
      {
        label: 'CORS misconfig · credentials disabled',
        description: (
          <>
            <InlineCode>/check/cors</InlineCode> returns{' '}
            <InlineCode>{`{allowed: true}`}</InlineCode> without credentials · full-screen
            &quot;Enable credentials&quot; view.
          </>
        ),
        onClick: () => triggerCors('CORS misconfig · credentials disabled', 'no-credentials'),
        tone: 'caution',
        result: results['CORS misconfig · credentials disabled'],
      },
      {
        label: 'Custom domain · unregistered Studio (UI preview)',
        description: (
          <>
            Renders the &quot;Connect this Studio&quot; screen directly for a custom domain (
            <InlineCode>https://studio.example.com</InlineCode>) instead of going through a request.
            A registerable origin shows both the &quot;Register Studio&quot; and &quot;Add CORS
            origin&quot; options — unlike a localhost dev origin, which only shows the latter.
          </>
        ),
        onClick: () => setShowCustomDomainPreview(true),
      },
    ],
    [
      fireAndSurface,
      runRetryable,
      triggerCors,
      triggerLocalHandling,
      triggerUnauthorized,
      results,
      setShowCustomDomainPreview,
    ],
  )

  if (showCustomDomainPreview) {
    return (
      <Card height="fill" style={{position: 'fixed', inset: 0, zIndex: 1000}}>
        <Flex direction="column" height="fill">
          <Card padding={3} shadow={1} tone="transparent">
            <Flex align="center" justify="space-between" gap={3}>
              <Text size={1} weight="medium">
                CORS preview · custom domain, unregistered Studio
              </Text>
              <Button
                mode="ghost"
                onClick={() => setShowCustomDomainPreview(false)}
                text="Close preview"
              />
            </Flex>
          </Card>
          <Box flex={1} style={{overflow: 'auto'}}>
            <CorsOriginErrorScreen
              allowed={false}
              withCredentials={false}
              isStaging={false}
              projectId={projectId}
              primaryProjectId={projectId}
              origin="https://studio.example.com"
            />
          </Box>
        </Flex>
      </Card>
    )
  }

  return (
    <Card padding={4} radius={3} shadow={1}>
      <Stack space={4}>
        <Stack space={3}>
          <Heading size={2}>Request errors</Heading>
          <Text muted size={1}>
            Each button issues a real request through the studio&apos;s client pipeline. The call
            site decides per request whether to handle errors locally or delegate them to the
            studio&apos;s error UI via <InlineCode>useStudioErrorHandler()</InlineCode>. Locally
            handled outcomes are shown in place under each row.
          </Text>
        </Stack>
        <Stack space={2}>
          {demos.map((demo) => (
            <DemoRow key={demo.label} demo={demo} />
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}
