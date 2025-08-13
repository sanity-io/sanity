import {AddIcon} from '@sanity/icons'
import {uuid} from '@sanity/uuid'
import {useCallback, useMemo} from 'react'
import {
  getPublishedId,
  type ObjectSchemaType,
  useSchema,
  useSource,
  useTemplatePermissions,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../../ui-components'
import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {getReferenceToPath} from './getReferenceToPath'

export function CreateNewIncomingReference({
  type,
  referenceToType,
  referenceToId,
}: {
  type: string
  referenceToType: string
  referenceToId: string
}) {
  const schema = useSchema()
  const {resolveNewDocumentOptions} = useSource().document
  const schemaType = schema.get(type) as ObjectSchemaType | undefined

  const templateItems = useMemo(
    () => resolveNewDocumentOptions({type: 'structure', schemaType: type}),
    [type, resolveNewDocumentOptions],
  )

  const [templatePermissions, isTemplatePermissionsLoading] = useTemplatePermissions({
    templateItems,
  })

  const templatesWithPermissions = useMemo(() => {
    return templateItems.filter((templateItem) => {
      const hasPermission = templatePermissions?.find((permission) => {
        return permission.id === templateItem.id && permission.granted
      })
      return hasPermission
    })
  }, [templatePermissions, templateItems])

  const {navigate} = useRouter()
  const {routerPanesState, groupIndex} = usePaneRouter()

  const handleClick = useCallback(() => {
    const referenceToPath = getReferenceToPath({schemaType: schemaType!, referenceToType})
    if (!referenceToPath) {
      // TODO: Add an error message, this should not happen.
      return
    }
    const id = uuid()
    navigate({
      panes: [
        ...routerPanesState.slice(0, groupIndex + 1),
        [
          {
            id: getPublishedId(id),
            params: {type, template: templateItems[0].templateId},
            payload: {
              additionalValues: {
                [referenceToPath.path]: {_type: referenceToPath.typeName, _ref: referenceToId},
              },
            },
          },
        ],
      ],
    })
  }, [
    type,
    navigate,
    routerPanesState,
    groupIndex,
    templateItems,
    referenceToId,
    referenceToType,
    schemaType,
  ])

  if (!schemaType) {
    return null
  }
  if (templatesWithPermissions.length === 0) {
    return null
  }

  // TODO: Handle multiple templates, now it's creating only for the first one available.
  // see PaneHeaderCreateButton for a similar implementation.
  return (
    <Button
      disabled={isTemplatePermissionsLoading}
      icon={AddIcon}
      mode="bleed"
      tooltipProps={{content: `Create new ${type}`}}
      onClick={handleClick}
    />
  )
}
