import {
  HotkeyOptions,
  usePortableTextEditor,
  usePortableTextEditorSelection,
  Type,
  PortableTextEditor,
} from '@sanity/portable-text-editor'
import React, {memo, useCallback, useMemo, useState} from 'react'
import {Path, SchemaType} from '@sanity/types'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {resolveInitialValueForType} from '@sanity/initial-value-templates'
import {Box, Button, Flex, Hotkeys, Text, Tooltip, useElementRect, useToast} from '@sanity/ui'
import {CollapseIcon, ExpandIcon} from '@sanity/icons'
import styled, {css} from 'styled-components'
import {ActionMenu} from './ActionMenu'
import {BlockStyleSelect} from './BlockStyleSelect'
import {InsertMenu} from './InsertMenu'
import {getBlockStyles, getInsertMenuItems} from './helpers'
import {useActionGroups, useFeatures} from './hooks'
import {BlockItem, BlockStyleItem, PTEToolbarActionGroup} from './types'

interface ToolbarProps {
  hotkeys: HotkeyOptions
  isFullscreen: boolean
  readOnly: boolean
  onFocus: (path: Path) => void
  onToggleFullscreen: () => void
}

const RootFlex = styled(Flex)`
  width: 100%;
`

const StyleSelectBox = styled(Box)`
  min-width: 8em;
`

const StyleSelectFlex = styled(Flex)`
  border-right: 1px solid var(--card-border-color);
`

const ActionMenuBox = styled(Box)<{$withMaxWidth: boolean}>`
  ${({$withMaxWidth}) =>
    $withMaxWidth &&
    css`
      max-width: max-content;
    `}
`

const InsertMenuBox = styled(Box)`
  border-left: 1px solid var(--card-border-color);
`

const FullscreenButtonBox = styled(Box)`
  border-left: 1px solid var(--card-border-color);
`

const SLOW_INITIAL_VALUE_LIMIT = 300

const preventDefault = (e: React.SyntheticEvent) => e.preventDefault()

const IS_MAC =
  typeof window != 'undefined' && /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)

const InnerToolbar = memo(function InnerToolbar({
  actionGroups,
  blockStyles,
  disabled,
  insertMenuItems,
  isFullscreen,
  onToggleFullscreen,
  readOnly,
}: {
  actionGroups: PTEToolbarActionGroup[]
  blockStyles: BlockStyleItem[]
  disabled: boolean
  insertMenuItems: BlockItem[]
  isFullscreen: boolean
  onToggleFullscreen: () => void
  readOnly: boolean
}) {
  const actionsLen = actionGroups.reduce((acc, x) => acc + x.actions.length, 0)
  const showActionMenu = actionsLen > 0
  const showInsertMenu = insertMenuItems.length > 0
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const rootElementRect = useElementRect(rootElement)

  const collapsed = rootElementRect ? rootElementRect?.width < 400 : false

  return (
    <RootFlex
      align="center"
      // Ensure the editor doesn't lose focus when interacting
      // with the toolbar (prevent focus click events)
      onMouseDown={preventDefault}
      onKeyPress={preventDefault}
      ref={setRootElement}
    >
      <StyleSelectFlex flex={collapsed ? 1 : undefined}>
        <StyleSelectBox padding={isFullscreen ? 2 : 1}>
          <BlockStyleSelect disabled={disabled} readOnly={readOnly} items={blockStyles} />
        </StyleSelectBox>
      </StyleSelectFlex>

      {showActionMenu && (
        <ActionMenuBox
          flex={collapsed ? undefined : 1}
          padding={isFullscreen ? 2 : 1}
          $withMaxWidth={showInsertMenu}
        >
          <ActionMenu
            disabled={disabled}
            collapsed={collapsed}
            groups={actionGroups}
            readOnly={readOnly}
            isFullscreen={isFullscreen}
          />
        </ActionMenuBox>
      )}

      {showInsertMenu && (
        <InsertMenuBox flex={collapsed ? undefined : 1} padding={isFullscreen ? 2 : 1}>
          <InsertMenu
            disabled={disabled}
            collapsed={collapsed}
            items={insertMenuItems}
            readOnly={readOnly}
            isFullscreen={isFullscreen}
          />
        </InsertMenuBox>
      )}

      <FullscreenButtonBox padding={isFullscreen ? 2 : 1}>
        <Tooltip
          content={
            <Flex align="center" padding={1}>
              <Box flex={1} paddingX={1}>
                <Text size={1}>{`${isFullscreen ? 'Collapse' : 'Expand'} editor`}</Text>
              </Box>
              <Box marginLeft={1}>
                <Hotkeys keys={[`${IS_MAC ? 'Cmd' : 'Ctrl'}`, 'Enter']} />
              </Box>
            </Flex>
          }
          placement={isFullscreen ? 'bottom' : 'top'}
          portal="default"
        >
          <Button
            padding={2}
            icon={isFullscreen ? CollapseIcon : ExpandIcon}
            mode="bleed"
            onClick={onToggleFullscreen}
          />
        </Tooltip>
      </FullscreenButtonBox>
    </RootFlex>
  )
})

export function Toolbar(props: ToolbarProps) {
  const {hotkeys, isFullscreen, readOnly, onFocus, onToggleFullscreen} = props
  const features = useFeatures()
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const disabled = !selection

  const {push} = useToast()

  const resolveInitialValue = useCallback(
    (type: Type) => {
      let isSlow = false
      const slowTimer = setTimeout(() => {
        isSlow = true
        push({
          id: 'resolving-initial-value',
          status: 'info',
          title: 'Resolving initial value…',
        })
      }, SLOW_INITIAL_VALUE_LIMIT)
      return resolveInitialValueForType((type as unknown) as SchemaType)
        .then((value) => {
          if (isSlow) {
            // I found no way to close an existing toast, so this will replace the message in the
            // "Resolving initial value…"-toast and then make sure it gets closed.
            push({
              id: 'resolving-initial-value',
              status: 'info',
              duration: 500,
              title: 'Initial value resolved',
            })
          }
          return value
        })
        .catch((error) => {
          push({
            title: `Could not resolve initial value`,
            id: 'resolving-initial-value',
            description: `Unable to resolve initial value for type: ${type.name}: ${error.message}.`,
            status: 'error',
          })
          return undefined
        })
        .finally(() => clearTimeout(slowTimer))
    },
    [push]
  )

  const handleInsertBlock = useCallback(
    async (type: Type) => {
      const initialValue = await resolveInitialValue(type)
      const path = PortableTextEditor.insertBlock(editor, type, initialValue)

      setTimeout(() => onFocus(path.concat(FOCUS_TERMINATOR)), 0)
    },
    [editor, onFocus, resolveInitialValue]
  )

  const handleInsertInline = useCallback(
    async (type: Type) => {
      const initialValue = await resolveInitialValue(type)
      const path = PortableTextEditor.insertChild(editor, type, initialValue)

      setTimeout(() => onFocus(path.concat(FOCUS_TERMINATOR)), 0)
    },
    [editor, onFocus, resolveInitialValue]
  )

  const actionGroups = useActionGroups({hotkeys, onFocus, resolveInitialValue})

  const blockStyles = useMemo(() => getBlockStyles(features), [features])

  const insertMenuItems = useMemo(
    () => getInsertMenuItems(features, disabled, handleInsertBlock, handleInsertInline),
    [disabled, features, handleInsertBlock, handleInsertInline]
  )

  return (
    <InnerToolbar
      actionGroups={actionGroups}
      blockStyles={blockStyles}
      disabled={disabled}
      insertMenuItems={insertMenuItems}
      isFullscreen={isFullscreen}
      onToggleFullscreen={onToggleFullscreen}
      readOnly={readOnly}
    />
  )
}
