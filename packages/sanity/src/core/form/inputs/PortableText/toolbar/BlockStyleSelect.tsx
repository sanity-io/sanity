import {PortableTextEditor, usePortableTextEditor} from '@portabletext/editor'
import {ChevronDownIcon} from '@sanity/icons'
import {
  Menu,
  // eslint-disable-next-line no-restricted-imports
  MenuItem,
  Text,
} from '@sanity/ui'
import {memo, type MouseEvent, type ReactNode, useCallback, useMemo} from 'react'
import {styled} from 'styled-components'

import {Button, MenuButton, type MenuButtonProps} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {
  BlockQuote,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Normal,
} from '../text/textStyles'
import {useActiveStyleKeys, useFocusBlock} from './hooks'
import {type BlockStyleItem} from './types'

const MenuButtonMemo = memo(MenuButton)

interface BlockStyleSelectProps {
  disabled: boolean
  items: BlockStyleItem[]
  boundaryElement: HTMLDivElement | null
}

const StyledMenuItem = styled(MenuItem)`
  // Change the border color variable used by BlockQuote
  // to make the border visible when the MenuItem is selected
  &[data-selected] {
    [data-option='blockquote'] {
      --card-border-color: var(--card-muted-fg-color);
    }
  }
`

const MENU_POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  placement: 'bottom-start',
  portal: 'default',
}

const TEXT_STYLE_OPTIONS: Record<string, (title: ReactNode) => ReactNode> = {
  h1: (title) => <Heading1>{title}</Heading1>,
  h2: (title) => <Heading2>{title}</Heading2>,
  h3: (title) => <Heading3>{title}</Heading3>,
  h4: (title) => <Heading4>{title}</Heading4>,
  h5: (title) => <Heading5>{title}</Heading5>,
  h6: (title) => <Heading6>{title}</Heading6>,
  normal: (title) => <Normal>{title}</Normal>,
  blockquote: (title) => <BlockQuote data-option="blockquote">{title}</BlockQuote>,
}

const preventDefault = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault()

const emptyStyle: BlockStyleItem = {
  key: 'style-none',
  style: '',
  title: 'No style',
  i18nTitleKey: 'inputs.portable-text.style.none',
}

export const BlockStyleSelect = memo(function BlockStyleSelect(
  props: BlockStyleSelectProps,
): React.JSX.Element {
  const {disabled, items: itemsProp, boundaryElement} = props
  const editor = usePortableTextEditor()
  const focusBlock = useFocusBlock()
  const {t} = useTranslation()

  const popoverProperties: MenuButtonProps['popover'] = {
    constrainSize: true,
    placement: 'bottom-start',
    portal: 'default',
    referenceBoundary: boundaryElement,
  }

  const _disabled =
    disabled || (focusBlock ? editor.schemaTypes.block.name !== focusBlock._type : false)

  // @todo: Explain what this does
  const activeKeys = useActiveStyleKeys({items: itemsProp})

  const {activeItems, items} = useMemo(() => {
    const _activeItems = itemsProp.filter((item) => activeKeys.includes(item.style))

    let _items = itemsProp

    if (_activeItems.length === 0 && _items.length > 1) {
      _items = _items.concat([emptyStyle])
      _activeItems.push(emptyStyle)
    }

    return {activeItems: _activeItems, items: _items}
  }, [activeKeys, itemsProp])

  const menuButtonText = useMemo(() => {
    if (activeItems.length > 1) {
      return t('inputs.portable-text.style.multiple')
    }

    if (activeItems.length !== 1) {
      return emptyStyle.i18nTitleKey ? t(emptyStyle.i18nTitleKey) : emptyStyle.title
    }

    return activeItems[0].i18nTitleKey ? t(activeItems[0].i18nTitleKey) : activeItems[0].title
  }, [activeItems, t])

  const handleChange = useCallback(
    (item: BlockStyleItem): void => {
      if (focusBlock && item.style !== focusBlock.style) {
        PortableTextEditor.toggleBlockStyle(editor, item.style)
        PortableTextEditor.focus(editor)
      }
    },
    [editor, focusBlock],
  )

  const renderOption = useCallback(
    (item: BlockStyleItem) => {
      const {style, styleComponent} = item
      const renderStyle = TEXT_STYLE_OPTIONS[style]
      const title = item.i18nTitleKey ? t(item.i18nTitleKey) : item?.title || item.style

      const CustomComponent = typeof styleComponent === 'function' ? styleComponent : undefined

      // If we have default support for the style and there is no custom component
      // defined, we render the default style.
      if (renderStyle && !CustomComponent) {
        return renderStyle(title)
      }

      // If we have a custom component, we render that
      if (CustomComponent) {
        return <CustomComponent>{title}</CustomComponent>
      }

      return <Text>{title}</Text>
    },
    [t],
  )

  const button = useMemo(
    () => (
      <Button
        disabled={_disabled}
        iconRight={ChevronDownIcon}
        justify="space-between"
        mode="bleed"
        onClick={preventDefault}
        text={menuButtonText}
        width="fill"
      />
    ),
    [_disabled, menuButtonText],
  )

  const menu = useMemo(
    () => (
      <Menu disabled={_disabled}>
        {items.map((item) => {
          return (
            <StyledMenuItem
              key={item.key}
              pressed={activeItems.includes(item)}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={_disabled ? undefined : () => handleChange(item)}
            >
              {renderOption(item)}
            </StyledMenuItem>
          )
        })}
      </Menu>
    ),
    [_disabled, activeItems, handleChange, items, renderOption],
  )

  return (
    <MenuButtonMemo
      popover={popoverProperties}
      id="block-style-select"
      button={button}
      menu={menu}
    />
  )
})
