import {InfoOutlineIcon} from '@sanity/icons'
import {Box, Flex, Inline, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ComponentProps, forwardRef} from 'react'
import {useTranslation} from 'sanity'

import {Tooltip} from '../../../ui-components'
import {structureLocaleNamespace} from '../../i18n'
import * as css from './ConfirmDeleteDialogBody.css'

export const ChevronWrapper = forwardRef<HTMLDivElement, ComponentProps<typeof Box>>(
  function ChevronWrapper(props, ref) {
    return <Box {...props} className={css.chevronWrapper} ref={ref} />
  },
)

export const CrossDatasetReferencesDetails = forwardRef<
  HTMLDetailsElement,
  React.DetailedHTMLProps<React.DetailsHTMLAttributes<HTMLDetailsElement>, HTMLDetailsElement>
>(function CrossDatasetReferencesDetails(props, ref) {
  return <details {...props} className={css.crossDatasetReferencesDetails} ref={ref} />
})

export const CrossDatasetReferencesSummary = forwardRef<
  HTMLElement,
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
>(function CrossDatasetReferencesSummary(props, ref) {
  return <summary {...props} className={css.crossDatasetReferencesSummary} ref={ref as any} />
})

export const Table = forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  function Table(props, ref) {
    const {space} = useThemeV2()
    return (
      <table
        {...props}
        className={css.table}
        style={assignInlineVars({
          [css.paddingVar]: `${space[2]}px`,
          [css.thPaddingVar]: `${space[1]}px`,
          [css.tdPaddingVar]: `0 ${space[1]}px`,
        })}
        ref={ref}
      />
    )
  },
)

export const DocumentIdFlex = forwardRef<HTMLDivElement, ComponentProps<typeof Flex>>(
  function DocumentIdFlex(props, ref) {
    return <Flex {...props} className={css.documentIdFlex} ref={ref} />
  },
)

export const OtherReferenceCount = (props: {totalCount: number; references: unknown[]}) => {
  const {t} = useTranslation(structureLocaleNamespace)
  const difference = props.totalCount - props.references.length

  if (!difference) return null

  return (
    <Box padding={2}>
      <Inline space={2}>
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
