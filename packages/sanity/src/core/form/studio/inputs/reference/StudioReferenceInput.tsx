/* eslint-disable max-nested-callbacks */
import {type SanityDocument, type StackablePerspective} from '@sanity/client'
import {getPublishedId} from '@sanity/client/csm'
import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {
  type Reference,
  type ReferenceFilterSearchOptions,
  type ReferenceSchemaType,
} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {type ComponentProps, type ForwardedRef, forwardRef, useCallback, useMemo} from 'react'
import {combineLatest, from, throwError} from 'rxjs'
import {catchError, map, mergeMap, switchMap} from 'rxjs/operators'

import {useSchema} from '../../../../hooks'
import {usePerspective} from '../../../../perspective/usePerspective'
import {createSearch} from '../../../../search'
import {useDocumentPreviewStore} from '../../../../store'
import {useSource} from '../../../../studio'
import {useSearchMaxFieldDepth} from '../../../../studio/components/navbar/search/hooks/useSearchMaxFieldDepth'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
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

type SearchError = {
  message: string
  details?: {
    type: string
    description: string
  }
}

function getInvalidUserDefinedPerspectives(
  valid: StackablePerspective[],
  perspective: ReferenceFilterSearchOptions['perspective'],
) {
  const normalizedUserDefinedFilterPerspective = perspective
    ? Array.isArray(perspective)
      ? perspective
      : [perspective]
    : []

  return normalizedUserDefinedFilterPerspective.filter(
    (p) => p !== 'drafts' && p !== 'published' && !valid.includes(p),
  )
}
/**
 *
 * @hidden
 * @beta
 */
export function StudioReferenceInput(props: StudioReferenceInputProps) {
  const source = useSource()
  const searchClient = source.getClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
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
  const documentTypeName = documentValue?._type
  const refType = schema.get(documentTypeName)

  const isDocumentLiveEdit = useMemo(() => refType?.liveEdit, [refType])

  const disableNew = inheritedOptions.disableNew ?? schemaType.options?.disableNew === true
  const getClient = source.getClient

  const handleSearch = useCallback(
    (searchString: string) =>
      from(
        resolveUserDefinedFilter({
          options: schemaType.options,
          document: documentValue,
          perspective: perspectiveStack,
          valuePath: path,
          getClient,
        }),
      ).pipe(
        mergeMap(({filter, params, perspective: userDefinedFilterPerspective}) => {
          const invalidPerspectives = getInvalidUserDefinedPerspectives(
            perspectiveStack,
            userDefinedFilterPerspective,
          )

          if (invalidPerspectives.length > 0) {
            throw new Error(
              `Custom reference filter returned an invalid perspective. Filters can only remove perspectives from the passed stack, not add new ones. Expected a subset of [${perspectiveStack.join(', ')}], but received [${userDefinedFilterPerspective}].`,
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
            perspective: options.perspective,
            // todo: consider using this to show a "More hits, please refine your search"-item at the end of the dropdown list
            limit: 101,
          }).pipe(
            map(({hits}) => hits.map(({hit}) => hit)),
            switchMap((docs) => {
              // Note: we need to know whether a published version of each document exists
              // so we can correctly set `_strengthenOnPublish` when the user selects one
              // of them from the list of options
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
      documentValue,
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
