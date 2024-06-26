import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@portabletext/editor'
import {isKeySegment} from '@sanity/types'
import {memo, useCallback, useMemo} from 'react'

import {type PopoverProps} from '../../../../../ui-components'
import {CollapseMenu, CollapseMenuButton} from '../../../../components/collapseMenu'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {useTranslation} from '../../../../i18n'
import {getActionIcon} from './helpers'
import {useActiveActionKeys, useFocusBlock} from './hooks'
import {type PTEToolbarAction, type PTEToolbarActionGroup} from './types'

const CollapseMenuMemo = memo(CollapseMenu)

const MENU_POPOVER_PROPS: PopoverProps = {constrainSize: true, portal: true}

interface ActionMenuProps {
  disabled: boolean
  groups: PTEToolbarActionGroup[]
  isFullscreen?: boolean
  collapsed?: boolean
}

export const ActionMenu = memo(function ActionMenu(props: ActionMenuProps) {
  const {disabled: disabledProp, groups, isFullscreen, collapsed} = props
  const focusBlock = useFocusBlock()

  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const {t} = useTranslation()
  const isSelectingMultipleBlocks =
    // Path at 0 is the block level, by comparing those we can detect if the user is selecting multiple blocks
    selection && isKeySegment(selection.anchor.path[0]) && isKeySegment(selection.focus.path[0])
      ? // In case of keyed segments
        selection.anchor.path[0]._key !== selection?.focus.path[0]._key
      : // In case of non-keyed segments
        selection?.anchor.path[0] !== selection?.focus.path[0]

  const isVoidBlock = focusBlock?._type !== editor.schemaTypes.block.name
  const isEmptyTextBlock =
    !isVoidBlock &&
    Array.isArray(focusBlock.children) &&
    focusBlock.children.length === 1 &&
    focusBlock?.children[0].text === ''

  const disabled = disabledProp || isVoidBlock

  const actions: Array<PTEToolbarAction & {firstInGroup?: true}> = useMemo(
    () =>
      groups.reduce<Array<PTEToolbarAction & {firstInGroup?: true}>>((acc, group) => {
        return acc.concat(
          group.actions.map(
            // eslint-disable-next-line max-nested-callbacks
            (action: PTEToolbarAction, actionIndex) => {
              if (actionIndex === 0) return {...action, firstInGroup: true}
              return action
            },
          ),
        )
      }, []),
    [groups],
  )

  const activeKeys = useActiveActionKeys({actions})

  const handleMenuClose = useCallback(() => {
    PortableTextEditor.focus(editor)
  }, [editor])

  const tooltipPlacement = isFullscreen ? 'bottom' : 'top'

  const children = useMemo(
    () =>
      actions.map((action) => {
        const annotationDisabled =
          action.type === 'annotation' && (isEmptyTextBlock || isSelectingMultipleBlocks)
        const annotationDisabledText = isEmptyTextBlock
          ? t('user-menu.action.portable-text.annotation-disabled_empty-block', {
              name: action.title || action.key,
            })
          : t('user-menu.action.portable-text.annotation-disabled_multiple-blocks', {
              name: action.title || action.key,
            })

        const active = activeKeys.includes(action.key)
        return (
          <CollapseMenuButton
            aria-label={t('toolbar.portable-text.action-button-aria-label', {
              action: action.title || action.key,
            })}
            data-testid={`action-button-${action.key}`}
            disabled={disabled || annotationDisabled}
            mode="bleed"
            dividerBefore={action.firstInGroup}
            icon={getActionIcon(action, active)}
            key={action.key}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => action.handle(active)}
            selected={active}
            text={action.title || action.key}
            tooltipText={annotationDisabled ? annotationDisabledText : action.title || action.key}
            tooltipProps={{
              disabled: disabled,
              placement: tooltipPlacement,
              portal: 'default',
            }}
          />
        )
      }),
    [
      actions,
      activeKeys,
      disabled,
      isEmptyTextBlock,
      isSelectingMultipleBlocks,
      t,
      tooltipPlacement,
    ],
  )

  const menuButtonProps = useMemo(
    () => ({
      button: (
        <ContextMenuButton
          data-testid="action-menu-button"
          disabled={disabled}
          tooltipProps={{placement: tooltipPlacement}}
        />
      ),
      popover: MENU_POPOVER_PROPS,
    }),
    [disabled, tooltipPlacement],
  )

  return (
    <CollapseMenuMemo
      data-testid="action-menu-auto-collapse-menu"
      collapsed={collapsed}
      disableRestoreFocusOnClose
      gap={1}
      menuButtonProps={menuButtonProps}
      onMenuClose={handleMenuClose}
    >
      {children}
    </CollapseMenuMemo>
  )
})
