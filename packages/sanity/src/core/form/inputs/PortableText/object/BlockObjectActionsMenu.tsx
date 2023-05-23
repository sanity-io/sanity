import {EditIcon, LinkIcon, TrashIcon, EyeOpenIcon, EllipsisVerticalIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuButtonProps,
  MenuItem,
  useGlobalKeyDown,
} from '@sanity/ui'
import React, {
  forwardRef,
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useId,
  useEffect,
  PropsWithChildren,
} from 'react'
import {PortableTextBlock} from '@sanity/types'
import {IntentLink} from 'sanity/router'

interface BlockObjectActionsMenuProps extends PropsWithChildren {
  focused: boolean
  isOpen?: boolean
  onOpen: () => void
  onRemove: () => void
  readOnly?: boolean
  value: PortableTextBlock
}

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  placement: 'bottom',
  portal: 'default',
  tone: 'default',
}

export function BlockObjectActionsMenu(props: BlockObjectActionsMenuProps): ReactElement {
  const {children, focused, isOpen, onOpen, onRemove, readOnly, value} = props
  const menuButtonId = useId()
  const menuButton = useRef<HTMLButtonElement | null>(null)
  const isTabbing = useRef<boolean>(false)

  const referenceLink = useMemo(
    () =>
      '_ref' in value && value._ref
        ? forwardRef(function ReferenceLink(
            linkProps,
            ref: React.Ref<HTMLAnchorElement> | undefined
          ) {
            return <IntentLink {...linkProps} intent="edit" params={{id: value._ref}} ref={ref} />
          })
        : undefined,
    [value]
  )

  useEffect(() => {
    if (isOpen) {
      isTabbing.current = false
    }
  }, [isOpen])

  // Go to menu when tabbed to
  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (!focused) {
          return
        }
        if (event.key === 'Tab') {
          if (menuButton.current && !isTabbing.current && !isOpen) {
            event.preventDefault()
            event.stopPropagation()
            menuButton.current.focus()
            isTabbing.current = true
          }
        }
      },
      [focused, isOpen]
    )
  )

  const handleDelete = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      onRemove()
    },
    [onRemove]
  )

  return (
    <Flex>
      <Box flex={1}>{children}</Box>
      <Box>
        <MenuButton
          button={
            <Button
              aria-label="Open menu"
              fontSize={1}
              iconRight={EllipsisVerticalIcon}
              mode="bleed"
              paddingX={2}
              tabIndex={focused ? 0 : 1}
            />
          }
          ref={menuButton}
          id={menuButtonId}
          menu={
            <Menu>
              <>
                {'_ref' in value && value._ref && (
                  <MenuItem as={referenceLink} data-as="a" icon={LinkIcon} text="Open reference" />
                )}

                {readOnly && <MenuItem icon={EyeOpenIcon} onClick={onOpen} text="View" />}
                {!readOnly && <MenuItem icon={EditIcon} onClick={onOpen} text="Edit" />}
                {!readOnly && (
                  <MenuItem icon={TrashIcon} onClick={handleDelete} text="Delete" tone="critical" />
                )}
              </>
            </Menu>
          }
          popover={POPOVER_PROPS}
        />
      </Box>
    </Flex>
  )
}
