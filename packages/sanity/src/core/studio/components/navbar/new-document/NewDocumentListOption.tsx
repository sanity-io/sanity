import {type CurrentUser} from '@sanity/types'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {isValidElement, type MouseEvent, useCallback, useMemo} from 'react'
import {isValidElementType} from 'react-is'
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
  const {icon: Icon} = option

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
        <Card
          as={option.hasPermission ? 'a' : 'button'}
          data-testid={`create-new-${option.templateId}`}
          disabled={!option.hasPermission}
          href={href}
          marginBottom={1}
          onClick={handleDocumentClick}
          padding={preview === 'inline' ? 3 : 4}
          radius={2}
        >
          <Flex align="center" gap={3}>
            {Icon && (
              <Box>
                <Text size={preview === 'inline' ? 1 : undefined}>
                  {isValidElement(Icon) && Icon}
                  {isValidElementType(Icon) && <Icon />}
                </Text>
              </Box>
            )}
            <Text size={preview === 'inline' ? 1 : undefined}>{title}</Text>
          </Flex>
        </Card>
      </div>
    </Tooltip>
  )
}
