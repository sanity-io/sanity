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

export function CreateNewIncomingReference({
  type,
  referenceToId,
  referenceToType,
}: {
  type: string
  referenceToId: string
  referenceToType: string
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
    const id = uuid()
    navigate({
      panes: [
        ...routerPanesState.slice(0, groupIndex + 1),
        [
          {
            id: getPublishedId(id),
            params: {type, template: templateItems[0].templateId},
            payload: {
              referencedBy: referenceToId,
              reference: {
                _type: 'reference',
                _ref: referenceToId,
                _weak: true,
                _strengthenOnPublish: {type: referenceToType},
              },
            },
          },
        ],
      ],
    })
  }, [type, navigate, routerPanesState, groupIndex, templateItems, referenceToId, referenceToType])

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
