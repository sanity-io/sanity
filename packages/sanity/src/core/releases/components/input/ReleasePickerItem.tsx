import {type ReleaseDocument} from '@sanity/client'
import {Box, Flex, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {ReleaseAvatar} from '../ReleaseAvatar'
import {getReleaseTone} from '../../util/getReleaseTone'

const ItemButton = styled.button`
  all: unset;
  box-sizing: border-box;
  width: 100%;
  cursor: pointer;
  padding: 6px 10px;

  &[data-hovered='true'] {
    background-color: var(--card-hovered-bg-color);
  }
`

interface ReleasePickerItemProps {
  release: ReleaseDocument
  releaseId: string
  onSelect: () => void
}

export function ReleasePickerItem(props: ReleasePickerItemProps) {
  const {release, releaseId, onSelect} = props
  const tone = getReleaseTone(release)

  return (
    <ItemButton onClick={onSelect}>
      <Flex align="center" gap={2}>
        <ReleaseAvatar tone={tone} size={0} />
        <Text size={1}>
          {release.metadata.title || 'Untitled Release'}
        </Text>
      </Flex>
    </ItemButton>
  )
}
