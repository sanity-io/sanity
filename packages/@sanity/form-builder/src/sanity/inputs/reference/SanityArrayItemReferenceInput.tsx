import React, {ComponentProps, ForwardedRef, forwardRef, useCallback, useMemo, useRef} from 'react'

import {
  Marker,
  Path,
  Reference,
  ReferenceFilterSearchOptions,
  ReferenceOptions,
  ReferenceSchemaType,
  SanityDocument,
} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {get} from '@sanity/util/paths'
import {FormFieldPresence} from '@sanity/base/presence'
import {from, throwError} from 'rxjs'
import {catchError, mergeMap} from 'rxjs/operators'
import withValuePath from '../../../utils/withValuePath'
import withDocument from '../../../utils/withDocument'
import {useReferenceInputOptions} from '../../contexts/ReferenceInputOptions'
import PatchEvent from '../../../PatchEvent'
import * as adapter from '../client-adapters/reference'
import {ArrayItemReferenceInput} from '../../../inputs/ReferenceInput/ArrayItemReferenceInput'
import {EditReferenceEvent} from '../../../inputs/ReferenceInput/types'

// eslint-disable-next-line require-await
async function resolveUserDefinedFilter(
  options: ReferenceOptions | undefined,
  document: SanityDocument,
  valuePath: Path
): Promise<ReferenceFilterSearchOptions> {
  if (!options) {
    return {}
  }

  if (typeof options.filter === 'function') {
    const parentPath = valuePath.slice(0, -1)
    const parent = get(document, parentPath) as Record<string, unknown>
    return options.filter({document, parentPath, parent})
  }

  return {
    filter: options.filter,
    params: 'filterParams' in options ? options.filterParams : undefined,
  }
}

export type Props = {
  value: Reference
  compareValue?: Reference
  type: ReferenceSchemaType
  markers: Marker[]
  focusPath: Path
  readOnly?: boolean
  isSortable: boolean
  onFocus: (path: Path) => void
  onChange: (event: PatchEvent) => void
  level: number
  presence: FormFieldPresence[]

  // From withDocument
  document: SanityDocument

  // From withValuePath
  getValuePath: () => Path
}

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

const SanityReferenceInput = forwardRef(function SanityReferenceInput(
  props: Props,
  ref: ForwardedRef<HTMLInputElement>
) {
  const {getValuePath, type, document} = props
  const {
    EditReferenceLinkComponent,
    onEditReference,
    activePath,
    initialValueTemplateItems,
  } = useReferenceInputOptions()

  const documentRef = useValueRef(document)

  const valuePath = useMemo(getValuePath, [getValuePath])

  const disableNew = type.options?.disableNew === true

  const handleSearch = useCallback(
    (searchString: string) =>
      from(resolveUserDefinedFilter(type.options, documentRef.current, getValuePath())).pipe(
        mergeMap(({filter, params}) =>
          adapter.search(searchString, type, {
            ...type.options,
            filter,
            params,
            tag: 'search.reference',
          })
        ),
        catchError((err: SearchError) => {
          const isQueryError = err.details && err.details.type === 'queryParseError'
          if (type.options?.filter && isQueryError) {
            err.message = `Invalid reference filter, please check the custom "filter" option`
          }
          return throwError(err)
        })
      ),
    [documentRef, getValuePath, type]
  )

  const EditReferenceLink = useMemo(
    () =>
      forwardRef(function EditReferenceLink_(
        _props: ComponentProps<NonNullable<typeof EditReferenceLinkComponent>>,
        forwardedRef: ForwardedRef<'a'>
      ) {
        return EditReferenceLinkComponent ? (
          <EditReferenceLinkComponent {..._props} ref={forwardedRef} parentRefPath={valuePath} />
        ) : null
      }),
    [EditReferenceLinkComponent, valuePath]
  )

  const handleEditReference = useCallback(
    (event: EditReferenceEvent) => {
      onEditReference?.({
        parentRefPath: valuePath,
        id: event.id,
        type: event.type,
        template: event.template,
      })
    },
    [onEditReference, valuePath]
  )

  const selectedState = PathUtils.startsWith(valuePath, activePath?.path || [])
    ? activePath?.state
    : 'none'

  const createOptions = useMemo(() => {
    if (disableNew) {
      return []
    }
    return (
      initialValueTemplateItems
        // eslint-disable-next-line max-nested-callbacks
        .filter((i) => type.to.some((refType) => refType.name === i.template.schemaType))
        .map((item) => ({
          id: item.id,
          title: item.title || `${item.template.schemaType} from template ${item.template.id}`,
          type: item.template.schemaType,
          icon: item.icon,
          template: {
            id: item.template.id,
            params: item.parameters,
          },
          permission: {granted: item.granted, reason: item.reason},
        }))
    )
  }, [disableNew, initialValueTemplateItems, type.to])

  return (
    <ArrayItemReferenceInput
      {...props}
      onSearch={handleSearch}
      getReferenceInfo={adapter.getReferenceInfo}
      ref={ref}
      selectedState={selectedState}
      editReferenceLinkComponent={EditReferenceLink}
      createOptions={createOptions}
      onEditReference={handleEditReference}
    />
  )
})

export default withValuePath(withDocument(SanityReferenceInput))
