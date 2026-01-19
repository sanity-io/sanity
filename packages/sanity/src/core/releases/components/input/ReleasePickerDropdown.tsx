import {Box, Card, Flex, Text} from '@sanity/ui'
import {PortableTextEditor} from '@portabletext/editor'
import {type Path} from '@sanity/types'
import {randomKey} from '@sanity/util/content'
import {useCallback, useMemo, useRef, useEffect} from 'react'
import {styled} from 'styled-components'

import {CommandList, type CommandListHandle} from '../../../components/commandList/CommandList'
import {useAllReleases} from '../../store/useAllReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {ReleasePickerItem} from './ReleasePickerItem'

const ARCHIVED_RELEASE_STATES = ['archived', 'published']
const ITEM_HEIGHT = 33
const MAX_ITEMS = 7

const DropdownContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  margin-top: 4px;
`

const DropdownCard = styled(Card)`
  max-height: ${ITEM_HEIGHT * MAX_ITEMS + 8}px;
  min-width: 220px;
  max-width: 320px;
  padding: 4px 0;
  width: max-content;
`

interface ReleasePickerDropdownProps {
  editor: PortableTextEditor
  insertPosition: {path: Path; offset: number}
  onClose: () => void
}

export function ReleasePickerDropdown(props: ReleasePickerDropdownProps) {
  const {editor, insertPosition, onClose} = props
  const {data: releases, loading, error} = useAllReleases()
  const commandListRef = useRef<CommandListHandle>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter to active releases only (exclude archived/published)
  const activeReleases = useMemo(
    () => releases.filter((r) => !ARCHIVED_RELEASE_STATES.includes(r.state)),
    [releases],
  )

  const handleSelect = useCallback(
    (releaseId: string) => {
      // Set cursor position
      PortableTextEditor.select(editor, {anchor: insertPosition, focus: insertPosition})

      // Find schema type for releaseReference
      const schemaType = editor.schemaTypes.inlineObjects.find(
        (type) => type.name === 'releaseReference',
      )

      if (!schemaType) {
        // eslint-disable-next-line no-console
        console.error('Schema type "releaseReference" not found in editor.schemaTypes.inlineObjects')
        onClose()
        return
      }

      // Insert release reference as inline object
      PortableTextEditor.insertChild(editor, schemaType, {
        _type: 'releaseReference',
        _key: randomKey(12),
        releaseId,
      })

      // Insert space after for easier typing
      PortableTextEditor.insertChild(editor, editor.schemaTypes.span, {
        _type: 'span',
        text: ' ',
      })

      // Focus editor
      PortableTextEditor.focus(editor)

      // Close dropdown
      onClose()
    },
    [editor, insertPosition, onClose],
  )

  const renderItem = useCallback(
    (release) => {
      const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
      return (
        <ReleasePickerItem
          release={release}
          releaseId={releaseId}
          onSelect={() => handleSelect(releaseId)}
        />
      )
    },
    [handleSelect],
  )

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (loading) {
    return (
      <DropdownContainer ref={dropdownRef}>
        <DropdownCard padding={3} shadow={2} radius={2}>
          <Text size={1} muted>
            Loading releases...
          </Text>
        </DropdownCard>
      </DropdownContainer>
    )
  }

  if (error) {
    return (
      <DropdownContainer ref={dropdownRef}>
        <DropdownCard padding={3} shadow={2} radius={2}>
          <Text size={1} tone="critical">
            Failed to load releases
          </Text>
        </DropdownCard>
      </DropdownContainer>
    )
  }

  if (activeReleases.length === 0) {
    return (
      <DropdownContainer ref={dropdownRef}>
        <DropdownCard padding={3} shadow={2} radius={2}>
          <Text size={1} muted>
            No active releases available
          </Text>
        </DropdownCard>
      </DropdownContainer>
    )
  }

  return (
    <DropdownContainer ref={dropdownRef}>
      <DropdownCard shadow={2} radius={2}>
        <CommandList
          activeItemDataAttr="data-hovered"
          ariaLabel="Select a release to link"
          fixedHeight
          itemHeight={ITEM_HEIGHT}
          items={activeReleases}
          getItemKey={(index) => activeReleases[index]._id}
          padding={0}
          ref={commandListRef}
          renderItem={renderItem}
          canReceiveFocus
          autoFocus="list"
        />
      </DropdownCard>
    </DropdownContainer>
  )
}
