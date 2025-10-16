import {CloseIcon} from '@sanity/icons'
import {Box, Card, type CardProps, Flex, Text} from '@sanity/ui'
import {type ElementType, type HTMLProps, type ReactNode} from 'react'
import {useTranslation} from 'sanity'

import {Button} from '../../../../ui-components'
import {structureLocaleNamespace} from '../../../i18n'
import * as styles from '../../../Structure.css'

export interface DocumentInspectorHeaderProps {
  as?: ElementType
  closeButtonLabel: string
  flex?: CardProps['flex']
  onClose: () => void
  title: ReactNode
}

/** @internal */
export function DocumentInspectorHeader(
  props: DocumentInspectorHeaderProps & Omit<HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref'>,
) {
  const {as: forwardedAs, children, closeButtonLabel, onClose, title, ...restProps} = props
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Card className={styles.documentInspectorHeaderRootStyle} {...restProps} as={forwardedAs}>
      <Flex padding={2}>
        <Box flex={1} padding={3}>
          <Text as="h1" size={1} weight="medium">
            {title}
          </Text>
        </Box>
        <Box flex="none" padding={1}>
          <Button
            aria-label={closeButtonLabel}
            icon={CloseIcon}
            mode="bleed"
            onClick={onClose}
            tooltipProps={{content: t('document-inspector.close-button.tooltip')}}
          />
        </Box>
      </Flex>
      {children}
    </Card>
  )
}
