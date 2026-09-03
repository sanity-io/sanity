import {DocumentIcon} from '@sanity/icons/Document'
import {Card, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, useMemo} from 'react'
import {Box, Flex} from 'ui5'

import {useUnitFormatter} from '../../../../hooks/useUnitFormatter'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {ChangeList} from '../../../diff/components/ChangeList'
import {DiffCard} from '../../../diff/components/DiffCard'
import {DiffTooltip} from '../../../diff/components/DiffTooltip'
import {FromTo} from '../../../diff/components/FromTo'
import {MetaInfo} from '../../../diff/components/MetaInfo'
import {useRefValue} from '../../../diff/hooks/useRefValue'
import {type DiffComponent, type ObjectDiff} from '../../../types'
import {sizeDiff, sizeDiffNegativeVar, sizeDiffPositiveVar} from './FileFieldDiff.css'
import {getHumanFriendlyBytes, getSizeDiff} from './helpers'
import {type File, type FileAsset} from './types'

// Stays the `as` target of the Card below (rather than a `className`) so the theme is read inside
// the Card's own `ThemeColorProvider`, exactly where the previous styled.div resolved its colors.
function SizeDiff(props: ComponentProps<'div'>) {
  const {className, style, ...rest} = props
  const {color} = useThemeV2()

  return (
    <div
      {...rest}
      className={clsx(sizeDiff, className)}
      style={{
        ...assignInlineVars({
          [sizeDiffPositiveVar]: color.button.default.positive.enabled.bg,
          [sizeDiffNegativeVar]: color.button.default.critical.enabled.bg,
        }),
        ...style,
      }}
    />
  )
}

export const FileFieldDiff: DiffComponent<ObjectDiff<File>> = ({diff, schemaType}) => {
  const {fromValue, toValue, fields} = diff
  const fromAsset = fromValue?.asset
  const toAsset = toValue?.asset
  const {t} = useTranslation()
  const prev = useRefValue<FileAsset>(fromAsset?._ref)
  const next = useRefValue<FileAsset>(toAsset?._ref)
  const formatUnit = useUnitFormatter({unitDisplay: 'short', maximumFractionDigits: 2})
  const ignoredFields = ['_type', 'media']
  const changedFields = Object.entries(fields)
    .filter(([name, field]) => field.isChanged && !ignoredFields.includes(name))
    .map(([name]) => name)

  const didAssetChange = changedFields.includes('asset')

  const nestedFields = schemaType.fields
    .filter((field) => field.name !== 'asset' && changedFields.includes(field.name))
    .map((field) => field.name)

  const pctDiff = getSizeDiff(prev?.size, next?.size)
  const prevSize = prev?.size && getHumanFriendlyBytes(prev.size, formatUnit)
  const nextSize = next?.size && getHumanFriendlyBytes(next.size, formatUnit)

  const cardStyles = useMemo(() => ({display: 'block', flex: 1}), [])

  const from = prev && (
    <DiffCard as="del" diff={diff} path="asset._ref" style={cardStyles}>
      <MetaInfo
        title={prev.originalFilename || t('changes.file.meta-info-fallback-title')}
        icon={DocumentIcon}
      >
        <Text size={0} style={{color: 'inherit'}}>
          {prevSize}
        </Text>
      </MetaInfo>
    </DiffCard>
  )

  const to = next && (
    <DiffCard as="ins" diff={diff} path="asset._ref" style={cardStyles}>
      <MetaInfo
        title={next.originalFilename || t('changes.file.meta-info-fallback-title')}
        icon={DocumentIcon}
      >
        <Flex alignItems="center">
          <Text size={0} style={{color: 'inherit'}}>
            {nextSize}
          </Text>
          {pctDiff !== 0 && (
            <Card radius={2} padding={1} as={SizeDiff} marginLeft={2}>
              <Text size={0} data-number={pctDiff > 0 ? 'positive' : 'negative'}>
                {pctDiff > 0 ? '+' : '-'}
                {pctDiff}%
              </Text>
            </Card>
          )}
        </Flex>
      </MetaInfo>
    </DiffCard>
  )

  const FileAssetChange = (
    <>
      {/* Removed only */}
      {from && !to && (
        <DiffTooltip diff={diff} path="asset._ref" description={t('changes.removed-label')}>
          {from}
        </DiffTooltip>
      )}

      {/* Removed and added */}
      {from && to && (
        <DiffTooltip diff={diff} path="asset._ref">
          <FromTo from={from} layout="grid" to={to} />
        </DiffTooltip>
      )}

      {/* Added only */}
      {!from && to && (
        <DiffTooltip diff={diff} path="asset._ref" description={t('changes.added-label')}>
          {to}
        </DiffTooltip>
      )}
    </>
  )

  return (
    <>
      {didAssetChange && FileAssetChange}
      {nestedFields.length > 0 && (
        <Box marginTop={didAssetChange ? 4 : 3}>
          <ChangeList diff={diff} schemaType={schemaType} fields={nestedFields} />
        </Box>
      )}
    </>
  )
}
