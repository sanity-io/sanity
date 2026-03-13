import {type CurrentUser} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {type MouseEvent, useCallback, useMemo} from 'react'
import {useIntentLink} from 'sanity/router'

import {Tooltip} from '../../../../../ui-components'
import {InsufficientPermissionsMessage} from '../../../../components'
import {useI18nText} from '../../../../i18n'
import {usePerspective} from '../../../../perspective/usePerspective'
import {type NewDocumentOption, type PreviewLayout} from './types'

// This value is used to calculate the max-height of the popover and for the virtual list item size.
// This value is not used anywhere in this file, but it is exported
// from here to make it easier to maintain the value in the future
// if the design changes.
export const INLINE_PREVIEW_HEIGHT = 33

interface NewDocumentListOptionProps {
  currentUser: CurrentUser | null
  onClick: (option: NewDocumentOption) => void
  option: NewDocumentOption
  preview: PreviewLayout
}

export function NewDocumentListOption(props: NewDocumentListOptionProps) {
  const {option, currentUser, onClick, preview} = props
  const {selectedReleaseId} = usePerspective()
  const params = useMemo(
    () => ({template: option.templateId, type: option.schemaType, version: selectedReleaseId}),
    [option.schemaType, option.templateId, selectedReleaseId],
  )
  const {onClick: onIntentClick, href} = useIntentLink({
    intent: 'create',
    params,
  })

  const handleDocumentClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      onIntentClick(event)
      onClick(option)
    },
    [onIntentClick, onClick, option],
  )

  const {title} = useI18nText(option)
  const sharedCardProps = useMemo(() => {
    const padding = preview === 'inline' ? (3 as const) : (4 as const)
    const marginBottom = 1 as const
    const radius = 2 as const
    return {
      'data-testid': `create-new-${option.templateId}`,
      marginBottom,
      'onClick': handleDocumentClick,
      padding,
      radius,
    }
  }, [option.templateId, handleDocumentClick, preview])

  return (
    <Tooltip
      key={option.id}
      disabled={option.hasPermission}
      portal
      content={
        <InsufficientPermissionsMessage currentUser={currentUser} context="create-document" />
      }
    >
      <div>
        {option.hasPermission ? (
          <Card as="a" href={href} {...sharedCardProps}>
            <Text size={preview === 'inline' ? 1 : undefined}>{title}</Text>
          </Card>
        ) : (
          <Card as="button" disabled {...sharedCardProps}>
            <Text size={preview === 'inline' ? 1 : undefined}>{title}</Text>
          </Card>
        )}
      </div>
    </Tooltip>
  )
}
