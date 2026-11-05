import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {
  type ObjectSchemaType,
  type Path,
  type SchemaType,
  type ValidationMarker,
} from '@sanity/types'
import {type CardTone} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import * as PathUtils from '@sanity/util/paths'
import {type ReactNode, useCallback, useId} from 'react'
import {useRouter} from 'sanity/router'
import {Container, Text, VStack} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {usePublishedId} from '../../hooks/usePublishedId'
import {useValidationState} from '../../utils/validationUtils'
import {ValidationList} from './ValidationList'

interface ValidationProps {
  documentId?: string
  markers: ValidationMarker[]
  type?: SchemaType
  menuHeader?: ReactNode
  /**
   * The document could not be loaded, so it was not validated. Shown instead of the marker list.
   */
  errorMessage?: string
}

const POPOVER_PROPS = {
  portal: true,
  constrainSize: true,
  preventOverflow: true,
  tone: 'default' as CardTone,
  width: 0,
  placement: 'bottom-end',
} as const

export function ValidationInfo(props: ValidationProps) {
  const {type, markers, menuHeader, documentId, errorMessage} = props
  const router = useRouter()
  const {hasError, hasWarning} = useValidationState(markers)
  const unavailable = Boolean(errorMessage)
  // use visibility so we can occupy the space equally for all states
  const visibility = hasError || hasWarning || unavailable ? 'visible' : 'hidden'
  const id = useId() || ''
  const publishId = usePublishedId(documentId)

  const onFocus = useCallback(
    (path: Path) => {
      if (!publishId) {
        return
      }
      router.navigateIntent('edit', {
        id: publishId,
        path: encodeURIComponent(PathUtils.toString(path)),
      })
    },
    [router, publishId],
  )

  return (
    <MenuButton
      id={id || ''}
      button={
        <Button
          tooltipProps={{content: 'Show validation issues'}}
          mode="bleed"
          data-testid="schedule-validation-list-button"
          icon={hasError || unavailable ? ErrorOutlineIcon : WarningOutlineIcon}
          style={{visibility}}
          tone={hasError || unavailable ? 'critical' : 'default'}
        />
      }
      menu={
        <Menu padding={1}>
          <Container size={0}>
            <VStack gap={1}>
              {menuHeader ?? null}
              {errorMessage ? (
                <Text size={1} as="div">
                  {errorMessage}
                </Text>
              ) : (
                <ValidationList
                  documentType={type as ObjectSchemaType}
                  validation={markers}
                  onFocus={onFocus}
                />
              )}
            </VStack>
          </Container>
        </Menu>
      }
      popover={POPOVER_PROPS}
    />
  )
}
