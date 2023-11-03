import {DocumentIcon} from '@sanity/icons'
import React, {useMemo} from 'react'
import {Box, Card, Flex, Text} from '@sanity/ui'
import styled from 'styled-components'
import {DiffCard, DiffTooltip, FromTo, MetaInfo, ChangeList} from '../../../diff'
import {useTranslation} from '../../../../i18n'
import type {DiffComponent, ObjectDiff} from '../../../types'
import {useUnitFormatter} from '../../../../hooks'
import {useRefValue} from '../../../diff/hooks'
import {getHumanFriendlyBytes, getSizeDiff} from './helpers'
import type {File, FileAsset} from './types'

const SizeDiff = styled.div`
  ${({theme}) => `
    --size-diff-positive: ${theme.sanity.color.solid.positive.enabled.bg};
    --size-diff-negative: ${theme.sanity.color.solid.critical.enabled.bg};
  `}
  &:not([hidden]) {
    display: inline-block;
  }

  [data-number='positive'] {
    color: var(--size-diff-positive);
  }

  [data-number='negative'] {
    color: var(--size-diff-negative);
  }
`

export const FileFieldDiff: DiffComponent<ObjectDiff<File>> = ({diff, schemaType}) => {
  const {fromValue, toValue, fields} = diff
  const fromAsset = fromValue?.asset
  const toAsset = toValue?.asset
  const {t} = useTranslation()
  const prev = useRefValue<FileAsset>(fromAsset?._ref)
  const next = useRefValue<FileAsset>(toAsset?._ref)
  const formatUnit = useUnitFormatter({unitDisplay: 'short', maximumFractionDigits: 2})

  const changedFields = Object.entries(fields)
    .filter(([name, field]) => field.isChanged && name !== '_type')
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
        <Flex align="center">
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
