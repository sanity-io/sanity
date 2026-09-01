import {type Path, type ReferenceSchemaType} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {useCallback, useMemo} from 'react'

import {type FIXME} from '../../../FIXME'
import {useSchema} from '../../../hooks/useSchema'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentPreviewStore} from '../../../store/datastores'
import {isNonNullable} from '../../../util/isNonNullable'
import {useFormValue} from '../../contexts/FormValue'
import {useReferenceInputOptions} from '../../studio/contexts/ReferenceInputOptions'
import * as adapter from '../../studio/inputs/client-adapters/reference'
import {type EditReferenceEvent} from './types'

interface Options {
  path: Path
  schemaType: ReferenceSchemaType
}

export function useReferenceInput(options: Options) {
  const {path, schemaType} = options
  const schema = useSchema()
  const perspective = usePerspective()
  const documentPreviewStore = useDocumentPreviewStore()
  const {onEditReference, activePath, initialValueTemplateItems, ...inheritedOptions} =
    useReferenceInputOptions()

  const documentValue = useFormValue([]) as FIXME

  const documentTypeName = documentValue?._type

  const isCurrentDocumentLiveEdit = useMemo(() => {
    return schema.get(documentTypeName)?.liveEdit
  }, [documentTypeName, schema])

  const disableNew = inheritedOptions.disableNew ?? schemaType.options?.disableNew === true

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
    return (initialValueTemplateItems || [])

      .filter((i) => schemaType.to.some((refType) => refType.name === i.template?.schemaType))
      .map((item) =>
        item.template?.schemaType
          ? {
              id: item.id,
              title: item.title || `${item.template.schemaType} from template ${item.template.id}`,
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
  }, [disableNew, initialValueTemplateItems, schemaType.to])

  const getReferenceInfo = useCallback(
    (id: string) =>
      adapter.getReferenceInfo(
        documentPreviewStore,
        id,
        schemaType,
        perspective.perspectiveStack,
        perspective.selectedVariantName,
      ),
    [
      documentPreviewStore,
      schemaType,
      perspective.perspectiveStack,
      perspective.selectedVariantName,
    ],
  )

  return {
    selectedState,
    isCurrentDocumentLiveEdit,
    handleEditReference,
    createOptions,
    getReferenceInfo,
  }
}
