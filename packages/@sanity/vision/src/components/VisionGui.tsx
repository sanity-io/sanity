import {SplitPane} from '@rexxars/react-split-pane'
import {type ListenEvent, type MutationEvent, type StackablePerspective} from '@sanity/client'
import {Box, Flex, useToast} from '@sanity/ui'
import {isHotkey} from 'is-hotkey-esm'
import {type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useClient, usePerspective, useTranslation} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

import {API_VERSIONS, DEFAULT_API_VERSION} from '../apiVersions'
import {VisionCodeMirror} from '../codemirror/VisionCodeMirror'
import {visionLocaleNamespace} from '../i18n'
import {
  getActivePerspective,
  isSupportedPerspective,
  isVirtualPerspective,
  type SupportedPerspective,
} from '../perspectives'
import {type VisionProps} from '../types'
import {encodeQueryString} from '../util/encodeQueryString'
import {getLocalStorage} from '../util/localStorage'
import {parseApiQueryString, type ParsedApiQueryString} from '../util/parseApiQueryString'
import {prefixApiVersion} from '../util/prefixApiVersion'
import {validateApiVersion} from '../util/validateApiVersion'
import {ParamsEditor, parseParams} from './ParamsEditor'
import {usePaneSize} from './usePaneSize'
import {
  InputBackgroundContainerLeft,
  InputContainer,
  Root,
  SplitpaneContainer,
  StyledLabel,
} from './VisionGui.styled'
import {VisionGuiControls} from './VisionGuiControls'
import {VisionGuiHeader} from './VisionGuiHeader'
import {VisionGuiResult} from './VisionGuiResult'

function nodeContains(node: Node, other: EventTarget | Node | null): boolean {
  if (!node || !other) {
    return false
  }

  // eslint-disable-next-line no-bitwise
  return node === other || !!(node.compareDocumentPosition(other as Node) & 16)
}

const sanityUrl =
  /\.(?:api|apicdn)\.sanity\.io\/(vX|v1|v\d{4}-\d\d-\d\d)\/.*?(?:query|listen)\/(.*?)\?(.*)/

const isRunHotkey = (event: KeyboardEvent) =>
  isHotkey('ctrl+enter', event) || isHotkey('mod+enter', event)

interface Subscription {
  unsubscribe: () => void
}
export interface Params {
  raw: string
  parsed: Record<string, unknown> | undefined
  valid: boolean
  error: string | undefined
}

interface QueryExecutionOptions {
  apiVersion?: string
  dataset?: string
  perspective?: SupportedPerspective
  query?: string
  params?: Record<string, unknown>
}

interface VisionGuiProps extends VisionProps {
  datasets: string[]
  projectId: string | undefined
  clientDataset: string | undefined
}

export function VisionGui(props: VisionGuiProps) {
  const {datasets, config, projectId, clientDataset} = props
  const toast = useToast()
  const {t} = useTranslation(visionLocaleNamespace)
  const {perspectiveStack} = usePerspective()

  const defaultApiVersion = prefixApiVersion(`${config.defaultApiVersion}`)

  const visionRootRef = useRef<HTMLDivElement | null>(null)
  const customApiVersionElementRef = useRef<HTMLInputElement | null>(null)
  const querySubscriptionRef = useRef<Subscription | undefined>(undefined)
  const listenSubscriptionRef = useRef<Subscription | undefined>(undefined)

  const defaultDataset = config.defaultDataset || clientDataset || datasets[0]
  const [localStorage] = useState(() => getLocalStorage(projectId || 'default'))

  const {storedDataset, storedApiVersion, storedQuery, storedParams, storedPerspective} =
    useMemo(() => {
      return {
        storedDataset: localStorage.get('dataset', defaultDataset),
        storedApiVersion: localStorage.get('apiVersion', defaultApiVersion),
        storedQuery: localStorage.get('query', ''),
        storedParams: localStorage.get('params', '{\n  \n}'),
        storedPerspective: localStorage.get<SupportedPerspective | undefined>(
          'perspective',
          undefined,
        ),
      }
    }, [defaultDataset, defaultApiVersion, localStorage])

  const [dataset, setDataset] = useState<string>(() => {
    if (datasets.includes(storedDataset)) {
      return storedDataset
    }
    if (datasets.includes(defaultDataset)) {
      return defaultDataset
    }
    return datasets[0]
  })
  const [apiVersion, setApiVersion] = useState<string>(() =>
    API_VERSIONS.includes(storedApiVersion) ? storedApiVersion : DEFAULT_API_VERSION,
  )
  const [customApiVersion, setCustomApiVersion] = useState<string | false>(() =>
    API_VERSIONS.includes(storedApiVersion) ? false : storedApiVersion,
  )
  const [perspective, setPerspectiveState] = useState<SupportedPerspective | undefined>(
    storedPerspective,
  )
  const isValidApiVersion = customApiVersion ? validateApiVersion(customApiVersion) : true

  const [url, setUrl] = useState<string | undefined>(undefined)
  const [query, setQuery] = useState<string>(() =>
    typeof storedQuery === 'string' ? storedQuery : '',
  )
  const [params, setParams] = useState<Params>(() => parseParams(storedParams, t))

  const [queryResult, setQueryResult] = useState<unknown | undefined>(undefined)
  const [listenMutations, setListenMutations] = useState<MutationEvent[]>([])
  const [error, setError] = useState<Error | undefined>(undefined)
  const [queryTime, setQueryTime] = useState<number | undefined>(undefined)
  const [e2eTime, setE2eTime] = useState<number | undefined>(undefined)
  const [queryInProgress, setQueryInProgress] = useState<boolean>(false)
  const [listenInProgress, setListenInProgress] = useState<boolean>(false)

  const {paneSizeOptions, isNarrowBreakpoint} = usePaneSize({visionRootRef})

  // Client  with memoized initial value
  const _client = useClient({
    apiVersion: isValidApiVersion && customApiVersion ? customApiVersion : apiVersion,
  })
  const client = useMemo(() => {
    return _client.withConfig({
      apiVersion: isValidApiVersion && customApiVersion ? customApiVersion : apiVersion,
      perspective: getActivePerspective({
        visionPerspective: perspective,
        pinnedPerspectiveStack: perspectiveStack,
      }),
      dataset,
      allowReconfigure: true,
    })
  }, [
    perspectiveStack,
    perspective,
    customApiVersion,
    apiVersion,
    dataset,
    _client,
    isValidApiVersion,
  ])

  // Cancel query subscription
  const cancelQuery = useCallback(() => {
    if (!querySubscriptionRef.current) {
      return
    }
    querySubscriptionRef.current.unsubscribe()
    querySubscriptionRef.current = undefined
  }, [])

  // Cancel listener subscription
  const cancelListener = useCallback(() => {
    if (!listenSubscriptionRef.current) {
      return
    }
    listenSubscriptionRef.current.unsubscribe()
    listenSubscriptionRef.current = undefined
  }, [])

  useEffect(() => {
    return () => {
      cancelQuery()
      cancelListener()
    }
  }, [cancelQuery, cancelListener])

  // Handle query execution
  const handleQueryExecution = useCallback(
    (options?: QueryExecutionOptions) => {
      if (queryInProgress) {
        cancelQuery()
        cancelListener()
        setQueryInProgress(false)
        return
      }
      const executionQuery = options?.query || query
      const executionParams = options?.params || params.parsed

      localStorage.set('query', executionQuery)
      localStorage.set('params', params.raw)

      cancelListener()

      setQueryInProgress(!params.error && Boolean(executionQuery))
      setListenInProgress(false)
      setListenMutations([])
      setError(new Error(params.error) || undefined)
      setQueryResult(undefined)
      setQueryTime(undefined)
      setE2eTime(undefined)

      if ((!options?.query && !query) || params.error) {
        return
      }

      const urlQueryOpts: Record<string, string | string[]> = {}
      if (perspective || options?.perspective) {
        urlQueryOpts.perspective =
          getActivePerspective({
            visionPerspective: options?.perspective || perspective,
            pinnedPerspectiveStack: perspectiveStack,
          }) ?? []
      }

      const clientWithOptions = client.withConfig({
        apiVersion: options?.apiVersion || customApiVersion || apiVersion,
        dataset: options?.dataset || client.config().dataset,
        perspective: getActivePerspective({
          visionPerspective: options?.perspective || perspective,
          pinnedPerspectiveStack: perspectiveStack,
        }),
      })

      const newUrl = clientWithOptions.getUrl(
        clientWithOptions.getDataUrl(
          'query',
          encodeQueryString(executionQuery, executionParams, urlQueryOpts),
        ),
      )
      setUrl(newUrl)

      const queryStart = Date.now()

      querySubscriptionRef.current = clientWithOptions.observable
        .fetch(executionQuery, executionParams, {filterResponse: false, tag: 'vision'})
        .subscribe({
          next: (res) => {
            setQueryTime(res.ms)
            setE2eTime(Date.now() - queryStart)
            setQueryResult(res.result)
            setQueryInProgress(false)
            setError(undefined)
          },
          error: (err) => {
            setError(err)
            setQueryInProgress(false)
          },
        })
    },
    [
      queryInProgress,
      query,
      params,
      localStorage,
      cancelListener,
      perspective,
      client,
      customApiVersion,
      apiVersion,
      perspectiveStack,
      cancelQuery,
    ],
  )

  // Set perspective
  const setPerspective = useCallback(
    (newPerspective: string | undefined): void => {
      if (newPerspective !== undefined && !isSupportedPerspective(newPerspective)) {
        return
      }

      setPerspectiveState(newPerspective as SupportedPerspective | undefined)
      localStorage.set('perspective', newPerspective)

      handleQueryExecution()
      // handleQueryExecution({perspective: newPerspective as ClientPerspective})
    },
    [localStorage, handleQueryExecution],
  )

  // Handle dataset change
  const handleChangeDataset = useCallback(
    (evt: ChangeEvent<HTMLSelectElement>) => {
      const newDataset = evt.target.value
      localStorage.set('dataset', newDataset)
      setDataset(newDataset)
      handleQueryExecution({dataset: newDataset})
    },
    [localStorage, handleQueryExecution],
  )

  // Handle API version change
  const handleChangeApiVersion = useCallback(
    (evt: ChangeEvent<HTMLSelectElement>) => {
      const newApiVersion = evt.target.value
      if (newApiVersion?.toLowerCase() === 'other') {
        setCustomApiVersion('v')
        setTimeout(() => {
          customApiVersionElementRef.current?.focus()
        }, 0)
        return
      }

      setApiVersion(newApiVersion)
      setCustomApiVersion(false)
      localStorage.set('apiVersion', newApiVersion)

      handleQueryExecution({apiVersion: newApiVersion})
    },
    [localStorage, handleQueryExecution],
  )

  // Handle custom API version change
  const handleCustomApiVersionChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      const newCustomApiVersion = evt.target.value || ''
      const newIsValidApiVersion = validateApiVersion(newCustomApiVersion)

      setCustomApiVersion(newCustomApiVersion || 'v')

      if (newIsValidApiVersion) {
        setApiVersion(newCustomApiVersion)
        localStorage.set('apiVersion', newCustomApiVersion)
        handleQueryExecution({apiVersion: newCustomApiVersion})
      }
    },
    [localStorage, handleQueryExecution],
  )

  // Handle perspective change
  const handleChangePerspective = useCallback(
    (evt: ChangeEvent<HTMLSelectElement>) => {
      const newPerspective = evt.target.value
      setPerspective(newPerspective === 'default' ? undefined : newPerspective)
    },
    [setPerspective],
  )

  // Handle listener event
  const handleListenerEvent = useCallback((evt: ListenEvent<any>) => {
    if (evt.type !== 'mutation') {
      return
    }

    setListenMutations((prevMutations) =>
      prevMutations.length === 50 ? [evt, ...prevMutations.slice(0, 49)] : [evt, ...prevMutations],
    )
  }, [])

  // Handle key down
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isWithinRoot =
        visionRootRef.current && nodeContains(visionRootRef.current, event.target)
      if (isRunHotkey(event) && isWithinRoot && params.valid) {
        handleQueryExecution()
        event.preventDefault()
        event.stopPropagation()
      }
    },
    [params.valid, handleQueryExecution],
  )

  // Handle params change
  const handleParamsChange = useCallback(
    (value: Params) => {
      setParams(value)
      localStorage.set('params', value.raw)
    },
    [localStorage],
  )

  // Handle paste
  const handlePaste = useCallback(
    (evt: ClipboardEvent) => {
      if (!evt.clipboardData) {
        return
      }

      const data = evt.clipboardData.getData('text/plain')
      const match = data.match(sanityUrl)
      if (!match) {
        return
      }

      const [, usedApiVersion, usedDataset, urlQuery] = match
      let parts: ParsedApiQueryString

      try {
        const qs = new URLSearchParams(urlQuery)
        parts = parseApiQueryString(qs)
      } catch (err) {
        console.warn('Error while trying to parse API URL: ', err.message) // eslint-disable-line no-console
        return // Give up on error
      }

      let newApiVersion: string | undefined
      let newCustomApiVersion: string | false | undefined

      if (validateApiVersion(usedApiVersion)) {
        if (API_VERSIONS.includes(usedApiVersion)) {
          newApiVersion = usedApiVersion
          newCustomApiVersion = false
        } else {
          newCustomApiVersion = usedApiVersion
        }
      }

      const newPerspective =
        isSupportedPerspective(parts.options.perspective) &&
        !isVirtualPerspective(parts.options.perspective)
          ? parts.options.perspective
          : undefined

      if (
        newPerspective &&
        (!isSupportedPerspective(parts.options.perspective) ||
          isVirtualPerspective(parts.options.perspective))
      ) {
        toast.push({
          closable: true,
          id: 'vision-paste-unsupported-perspective',
          status: 'warning',
          title: 'Perspective in pasted url is currently not supported. Falling back to "raw"',
        })
      }

      evt.preventDefault()

      // Update state with pasted values
      const newDataset = datasets.includes(usedDataset) ? usedDataset : dataset
      const finalApiVersion = typeof newApiVersion === 'undefined' ? apiVersion : newApiVersion
      const finalCustomApiVersion =
        typeof newCustomApiVersion === 'undefined' ? customApiVersion : newCustomApiVersion
      const finalPerspective = typeof newPerspective === 'undefined' ? perspective : newPerspective

      setDataset(newDataset)
      setQuery(parts.query)
      setParams({
        parsed: parts.params,
        raw: JSON.stringify(parts.params, null, 2),
        valid: true,
        error: undefined,
      })

      setApiVersion(finalApiVersion)
      setCustomApiVersion(finalCustomApiVersion)
      setPerspectiveState(finalPerspective)

      // Update localStorage and client config
      localStorage.merge({
        query: parts.query,
        params: JSON.stringify(parts.params, null, 2),
        dataset: newDataset,
        apiVersion: finalCustomApiVersion || finalApiVersion,
        perspective: finalPerspective,
      })

      // Execute query with new values
      handleQueryExecution({
        query: parts.query,
        params: parts.params,
        dataset: newDataset,
        apiVersion: finalCustomApiVersion || finalApiVersion,
        perspective: finalPerspective,
      })

      toast.push({
        closable: true,
        id: 'vision-paste',
        status: 'info',
        title: 'Parsed URL to query',
      })
    },
    [
      datasets,
      dataset,
      apiVersion,
      customApiVersion,
      perspective,
      localStorage,
      toast,
      handleQueryExecution,
    ],
  )

  // Handle listen execution
  const handleListenExecution = useCallback(() => {
    if (listenInProgress) {
      cancelListener()
      setListenInProgress(false)
      return
    }

    const clientWithApiVersion = client.withConfig({
      apiVersion: customApiVersion || apiVersion,
    })

    const newUrl = clientWithApiVersion.getDataUrl(
      'listen',
      encodeQueryString(query, params.parsed, {}),
    )

    const shouldExecute = !params.error && query.trim().length > 0

    localStorage.set('query', query)
    localStorage.set('params', params.raw)

    cancelQuery()

    setUrl(newUrl)
    setListenMutations([])
    setQueryInProgress(false)
    setQueryResult(undefined)
    setListenInProgress(shouldExecute)
    setError(new Error(params.error) || undefined)
    setQueryTime(undefined)
    setE2eTime(undefined)

    if (!shouldExecute) {
      return
    }

    listenSubscriptionRef.current = clientWithApiVersion
      .listen(query, params.parsed, {events: ['mutation', 'welcome'], includeAllVersions: true})
      .subscribe({
        next: handleListenerEvent,
        error: (err) => {
          setError(err)
          setListenInProgress(false)
        },
      })
  }, [
    listenInProgress,
    customApiVersion,
    apiVersion,
    params,
    query,
    localStorage,
    cancelQuery,
    handleListenerEvent,
    cancelListener,
    client,
  ])

  // // Component mount effect
  useEffect(() => {
    window.document.addEventListener('paste', handlePaste)
    window.document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.document.removeEventListener('paste', handlePaste)
      window.document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, handlePaste])

  const handleStudioPerspectiveChange = useEffectEvent((stack: StackablePerspective[]) => {
    if (stack.length > 0) {
      setPerspective('pinnedRelease')
    }
  })
  // // Handle pinned perspective changes
  useEffect(() => {
    handleStudioPerspectiveChange(perspectiveStack)
  }, [perspectiveStack])

  return (
    <Root
      direction="column"
      height="fill"
      ref={visionRootRef}
      sizing="border"
      overflow="hidden"
      style={{
        border: `1px solid ${Math.random() > 0.5 ? 'red' : 'blue'}`,
      }}
    >
      <VisionGuiHeader
        apiVersion={apiVersion}
        customApiVersion={customApiVersion}
        dataset={dataset}
        datasets={datasets}
        onChangeDataset={handleChangeDataset}
        onChangeApiVersion={handleChangeApiVersion}
        customApiVersionElementRef={customApiVersionElementRef}
        onCustomApiVersionChange={handleCustomApiVersionChange}
        isValidApiVersion={isValidApiVersion}
        onChangePerspective={handleChangePerspective}
        url={url}
        perspective={perspective}
      />
      <SplitpaneContainer flex="auto">
        <SplitPane
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
          split={isNarrowBreakpoint ? 'vertical' : 'horizontal'}
          minSize={280}
          defaultSize={400}
          maxSize={-400}
        >
          <Box height="stretch" flex={1}>
            {/*
                    The way react-split-pane handles the sizes is kind of finicky and not clear. What the props above does is:
                    - It sets the initial size of the panes to 1/2 of the total available height of the container
                    - Sets the minimum size of a pane whatever is bigger of 1/2 of the total available height of the container, or 170px
                    - The max size is set to either 60% or 70% of the available space, depending on if the container height is above 650px
                    - Disables resizing when total height is below 500, since it becomes really cumbersome to work with the panes then
                    - The "primary" prop (https://github.com/tomkp/react-split-pane#primary) tells the second pane to shrink or grow by the available space
                    - Disables resize if the container height is less then 500px
                    This should ensure that we mostly avoid a pane to take up all the room, and for the controls to not be eaten up by the pane
                  */}
            <SplitPane
              className="sidebarPanes"
              split="horizontal"
              defaultSize={
                isNarrowBreakpoint ? paneSizeOptions.defaultSize : paneSizeOptions.minSize
              }
              size={paneSizeOptions.size}
              allowResize={paneSizeOptions.allowResize}
              minSize={isNarrowBreakpoint ? paneSizeOptions.minSize : 100}
              maxSize={paneSizeOptions.maxSize}
              primary="first"
            >
              <InputContainer display="flex">
                <Box flex={1}>
                  <InputBackgroundContainerLeft>
                    <Flex>
                      <StyledLabel muted>{t('query.label')}</StyledLabel>
                    </Flex>
                  </InputBackgroundContainerLeft>
                  <VisionCodeMirror value={query} onChange={setQuery} />
                </Box>
              </InputContainer>
              <InputContainer display="flex">
                <ParamsEditor
                  value={params.raw}
                  onChange={handleParamsChange}
                  paramsError={params.error}
                  hasValidParams={params.valid}
                />

                <VisionGuiControls
                  hasValidParams={params.valid}
                  queryInProgress={queryInProgress}
                  listenInProgress={listenInProgress}
                  onQueryExecution={handleQueryExecution}
                  onListenExecution={handleListenExecution}
                />
              </InputContainer>
            </SplitPane>
          </Box>
          <VisionGuiResult
            error={error}
            queryInProgress={queryInProgress}
            queryResult={queryResult}
            listenInProgress={listenInProgress}
            listenMutations={listenMutations}
            dataset={dataset}
            queryTime={queryTime}
            e2eTime={e2eTime}
          />
        </SplitPane>
      </SplitpaneContainer>
    </Root>
  )
}
