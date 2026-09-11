import {CloseIcon} from '@sanity/icons/Close'
import {Card, type CardProps, Text} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ElementType, type HTMLProps, type ReactNode} from 'react'
import {useTranslation} from 'sanity'
import {Flex, Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {structureLocaleNamespace} from '../../../i18n'
import {root} from './DocumentInspectorHeader.css'

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
  const {
    as: forwardedAs,
    children,
    className,
    closeButtonLabel,
    onClose,
    title,
    ...restProps
  } = props
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Card {...restProps} as={forwardedAs} className={clsx(root, className)}>
      <Flex padding={2}>
        <Box flexBasis="0%" flexGrow={1} padding={3}>
          <Text as="h1" size={1} weight="medium">
            {title}
          </Text>
        </Box>
        <Box flexBasis="auto" flexGrow={0} flexShrink={0} padding={1}>
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
