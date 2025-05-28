/* eslint-disable no-console */

import {forwardRef, type PropsWithChildren, useCallback, useMemo} from 'react'
import {getPublishedId, useUnique} from 'sanity'
import {StateLink, useRouter} from 'sanity/router'
import {
  type BackLinkProps,
  PaneRouterContext,
  type PaneRouterContextValue,
  type ReferenceChildLinkProps,
} from 'sanity/structure'

import {
  type PresentationParamsContextValue,
  type PresentationSearchParams,
  type StructureDocumentPaneParams,
} from '../types'

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

const BackLink = forwardRef(function BackLink(
  props: BackLinkProps & {searchParams: PresentationSearchParams},
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  const {searchParams, ...restProps} = props
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
})

const ReferenceChildLink = forwardRef(function ReferenceChildLink(
  props: ReferenceChildLinkProps & {searchParams: PresentationSearchParams},
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  const {
    documentId,
    documentType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parentRefPath,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    template,
    searchParams,
    ...restProps
  } = props

  return (
    <StateLink
      {...restProps}
      ref={ref}
      state={{
        id: documentId,
        type: documentType,
        _searchParams: Object.entries(searchParams),
      }}
      title={undefined}
    />
  )
})

export function PresentationPaneRouterProvider(
  props: PropsWithChildren<{
    onStructureParams: (params: StructureDocumentPaneParams) => void
    refs?: {_id: string; _type: string}[]
    searchParams: PresentationSearchParams
    structureParams: StructureDocumentPaneParams
  }>,
): React.JSX.Element {
  const {children, onStructureParams, structureParams, searchParams, refs} = props

  const {state: routerState, resolvePathFromState} = useRouter()

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: structureParams as any,
      hasGroupSiblings: false,
      groupLength: 1,
      routerPanesState: [],
      ChildLink: (childLinkProps) => {
        const {childId, ...restProps} = childLinkProps
        const ref = refs?.find((r) => r._id === childId || getPublishedId(r._id) === childId)
        if (ref) {
          return (
            <StateLink
              {...restProps}
              state={{
                id: childId,
                type: ref._type,
                _searchParams: Object.entries(searchParams),
              }}
            />
          )
        }

        return <div {...restProps} />
      },
      BackLink: (backLinkProps) => <BackLink {...backLinkProps} searchParams={searchParams} />,
      ReferenceChildLink: (childLinkProps) => (
        <ReferenceChildLink {...childLinkProps} searchParams={searchParams} />
      ),
      ParameterizedLink: () => {
        throw new Error('ParameterizedLink not implemented')
      },
      closeCurrentAndAfter: () => {
        console.warn('closeCurrentAndAfter')
      },
      handleEditReference: (options) => {
        console.warn('handleEditReference', options)
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
      setParams: (nextParams) => {
        // eslint-disable-next-line no-warning-comments
        // @todo set inspect param to undefined manually as param is missing from object when closing inspector
        onStructureParams({
          ...nextParams,
          inspect: nextParams.inspect ?? undefined,
        } as StructureDocumentPaneParams)
      },
      setPayload: (payload) => {
        console.warn('setPayload', payload)
      },
      navigateIntent: (intentName, intentParams, options) => {
        console.warn('navigateIntent', intentName, intentParams, options)
      },
      createPathWithParams,
    }
  }, [createPathWithParams, onStructureParams, refs, searchParams, structureParams])

  return <PaneRouterContext.Provider value={context}>{children}</PaneRouterContext.Provider>
}
