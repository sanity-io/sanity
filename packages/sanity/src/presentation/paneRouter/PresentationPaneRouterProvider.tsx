import {toString as pathToString} from '@sanity/util/paths'
import {forwardRef, type PropsWithChildren, useCallback, useMemo} from 'react'
import {getPublishedId, useUnique} from 'sanity'
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
  type PresentationParamsContextValue,
  type PresentationSearchParams,
  type StructureDocumentPaneParams,
} from '../types'
import {ChildLink} from './ChildLink'
import {ReferenceChildLink} from './ReferenceChildLink'

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
      ChildLink: forwardRef<HTMLAnchorElement, ChildLinkProps>(
        function ContextChildLink(childLinkProps, ref) {
          const {childId, ...rest} = childLinkProps
          const doc = refs?.find((r) => r._id === childId || getPublishedId(r._id) === childId)

          if (!doc) {
            console.warn(`ChildLink: No document found for childId "${childId}"`)
            return null
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
        },
      ),
      BackLink: forwardRef<HTMLAnchorElement, BackLinkProps>(
        function ContextBackLink(backLinkProps, ref) {
          return <BackLink {...backLinkProps} ref={ref} searchParams={searchParams} />
        },
      ),
      ReferenceChildLink: forwardRef<HTMLAnchorElement, ReferenceChildLinkProps>(
        function ContextReferenceChildLink(childLinkProps, ref) {
          return <ReferenceChildLink {...childLinkProps} ref={ref} searchParams={searchParams} />
        },
      ),
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
  }, [
    createPathWithParams,
    onEditReference,
    onStructureParams,
    refs,
    searchParams,
    structureParams,
  ])

  return <PaneRouterContext.Provider value={context}>{children}</PaneRouterContext.Provider>
}
