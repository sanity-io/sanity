/* eslint-disable max-statements */
import {SplitPane} from '@rexxars/react-split-pane'
import {
  type ClientPerspective,
  type ListenEvent,
  type MutationEvent,
  type StackablePerspective,
} from '@sanity/client'
import {ChevronLeftIcon, ChevronRightIcon} from '@sanity/icons'
import {Box, Button, Flex, useToast} from '@sanity/ui'
import {isHotkey} from 'is-hotkey-esm'
import {type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useClient, usePerspective, useTranslation} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

import {API_VERSIONS, DEFAULT_API_VERSION} from '../apiVersions'
import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../codemirror/VisionCodeMirror'
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
import {QueryRecall} from './QueryRecall'
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
  /\.(?:api|apicdn)\.sanity\.(?:io|work)\/(vX|v1|v\d{4}-\d\d-\d\d)\/.*?(?:query|listen)\/(.*?)\?(.*)/

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
  defaultDataset: string
}

export interface ParsedUrlState {
  query: string
  params: Record<string, unknown>
  rawParams: string
  dataset: string
  apiVersion: string
  customApiVersion: string | false | undefined
  perspective: SupportedPerspective
  url: string
}

export function VisionGui(props: VisionGuiProps) {
  const {datasets, config, projectId, defaultDataset} = props
  const toast = useToast()
  const {t} = useTranslation(visionLocaleNamespace)
  const {perspectiveStack} = usePerspective()

  const defaultApiVersion = prefixApiVersion(`${config.defaultApiVersion}`)
  const editorQueryRef = useRef<VisionCodeMirrorHandle>(null)
  const editorParamsRef = useRef<VisionCodeMirrorHandle>(null)
  const visionRootRef = useRef<HTMLDivElement | null>(null)
  const customApiVersionElementRef = useRef<HTMLInputElement | null>(null)
  const querySubscriptionRef = useRef<Subscription | undefined>(undefined)
  const listenSubscriptionRef = useRef<Subscription | undefined>(undefined)

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
  const [perspective, setPerspectiveState] = useState<SupportedPerspective>(
    storedPerspective || 'raw',
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
  const [isQueryRecallCollapsed, setIsQueryRecallCollapsed] = useState(false)

  const {paneSizeOptions, isNarrowBreakpoint} = usePaneSize({visionRootRef})

  // Client  with memoized initial value
  const _client = useClient({
    apiVersion: isValidApiVersion && customApiVersion ? customApiVersion : apiVersion,
  })
  const client = useMemo(() => {
    return _client.withConfig({
      apiVersion: isValidApiVersion && customApiVersion ? customApiVersion : apiVersion,
      perspective: getActivePerspective({visionPerspective: perspective, perspectiveStack}),
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

  const cancelQuerySubscription = useCallback(() => {
    if (!querySubscriptionRef.current) {
      return
    }
    querySubscriptionRef.current.unsubscribe()
    querySubscriptionRef.current = undefined
  }, [])

  const cancelListenerSubscription = useCallback(() => {
    if (!listenSubscriptionRef.current) {
      return
    }
    listenSubscriptionRef.current.unsubscribe()
    listenSubscriptionRef.current = undefined
  }, [])

  const handleQueryExecution = useCallback(
    (options?: QueryExecutionOptions) => {
      if (queryInProgress) {
        cancelQuerySubscription()
        cancelListenerSubscription()
        setQueryInProgress(false)
        return
      }

      const context: Required<Omit<QueryExecutionOptions, 'params' | 'perspective'>> & {
        params: Params
        perspective: ClientPerspective | undefined
      } = {
        query: options?.query || query,
        dataset: options?.dataset || dataset,
        params: parseParams(JSON.stringify(options?.params || params.parsed, null, 2), t),
        perspective: getActivePerspective({
          visionPerspective: options?.perspective || perspective,
          perspectiveStack,
        }),
        apiVersion:
          options?.apiVersion ||
          (customApiVersion && isValidApiVersion ? customApiVersion : apiVersion),
      }

      localStorage.set('query', context.query)
      localStorage.set('params', context.params.raw)

      cancelListenerSubscription()

      setQueryInProgress(!context.params.error && Boolean(context.query))
      setListenInProgress(false)
      setListenMutations([])
      setError(context.params.error ? new Error(context.params.error) : undefined)
      setQueryResult(undefined)
      setQueryTime(undefined)
      setE2eTime(undefined)

      if (context.params.error) {
        return
      }

      const urlQueryOpts: Record<string, string | string[]> = {
        perspective: context.perspective ?? [],
      }

      const ctxClient = client.withConfig({
        apiVersion: context.apiVersion,
        dataset: context.dataset,
        perspective: context.perspective,
      })

      const newUrl = ctxClient.getUrl(
        ctxClient.getDataUrl(
          'query',
          encodeQueryString(context.query, context.params.parsed, urlQueryOpts),
        ),
      )
      setUrl(newUrl)

      const queryStart = Date.now()

      querySubscriptionRef.current = ctxClient.observable
        .fetch(context.query, context.params.parsed, {filterResponse: false, tag: 'vision'})
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
      dataset,
      params.parsed,
      t,
      perspective,
      perspectiveStack,
      customApiVersion,
      isValidApiVersion,
      apiVersion,
      localStorage,
      cancelListenerSubscription,
      client,
      cancelQuerySubscription,
    ],
  )

  const setPerspective = useCallback(
    (newPerspective: string | undefined): void => {
      if (newPerspective !== undefined && !isSupportedPerspective(newPerspective)) {
        return
      }

      setPerspectiveState(newPerspective as SupportedPerspective)
      localStorage.set('perspective', newPerspective)

      handleQueryExecution({perspective: newPerspective})
    },
    [localStorage, handleQueryExecution],
  )

  const handleChangeDataset = useCallback(
    (evt: ChangeEvent<HTMLSelectElement>) => {
      const newDataset = evt.target.value
      localStorage.set('dataset', newDataset)
      setDataset(newDataset)
      handleQueryExecution({dataset: newDataset})
    },
    [localStorage, handleQueryExecution],
  )

  const handleChangeApiVersion = useCallback(
    (evt: ChangeEvent<HTMLSelectElement>) => {
      const newApiVersion = evt.target.value
      if (newApiVersion?.toLowerCase() === 'other') {
        setCustomApiVersion('v')
        customApiVersionElementRef.current?.focus()
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
      setCustomApiVersion(newCustomApiVersion || 'v')

      if (validateApiVersion(newCustomApiVersion)) {
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

  const handleListenerEvent = useCallback((evt: ListenEvent<any>) => {
    if (evt.type !== 'mutation') {
      return
    }

    setListenMutations((prevMutations) =>
      prevMutations.length === 50 ? [evt, ...prevMutations.slice(0, 49)] : [evt, ...prevMutations],
    )
  }, [])
  const handleListenExecution = useCallback(() => {
    if (listenInProgress) {
      cancelListenerSubscription()
      setListenInProgress(false)
      return
    }

    const newUrl = client.getDataUrl('listen', encodeQueryString(query, params.parsed, {}))

    const shouldExecute = !params.error && query.trim().length > 0

    localStorage.set('query', query)
    localStorage.set('params', params.raw)

    cancelQuerySubscription()

    setUrl(newUrl)
    setListenMutations([])
    setQueryInProgress(false)
    setQueryResult(undefined)
    setListenInProgress(shouldExecute)
    setError(params.error ? new Error(params.error) : undefined)
    setQueryTime(undefined)
    setE2eTime(undefined)

    if (!shouldExecute) {
      return
    }

    listenSubscriptionRef.current = client
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
    params,
    query,
    localStorage,
    cancelQuerySubscription,
    handleListenerEvent,
    cancelListenerSubscription,
    client,
  ])

  const handleParamsChange = useCallback(
    (value: Params) => {
      setParams(value)
      localStorage.set('params', value.raw)
    },
    [localStorage],
  )

  // Get object of state values from provided URL
  const getStateFromUrl = useCallback(
    (data: string): ParsedUrlState | null => {
      const match = data.match(sanityUrl)
      if (!match) {
        return null
      }

      const [, usedApiVersion, usedDataset, urlQuery] = match

      const qs = new URLSearchParams(urlQuery)
      const parts: ParsedApiQueryString = parseApiQueryString(qs)
      if (!parts) return null
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

      return {
        query: parts.query,
        params: parts.params,
        rawParams: JSON.stringify(parts.params, null, 2),
        dataset: datasets.includes(usedDataset) ? usedDataset : dataset,
        apiVersion: newApiVersion || apiVersion,
        customApiVersion: newCustomApiVersion,
        perspective: newPerspective || perspective,
        url: data,
      }
    },
    [datasets, dataset, apiVersion, perspective, toast],
  )

  // Use state object from parsed URL to update state
  const setStateFromParsedUrl = useCallback(
    (parsedUrlObj: ParsedUrlState) => {
      // Update state with pasted values
      setDataset(parsedUrlObj.dataset)
      setQuery(parsedUrlObj.query)
      setParams({
        parsed: parsedUrlObj.params,
        raw: parsedUrlObj.rawParams,
        valid: true,
        error: undefined,
      })
      setApiVersion(parsedUrlObj.apiVersion)
      if (parsedUrlObj.customApiVersion) {
        setCustomApiVersion(parsedUrlObj.customApiVersion)
      }
      setPerspectiveState(parsedUrlObj.perspective)
      setUrl(parsedUrlObj.url)
      // Update the codemirror editor content
      editorQueryRef.current?.resetEditorContent(parsedUrlObj.query)
      editorParamsRef.current?.resetEditorContent(parsedUrlObj.rawParams)

      // Update localStorage and client config
      localStorage.merge({
        query: parsedUrlObj.query,
        params: parsedUrlObj.rawParams,
        dataset: parsedUrlObj.dataset,
        apiVersion: parsedUrlObj.customApiVersion || parsedUrlObj.apiVersion,
        perspective: parsedUrlObj.perspective,
      })

      // Execute query with new values
      handleQueryExecution(parsedUrlObj)
    },
    [localStorage, handleQueryExecution],
  )

  const handlePaste = useCallback(
    (evt: ClipboardEvent) => {
      if (!evt.clipboardData) {
        return
      }

      const data = evt.clipboardData.getData('text/plain')
      evt.preventDefault()
      const urlState = getStateFromUrl(data)
      if (urlState) {
        setStateFromParsedUrl(urlState)
        toast.push({
          closable: true,
          id: 'vision-paste',
          status: 'info',
          title: 'Parsed URL to query',
        })
      }
    },
    [getStateFromUrl, setStateFromParsedUrl, toast],
  )

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

  useEffect(() => {
    window.document.addEventListener('paste', handlePaste)
    window.document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.document.removeEventListener('paste', handlePaste)
      window.document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, handlePaste])

  useEffect(() => {
    return () => {
      cancelQuerySubscription()
      cancelListenerSubscription()
    }
  }, [cancelQuerySubscription, cancelListenerSubscription])

  const handleStudioPerspectiveChange = useEffectEvent((stack: StackablePerspective[]) => {
    if (stack.length > 0) {
      setPerspective('pinnedRelease')
    }
  })
  // Handle pinned perspective changes
  useEffect(() => {
    handleStudioPerspectiveChange(perspectiveStack)
  }, [perspectiveStack])

  const generateUrl = useCallback(
    (queryString: string, queryParams: Record<string, unknown>) => {
      const urlQueryOpts: Record<string, string | string[]> = {
        perspective: getActivePerspective({visionPerspective: perspective, perspectiveStack}) ?? [],
      }
      return client.getUrl(
        client.getDataUrl('query', encodeQueryString(queryString, queryParams, urlQueryOpts)),
      )
    },
    [client, perspective, perspectiveStack],
  )

  return (
    <Root
      direction="column"
      height="fill"
      ref={visionRootRef}
      sizing="border"
      overflow="hidden"
      data-testid="vision-root"
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
          minSize={800}
          defaultSize={window.innerWidth - 275}
          size={isQueryRecallCollapsed ? window.innerWidth : window.innerWidth - 275}
          maxSize={-225}
          primary="first"
        >
          <Box height="stretch" flex={1}>
            <SplitPane
              className="sidebarPanes"
              // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
              split={isNarrowBreakpoint ? 'vertical' : 'horizontal'}
              minSize={300}
            >
              <Box height="stretch" flex={1}>
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
                  <InputContainer display="flex" data-testid="vision-query-editor">
                    <Box flex={1}>
                      <InputBackgroundContainerLeft>
                        <Flex>
                          <StyledLabel muted>{t('query.label')}</StyledLabel>
                        </Flex>
                      </InputBackgroundContainerLeft>
                      <VisionCodeMirror
                        initialValue={query}
                        onChange={setQuery}
                        ref={editorQueryRef}
                      />
                    </Box>
                  </InputContainer>
                  <InputContainer display="flex">
                    <ParamsEditor
                      value={params.raw}
                      onChange={handleParamsChange}
                      paramsError={params.error}
                      hasValidParams={params.valid}
                      editorRef={editorParamsRef}
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
          </Box>
          <Box style={{position: 'relative', height: '100%'}}>
            <Button
              mode="ghost"
              padding={2}
              style={{
                position: 'absolute',
                left: -32,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 100,
                pointerEvents: 'auto',
              }}
              onClick={() => setIsQueryRecallCollapsed(!isQueryRecallCollapsed)}
            >
              <div style={{display: 'flex', alignItems: 'center', height: '100%'}}>
                {isQueryRecallCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </div>
            </Button>
            <QueryRecall
              url={url}
              getStateFromUrl={getStateFromUrl}
              setStateFromParsedUrl={setStateFromParsedUrl}
              currentQuery={query}
              currentParams={params.parsed || {}}
              generateUrl={generateUrl}
            />
          </Box>
        </SplitPane>
      </SplitpaneContainer>
    </Root>
  )
}
