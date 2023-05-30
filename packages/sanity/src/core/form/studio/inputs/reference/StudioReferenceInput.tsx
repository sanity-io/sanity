import {
  Path,
  Reference,
  ReferenceFilterSearchOptions,
  ReferenceOptions,
  ReferenceSchemaType,
  SanityDocument,
} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {get} from '@sanity/util/paths'
import React, {ComponentProps, ForwardedRef, forwardRef, useCallback, useMemo, useRef} from 'react'
import {from, throwError} from 'rxjs'
import {catchError, mergeMap} from 'rxjs/operators'
import * as adapter from '../client-adapters/reference'
import {ReferenceInput} from '../../../inputs/ReferenceInput/ReferenceInput'
import {CreateReferenceOption, EditReferenceEvent} from '../../../inputs/ReferenceInput/types'
import {useReferenceInputOptions} from '../../contexts'
import {ObjectInputProps} from '../../../types'
import {Source} from '../../../../config'
import {useSource} from '../../../../studio'
import {useFormValue} from '../../../useFormValue'
import {useSchema} from '../../../../hooks'
import {useDocumentPreviewStore} from '../../../../store'
import {FIXME} from '../../../../FIXME'
import {isNonNullable} from '../../../../util'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'

async function resolveUserDefinedFilter(
  options: ReferenceOptions | undefined,
  document: SanityDocument,
  valuePath: Path,
  getClient: Source['getClient']
): Promise<ReferenceFilterSearchOptions> {
  if (!options) {
    return {}
  }

  if (typeof options.filter === 'function') {
    const parentPath = valuePath.slice(0, -1)
    const parent = get(document, parentPath) as Record<string, unknown>
    const resolvedFilter = await options.filter({document, parentPath, parent, getClient})
    return resolvedFilter
  }

  return {
    filter: options.filter,
    params: 'filterParams' in options ? options.filterParams : undefined,
  }
}

/**
 *
 * @hidden
 * @beta
 */
export type StudioReferenceInputProps = ObjectInputProps<Reference, ReferenceSchemaType>

function useValueRef<T>(value: T): {current: T} {
  const ref = useRef(value)
  ref.current = value
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
  const schema = useSchema()
  const documentPreviewStore = useDocumentPreviewStore()
  const {path, schemaType} = props
  const {EditReferenceLinkComponent, onEditReference, activePath, initialValueTemplateItems} =
    useReferenceInputOptions()

  const documentValue = useFormValue([]) as FIXME
  const documentRef = useValueRef(documentValue)
  const documentTypeName = documentRef.current?._type
  const refType = schema.get(documentTypeName)

  const isDocumentLiveEdit = useMemo(() => refType?.liveEdit, [refType])

  const disableNew = schemaType.options?.disableNew === true
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
          })
        ),

        catchError((err: SearchError) => {
          const isQueryError = err.details && err.details.type === 'queryParseError'
          if (schemaType.options?.filter && isQueryError) {
            err.message = `Invalid reference filter, please check the custom "filter" option`
          }
          return throwError(err)
        })
      ),

    [documentRef, path, searchClient, schemaType, getClient]
  )

  const template = props.value?._strengthenOnPublish?.template
  const EditReferenceLink = useMemo(
    () =>
      forwardRef(function EditReferenceLink_(
        _props: ComponentProps<NonNullable<typeof EditReferenceLinkComponent>>,
        forwardedRef: ForwardedRef<'a'>
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
    [EditReferenceLinkComponent, path, template]
  )

  const handleEditReference = useCallback(
    (event: EditReferenceEvent) => {
      onEditReference?.({
        parentRefPath: path,
        id: event.id,
        type: event.type,
        template: event.template,
      })
    },
    [onEditReference, path]
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
                type: item.template.schemaType,
                icon: item.icon,
                template: {
                  id: item.template?.id,
                  params: item.parameters,
                },

                permission: {granted: item.granted, reason: item.reason},
              }
            : undefined
        )
        .filter(isNonNullable)
    )
  }, [disableNew, initialValueTemplateItems, schemaType.to])

  const getReferenceInfo = useCallback(
    (id: string, _type: ReferenceSchemaType) =>
      adapter.getReferenceInfo(documentPreviewStore, id, _type),
    [documentPreviewStore]
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
