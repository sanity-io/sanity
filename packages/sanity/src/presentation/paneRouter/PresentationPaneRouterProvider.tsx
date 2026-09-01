import {toString as pathToString} from '@sanity/util/paths'
import {type PropsWithChildren, useCallback, useContext, useMemo, type RefAttributes} from 'react'
import {getPublishedId, useUnique} from 'sanity'
import {PresentationPaneLinksContext} from 'sanity/_singletons'
import {StateLink, useRouter} from 'sanity/router'
import {
  type BackLinkProps,
  type ChildLinkProps,
  PaneRouterContext,
  type PaneRouterContextValue,
  type ReferenceChildLinkProps,
} from 'sanity/structure'

import {
  type PresentationNavigate,
  type PresentationPaneLinksContextValue,
  type PresentationParamsContextValue,
  type PresentationSearchParams,
  type StructureDocumentPaneParams,
} from '../types'
import {ChildLink} from './ChildLink'
import {ReferenceChildLink} from './ReferenceChildLink'
import {StructureIntentChildLink} from './StructureIntentChildLink'

function encodeQueryString(params: Record<string, unknown> = {}): string {
  const parts = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  return parts.length ? `?${parts}` : ''
}

function resolveQueryStringFromParams(nextParams: Record<string, string | undefined>) {
  const allowed = [
    'comment',
    'inspect',
    'instruction',
    'pathKey',
    'rev',
    'since',
    'template',
    'view',
  ] satisfies Array<keyof PresentationParamsContextValue> as string[]

  const safeNextParams = Object.entries(nextParams)
    .filter(([key]) => allowed.includes(key))
    .reduce((obj, [key, value]) => {
      if (value == undefined) return obj
      return {...obj, [key]: value}
    }, {})

  return encodeQueryString(safeNextParams)
}

function BackLink(
  props: BackLinkProps & {
    searchParams: PresentationSearchParams
  } & RefAttributes<HTMLAnchorElement>,
) {
  const {ref, searchParams, ...restProps} = props
  return (
    <StateLink
      {...restProps}
      ref={ref}
      state={{
        type: undefined,
        _searchParams: Object.entries(searchParams),
      }}
      title={undefined}
    />
  )
}

function usePaneLinks(): PresentationPaneLinksContextValue {
  const value = useContext(PresentationPaneLinksContext)
  if (!value) {
    throw new Error('Presentation: missing pane links context')
  }
  return value
}

function PaneRouterChildLink(props: ChildLinkProps & RefAttributes<HTMLAnchorElement>) {
  const {refs, searchParams} = usePaneLinks()
  const {ref, childId, childParameters, ...rest} = props
  const doc = refs?.find((r) => r._id === childId || getPublishedId(r._id) === childId)

  if (!doc) {
    return (
      <StructureIntentChildLink
        {...rest}
        ref={ref}
        childId={childId}
        childParameters={childParameters}
      />
    )
  }
  return (
    <ChildLink
      {...rest}
      ref={ref}
      childId={childId}
      childType={doc._type}
      searchParams={searchParams}
    />
  )
}

function PaneRouterBackLink(props: BackLinkProps & RefAttributes<HTMLAnchorElement>) {
  const {searchParams} = usePaneLinks()
  return <BackLink {...props} searchParams={searchParams} />
}

function PaneRouterReferenceChildLink(
  props: ReferenceChildLinkProps & RefAttributes<HTMLAnchorElement>,
) {
  const {searchParams} = usePaneLinks()
  return <ReferenceChildLink {...props} searchParams={searchParams} />
}

export type PresentationPaneRouterProviderProps = PropsWithChildren<{
  onEditReference: PresentationNavigate
  onStructureParams: (params: StructureDocumentPaneParams) => void
  refs?: {_id: string; _type: string}[]
  searchParams: PresentationSearchParams
  structureParams: StructureDocumentPaneParams
}>

export function PresentationPaneRouterProvider(
  props: PresentationPaneRouterProviderProps,
): React.JSX.Element {
  const {children, onEditReference, onStructureParams, structureParams, searchParams, refs} = props

  const {state: routerState, resolvePathFromState} = useRouter()

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const routerSearchParams = useUnique(Object.fromEntries(routerState._searchParams || []))

  const createPathWithParams: PaneRouterContextValue['createPathWithParams'] = useCallback(
    (nextParams) => {
      const path = resolvePathFromState(routerState)
      const qs = resolveQueryStringFromParams({
        ...routerSearchParams,
        ...nextParams,
      })
      return `${path}${qs}`
    },
    [resolvePathFromState, routerSearchParams, routerState],
  )

  const context: PaneRouterContextValue = useMemo(() => {
    return {
      index: 0,
      groupIndex: 0,
      siblingIndex: 0,
      payload: {},
      // oxlint-disable-next-line no-explicit-any
      params: structureParams as any,
      hasGroupSiblings: false,
      groupLength: 1,
      routerPanesState: [],
      ChildLink: PaneRouterChildLink,
      BackLink: PaneRouterBackLink,
      ReferenceChildLink: PaneRouterReferenceChildLink,
      ParameterizedLink: () => {
        throw new Error('ParameterizedLink not implemented')
      },
      closeCurrentAndAfter: () => {
        console.warn('closeCurrentAndAfter')
      },
      handleEditReference: (options) => {
        const {id, template, type, parentRefPath, version} = options
        onEditReference({
          state: {id, type},
          params: {
            template: template.id,
            parentRefPath: pathToString(parentRefPath),
            version,
          },
        })
      },
      replaceCurrent: (pane) => {
        console.warn('replaceCurrent', pane)
      },
      closeCurrent: () => {
        console.warn('closeCurrent')
      },
      duplicateCurrent: (pane) => {
        console.warn('duplicateCurrent', pane)
      },
      setView: (viewId) => {
        console.warn('setView', viewId)
      },
      setParams: onStructureParams,
      setPayload: (payload) => {
        console.warn('setPayload', payload)
      },
      navigateIntent: (intentName, intentParams, options) => {
        console.warn('navigateIntent', intentName, intentParams, options)
      },
      createPathWithParams,
    }
  }, [createPathWithParams, onEditReference, onStructureParams, structureParams])

  const paneLinks: PresentationPaneLinksContextValue = useMemo(
    () => ({refs, searchParams}),
    [refs, searchParams],
  )

  return (
    <PresentationPaneLinksContext.Provider value={paneLinks}>
      <PaneRouterContext.Provider value={context}>{children}</PaneRouterContext.Provider>
    </PresentationPaneLinksContext.Provider>
  )
}
