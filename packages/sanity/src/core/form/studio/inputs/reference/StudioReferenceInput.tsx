/* eslint-disable max-nested-callbacks */
import {type ClientPerspective, type SanityDocument} from '@sanity/client'
import {getPublishedId} from '@sanity/client/csm'
import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {type Reference, type ReferenceSchemaType} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {
  type ComponentProps,
  type ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {combineLatest, from, throwError} from 'rxjs'
import {catchError, map, mergeMap, switchMap} from 'rxjs/operators'

import {useSchema} from '../../../../hooks'
import {usePerspective} from '../../../../perspective/usePerspective'
import {createSearch} from '../../../../search'
import {useDocumentPreviewStore} from '../../../../store'
import {useSource} from '../../../../studio'
import {useSearchMaxFieldDepth} from '../../../../studio/components/navbar/search/hooks/useSearchMaxFieldDepth'
import {isNonNullable} from '../../../../util'
import {useFormValue} from '../../../contexts/FormValue'
import {ReferenceInput} from '../../../inputs/ReferenceInput/ReferenceInput'
import {
  type CreateReferenceOption,
  type EditReferenceEvent,
} from '../../../inputs/ReferenceInput/types'
import {type ObjectInputProps} from '../../../types'
import {useReferenceInputOptions} from '../../contexts'
import * as adapter from '../client-adapters/reference'
import {resolveUserDefinedFilter} from './resolveUserDefinedFilter'

/**
 *
 * @hidden
 * @beta
 */
export type StudioReferenceInputProps = ObjectInputProps<Reference, ReferenceSchemaType>

function useValueRef<T>(value: T): {current: T} {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

type SearchError = {
  message: string
  details?: {
    type: string
    description: string
  }
}

/**
 * createSearchQuery currently defaults to explicitly set `raw` perspective if no perspective is given
 * so we here need to bypass that default by explicitly setting `published` if no perspective or empty array
 * @param perspective - a perspective or perspective stack
 */
function ensurePublished(
  perspective: Exclude<ClientPerspective, 'raw' | 'previewDrafts'> | undefined,
) {
  // note: perspective may be a string here too, but that's ok
  if (!perspective || perspective.length === 0) {
    return ['published']
  }
  return perspective
}

/**
 *
 * @hidden
 * @beta
 */
export function StudioReferenceInput(props: StudioReferenceInputProps) {
  const source = useSource()
  const searchClient = source.getClient({apiVersion: 'vX'})
  const {perspectiveStack} = usePerspective()
  const schema = useSchema()
  const maxFieldDepth = useSearchMaxFieldDepth()
  const documentPreviewStore = useDocumentPreviewStore()
  const {path, schemaType} = props
  const {
    EditReferenceLinkComponent,
    onEditReference,
    activePath,
    initialValueTemplateItems,
    ...inheritedOptions
  } = useReferenceInputOptions()
  const {strategy: searchStrategy} = source.search

  const documentValue = useFormValue([]) as SanityDocument
  const documentRef = useValueRef(documentValue)
  const documentTypeName = documentRef.current?._type
  const refType = schema.get(documentTypeName)

  const isDocumentLiveEdit = useMemo(() => refType?.liveEdit, [refType])

  const disableNew = inheritedOptions.disableNew ?? schemaType.options?.disableNew === true
  const getClient = source.getClient

  const handleSearch = useCallback(
    (searchString: string) =>
      from(
        resolveUserDefinedFilter({
          options: schemaType.options,
          document: documentRef.current,
          perspective: perspectiveStack,
          valuePath: path,
          getClient,
        }),
      ).pipe(
        mergeMap(({filter, params, perspective: userDefinedFilterPerspective}) => {
          if (
            userDefinedFilterPerspective?.includes('raw') ||
            userDefinedFilterPerspective?.includes('previewDrafts')
          ) {
            throw new Error(
              'Invalid perspective returned from reference filter: Neither raw nor previewDrafts is supported.',
            )
          }

          const options = {
            ...schemaType.options,
            filter,
            params,
            tag: 'search.reference',
            maxFieldDepth,
            strategy: searchStrategy,
            perspective: userDefinedFilterPerspective || perspectiveStack,
          }

          const search = createSearch(schemaType.to, searchClient, {
            ...options,
            maxDepth: options.maxFieldDepth || DEFAULT_MAX_FIELD_DEPTH,
          })

          return search(searchString, {
            perspective: ensurePublished(options.perspective),
            limit: 101,
          }).pipe(
            map(({hits}) => hits.map(({hit}) => hit)),
            switchMap((docs) => {
              // Note: It might seem like this step is redundant, but it's here for a reason:
              // The list of search hits returned from here will be passed as options to the reference input's autocomplete. When
              // one of them gets selected by the user, it will then be passed as the argument to the `onChange` handler in the
              // Reference Input. This handler will then look at the passed value to determine whether to make a link to a
              // draft (using _strengthenOnPublish) or a published document.
              //
              // Without this step, in a case where both a draft and a published version exist but only the draft matches
              // the search term, we'd end up making a reference with `_strengthenOnPublish: true`, when we instead should be
              // making a normal reference to the published id
              return combineLatest(
                docs.map((doc) =>
                  documentPreviewStore.observePaths({_id: getPublishedId(doc._id)}, ['_rev']).pipe(
                    map((published) => ({
                      id: doc._id,
                      type: doc._type,
                      published: Boolean(published),
                    })),
                  ),
                ),
              )
            }),
          )
        }),
        catchError((err: SearchError) => {
          const isQueryError = err.details && err.details.type === 'queryParseError'
          if (schemaType.options?.filter && isQueryError) {
            return throwError(
              () =>
                new Error(`Invalid reference filter, please check the custom "filter" option`, {
                  cause: err,
                }),
            )
          }
          return throwError(() => err)
        }),
      ),
    [
      schemaType.options,
      schemaType.to,
      documentRef,
      perspectiveStack,
      path,
      getClient,
      maxFieldDepth,
      searchStrategy,
      searchClient,
      documentPreviewStore,
    ],
  )

  const template = props.value?._strengthenOnPublish?.template
  const EditReferenceLink = useMemo(
    () =>
      forwardRef(function EditReferenceLink_(
        _props: ComponentProps<NonNullable<typeof EditReferenceLinkComponent>>,
        forwardedRef: ForwardedRef<'a'>,
      ) {
        return EditReferenceLinkComponent ? (
          <EditReferenceLinkComponent
            {..._props}
            ref={forwardedRef}
            parentRefPath={path}
            template={template}
          />
        ) : null
      }),
    [EditReferenceLinkComponent, path, template],
  )

  const handleEditReference = useCallback(
    (event: EditReferenceEvent) => {
      onEditReference?.({
        parentRefPath: path,
        id: event.id,
        type: event.type,
        template: event.template,
        version: event.version,
      })
    },
    [onEditReference, path],
  )

  const selectedState = PathUtils.startsWith(path, activePath?.path || [])
    ? activePath?.state
    : 'none'

  const createOptions = useMemo(() => {
    if (disableNew) {
      return []
    }
    return (initialValueTemplateItems || [])

      .filter((i) => {
        return schemaType.to.some((_refType) => {
          return _refType.name === i.template?.schemaType
        })
      })
      .map((item): CreateReferenceOption | undefined =>
        item.template?.schemaType
          ? {
              id: item.id,
              title: item.title || `${item.template.schemaType} from template ${item.template?.id}`,
              i18n: item.i18n,
              type: item.template.schemaType,
              icon: item.icon,
              template: {
                id: item.template?.id,
                params: item.parameters,
              },

              permission: {granted: item.granted, reason: item.reason},
            }
          : undefined,
      )
      .filter(isNonNullable)
  }, [disableNew, initialValueTemplateItems, schemaType.to])

  const getReferenceInfo = useCallback(
    (id: string, _type: ReferenceSchemaType) =>
      adapter.getReferenceInfo(documentPreviewStore, id, _type, perspectiveStack),
    [documentPreviewStore, perspectiveStack],
  )

  return (
    <ReferenceInput
      {...props}
      onSearch={handleSearch}
      liveEdit={isDocumentLiveEdit}
      getReferenceInfo={getReferenceInfo}
      selectedState={selectedState}
      editReferenceLinkComponent={EditReferenceLink}
      createOptions={createOptions}
      onEditReference={handleEditReference}
    />
  )
}
