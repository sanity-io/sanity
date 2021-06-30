import FileIcon from 'part:@sanity/base/file-icon'
import React, {useMemo} from 'react'
import {Box, Card, Flex, Text} from '@sanity/ui'
import styled from 'styled-components'
import {
  DiffComponent,
  DiffCard,
  DiffTooltip,
  FromTo,
  MetaInfo,
  ChangeList,
  ObjectDiff,
} from '../../../diff'
import {useRefValue} from '../../../diff/hooks'
import {getSizeDiff} from './helpers'
import {File, FileAsset} from './types'

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
  const prev = useRefValue<FileAsset>(fromAsset?._ref)
  const next = useRefValue<FileAsset>(toAsset?._ref)

  const changedFields = Object.keys(fields).filter(
    (name) => fields[name].isChanged && name !== '_type'
  )

  const didAssetChange = changedFields.includes('asset')

  const nestedFields = schemaType.fields
    .filter((field) => field.name !== 'asset' && changedFields.includes(field.name))
    .map((field) => field.name)

  // Sizes in MB TODO: improve. Apple uses 1000^2
  const prevSize = prev?.size && prev.size / 1000 / 1000
  const nextSize = next?.size && next.size / 1000 / 1000
  const pctDiff = getSizeDiff(prevSize, nextSize)

  const roundedPrevSize = prevSize ? prevSize.toFixed(2) : undefined
  const roundedNextSize = nextSize ? nextSize.toFixed(2) : undefined

  const cardStyles = useMemo(() => ({display: 'block', flex: 1}), [])

  const from = prev && (
    <DiffCard as="del" diff={diff} path="asset._ref" style={cardStyles}>
      <MetaInfo title={prev.originalFilename || 'Untitled'} icon={FileIcon}>
        <Text size={0} style={{color: 'inherit'}}>{`${roundedPrevSize}MB`}</Text>
      </MetaInfo>
    </DiffCard>
  )

  const to = next && (
    <DiffCard as="ins" diff={diff} path="asset._ref" style={cardStyles}>
      <MetaInfo title={next.originalFilename || 'Untitled'} icon={FileIcon}>
        <Flex align="center">
          <Text size={0} style={{color: 'inherit'}}>{`${roundedNextSize}MB`}</Text>
          {pctDiff !== 0 && (
            <Card radius={2} padding={1} as={SizeDiff} marginLeft={2}>
              <Text size={0} data-number={pctDiff > 0 ? 'positive' : 'negative'}>
                {pctDiff > 0 && '+'}
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
        <DiffTooltip diff={diff} path="asset._ref" description="Removed">
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
        <DiffTooltip diff={diff} path="asset._ref" description="Added">
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
