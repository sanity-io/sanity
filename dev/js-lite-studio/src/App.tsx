/**
 * The JS-lite studio: the shell, the structure tool and the document form of the Rust studio,
 * in React with `@sanity/ui`, editing through `@sanity/mutator`'s optimistic layer.
 */
import {type SanityClient} from '@sanity/client'
import {Card, Flex, Spinner, Text, ThemeProvider, useTheme_v2} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {useEffect, useState} from 'react'
import {createGlobalStyle} from 'styled-components'

import {commandOpen, perf, scheme, schemaVersion, user} from './app-state'
import {type AuthState, authenticate, LoginScreen, UnauthorizedScreen} from './auth'
import {setClient} from './client'
import {CommandMenu} from './CommandMenu'
import {SCHEMA_CACHE_KEY} from './config'
import {Navbar} from './Navbar'
import {startPresence} from './presence'
import {startReleases} from './releases'
import {startReplica} from './replica'
import {Schema, setSchema} from './schema'
import {useAtom} from './state'
import {Structure} from './Structure'
import {ToastBridge} from './toasts'
import {storageGet, storageSet} from './util'

const theme = buildTheme()

/** The scrollbars of the test studio's `GlobalStyle`: a thumb in the card's border color, clipped
 * to 4px by a transparent border, on a transparent track. */
const ScrollbarStyle = createGlobalStyle<{$border: string; $hover: string}>`
  ::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  ::-webkit-scrollbar-corner {
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-clip: content-box;
    background-color: var(--card-border-color, ${(props) => props.$border});
    border: 4px solid transparent;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: var(--card-muted-fg-color, ${(props) => props.$hover});
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  body {
    scrollbar-gutter: stable;
  }
`

function GlobalStyle() {
  const {color} = useTheme_v2()
  return <ScrollbarStyle $border={color.border} $hover={color.muted.fg} />
}

export function App() {
  const current = useAtom(scheme)
  useEffect(() => {
    const root = document.documentElement
    root.style.backgroundColor = current === 'dark' ? '#13141b' : '#ffffff'
    root.style.colorScheme = current
  }, [current])
  return (
    <ThemeProvider theme={theme} scheme={current}>
      <GlobalStyle />
      <ToastProvider>
        <ToastBridge />
        <Boot />
      </ToastProvider>
    </ThemeProvider>
  )
}

function cachedSchema(): unknown[] | undefined {
  const raw = storageGet(SCHEMA_CACHE_KEY)
  if (!raw) return undefined
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? value : undefined
  } catch {
    return undefined
  }
}

async function fetchSchema(client: SanityClient): Promise<unknown[]> {
  const value = await client.fetch<unknown>(
    '*[_id == "_.schemas.default"][0].schema',
    {},
    {tag: 'schema'},
  )
  // Schema documents of version 2025-05-01 hold the types as a JSON string.
  const types = typeof value === 'string' ? (JSON.parse(value) as unknown) : value
  if (!Array.isArray(types)) {
    throw new Error(
      'This dataset has no deployed schema. Run `sanity schema deploy` in the test studio.',
    )
  }
  return types
}

type Boot = {auth: AuthState; schemaReady: boolean; schemaError?: string}

let booting: Promise<void> | undefined

function Boot() {
  const [state, setState] = useState<Boot>({auth: {type: 'checking'}, schemaReady: false})
  useEffect(() => {
    if (booting) return
    booting = (async () => {
      const [client, auth] = await authenticate()
      perf.auth.set(performance.now())
      setClient(client)
      if (auth.type !== 'loggedIn') {
        setState({auth, schemaReady: false})
        return
      }
      user.set(auth.user)
      startPresence(auth.user)
      startReleases()
      const cached = cachedSchema()
      let ready = false
      if (cached) {
        setSchema(new Schema(cached))
        perf.schema.set(performance.now())
        perf.schemaCached.set(true)
        ready = true
        startReplica()
      }
      setState({auth, schemaReady: ready})
      try {
        const types = await fetchSchema(client)
        const serialized = JSON.stringify(types)
        if (serialized !== JSON.stringify(cached)) {
          storageSet(SCHEMA_CACHE_KEY, serialized)
          setSchema(new Schema(types))
          schemaVersion.update((version) => version + 1)
        }
        startReplica()
        if (!ready) {
          perf.schema.set(performance.now())
          setState({auth, schemaReady: true})
        }
      } catch (error) {
        if (!ready) setState({auth, schemaReady: false, schemaError: String(error)})
      }
    })()
  }, [])

  const {auth} = state
  switch (auth.type) {
    case 'checking':
      return <Splash text="Loading" />
    case 'failed':
      return <Splash text={auth.message} />
    case 'loggedOut':
      return <LoginScreen providers={auth.providers} loginUrls={auth.loginUrls} />
    case 'unauthorized':
      return <UnauthorizedScreen user={auth.user} />
    case 'loggedIn':
      if (state.schemaError) return <Splash text={state.schemaError} />
      if (!state.schemaReady) return <Splash text="Loading schema" />
      return <Studio />
    default: {
      const exhaustive: never = auth
      return exhaustive
    }
  }
}

function Splash(props: {text: string}) {
  return (
    <Flex direction="column" align="center" justify="center" gap={4} height="fill">
      <Text muted>
        <Spinner />
      </Text>
      <Text size={1} muted>
        {props.text}
      </Text>
    </Flex>
  )
}

function Studio() {
  const open = useAtom(commandOpen)
  useEffect(() => {
    if (perf.interactive.get() === undefined) perf.interactive.set(performance.now())
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        commandOpen.update((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
  return (
    <div data-ui="Studio" style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <Navbar />
      <Card flex={1} overflow="hidden" style={{minHeight: 0}}>
        <Structure />
      </Card>
      {open ? <CommandMenu /> : null}
    </div>
  )
}
