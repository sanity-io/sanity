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
import {from, throwError} from 'rxjs'
import {catchError, mergeMap} from 'rxjs/operators'

import {type FIXME} from '../../../../FIXME'
import {useSchema} from '../../../../hooks'
import {usePerspective} from '../../../../perspective/usePerspective'
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
  const {selectedReleaseId} = usePerspective()
  const {path, schemaType} = props
  const {
    EditReferenceLinkComponent,
    onEditReference,
    activePath,
    initialValueTemplateItems,
    ...inheritedOptions
  } = useReferenceInputOptions()
  const {strategy: searchStrategy} = source.search

  const documentValue = useFormValue([]) as FIXME
  const documentRef = useValueRef(documentValue)
  const documentTypeName = documentRef.current?._type
  const refType = schema.get(documentTypeName)

  const isDocumentLiveEdit = useMemo(() => refType?.liveEdit, [refType])

  const disableNew = inheritedOptions.disableNew ?? schemaType.options?.disableNew === true
  const getClient = source.getClient

  const handleSearch = useCallback(
    (searchString: string) =>
      from(resolveUserDefinedFilter(schemaType.options, documentRef.current, path, getClient)).pipe(
        mergeMap(({filter, params}) =>
          adapter.referenceSearch(searchClient, searchString, schemaType, {
            ...schemaType.options,
            filter,
            params,
            tag: 'search.reference',
            maxFieldDepth,
            strategy: searchStrategy,
            perspective: perspectiveStack,
          }),
        ),

        catchError((err: SearchError) => {
          const isQueryError = err.details && err.details.type === 'queryParseError'
          if (schemaType.options?.filter && isQueryError) {
            err.message = `Invalid reference filter, please check the custom "filter" option`
          }
          return throwError(err)
        }),
      ),

    [
      schemaType,
      documentRef,
      path,
      getClient,
      searchClient,
      maxFieldDepth,
      searchStrategy,
      perspectiveStack,
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
    return (
      (initialValueTemplateItems || [])
        // eslint-disable-next-line max-nested-callbacks
        .filter((i) => {
          return schemaType.to.some((_refType) => {
            return _refType.name === i.template?.schemaType
          })
        })
        .map((item): CreateReferenceOption | undefined =>
          item.template?.schemaType
            ? {
                id: item.id,
                title:
                  item.title || `${item.template.schemaType} from template ${item.template?.id}`,
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
    )
  }, [disableNew, initialValueTemplateItems, schemaType.to])

  const getReferenceInfo = useCallback(
    (id: string, _type: ReferenceSchemaType) =>
      adapter.getReferenceInfo(documentPreviewStore, id, _type),
    [documentPreviewStore],
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
      version={selectedReleaseId}
    />
  )
}
