import {type Path, type Reference, type ReferenceSchemaType} from '@sanity/types'
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

import {type FIXME} from '../../../FIXME'
import {useSchema} from '../../../hooks'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentPreviewStore} from '../../../store'
import {isNonNullable} from '../../../util'
import {useFormValue} from '../../contexts/FormValue'
import {useReferenceInputOptions} from '../../studio'
import * as adapter from '../../studio/inputs/client-adapters/reference'
import {type EditReferenceEvent} from './types'

function useValueRef<T>(value: T): {current: T} {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

interface Options {
  path: Path
  schemaType: ReferenceSchemaType
  value?: Reference
  version?: string
}

export function useReferenceInput(options: Options) {
  const {path, schemaType, version} = options
  const schema = useSchema()
  const perspective = usePerspective()
  const documentPreviewStore = useDocumentPreviewStore()
  const {
    EditReferenceLinkComponent,
    onEditReference,
    activePath,
    initialValueTemplateItems,
    ...inheritedOptions
  } = useReferenceInputOptions()

  const documentValue = useFormValue([]) as FIXME
  const documentRef = useValueRef(documentValue)

  const documentTypeName = documentRef.current?._type

  const isCurrentDocumentLiveEdit = useMemo(() => {
    return schema.get(documentTypeName)?.liveEdit
  }, [documentTypeName, schema])

  const disableNew = inheritedOptions.disableNew ?? schemaType.options?.disableNew === true

  const template = options.value?._strengthenOnPublish?.template
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
        .filter((i) => schemaType.to.some((refType) => refType.name === i.template?.schemaType))
        .map((item) =>
          item.template?.schemaType
            ? {
                id: item.id,
                title:
                  item.title || `${item.template.schemaType} from template ${item.template.id}`,
                type: item.template.schemaType,
                icon: item.icon,
                template: {
                  id: item.template.id,
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
    (id: string) =>
      adapter.getReferenceInfo(documentPreviewStore, id, schemaType, {
        version,
        perspective: perspective.perspectiveStack,
      }),
    [documentPreviewStore, schemaType, version, perspective.perspectiveStack],
  )

  return {
    selectedState,
    isCurrentDocumentLiveEdit,
    handleEditReference,
    EditReferenceLink,
    createOptions,
    getReferenceInfo,
  }
}
