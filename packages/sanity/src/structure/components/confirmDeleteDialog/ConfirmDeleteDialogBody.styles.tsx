import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Flex, Inline, rem, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'
import {useTranslation} from 'sanity'
import {Box} from 'ui5'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {structureLocaleNamespace} from '../../i18n'
import {
  chevronWrapper,
  crossDatasetReferencesDetails,
  crossDatasetReferencesSummary,
  documentIdFlex,
  space1Var,
  space2Var,
  table,
} from './ConfirmDeleteDialogBody.styles.css'

export function ChevronWrapper(props: ComponentProps<typeof Box>) {
  const {className, ...rest} = props
  return <Box {...rest} className={clsx(chevronWrapper, className)} />
}

export function CrossDatasetReferencesDetails(props: ComponentProps<'details'>) {
  const {className, ...rest} = props
  return <details {...rest} className={clsx(crossDatasetReferencesDetails, className)} />
}

export function CrossDatasetReferencesSummary(props: ComponentProps<'summary'>) {
  const {className, ...rest} = props
  return <summary {...rest} className={clsx(crossDatasetReferencesSummary, className)} />
}

export function Table(props: ComponentProps<'table'>) {
  const {className, style, ...rest} = props
  const {space} = useThemeV2()

  return (
    <table
      {...rest}
      className={clsx(table, className)}
      style={{
        ...assignInlineVars({
          [space1Var]: String(rem(space[1])),
          [space2Var]: String(rem(space[2])),
        }),
        ...style,
      }}
    />
  )
}

export function DocumentIdFlex(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props
  return <Flex {...rest} className={clsx(documentIdFlex, className)} />
}

export const OtherReferenceCount = (props: {totalCount: number; references: unknown[]}) => {
  const {t} = useTranslation(structureLocaleNamespace)
  const difference = props.totalCount - props.references.length

  if (!difference) return null

  return (
    <Box padding={2}>
      <Inline gap={2}>
        <Text size={1} muted>
          {t('confirm-delete-dialog.other-reference-count.title', {count: difference})}
        </Text>

        <Tooltip
          portal
          placement="top"
          content={t('confirm-delete-dialog.other-reference-count.tooltip')}
        >
          <Text size={1} muted>
            <InfoOutlineIcon />
          </Text>
        </Tooltip>
      </Inline>
    </Box>
  )
}
