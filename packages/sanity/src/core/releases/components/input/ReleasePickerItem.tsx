import {type ReleaseDocument} from '@sanity/client'
import {Flex, Text} from '@sanity/ui'
import {type JSX} from 'react'
import {styled} from 'styled-components'

import {getReleaseTone} from '../../util/getReleaseTone'
import {ReleaseAvatar} from '../ReleaseAvatar'

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
  onSelect: () => void
}

export function ReleasePickerItem(props: ReleasePickerItemProps): JSX.Element {
  const {release, onSelect} = props
  const tone = getReleaseTone(release)

  return (
    <ItemButton onClick={onSelect}>
      <Flex align="center" gap={2}>
        <ReleaseAvatar tone={tone} fontSize={0} padding={1} />
        <Text size={1}>{release.metadata.title || 'Untitled Release'}</Text>
      </Flex>
    </ItemButton>
  )
}
