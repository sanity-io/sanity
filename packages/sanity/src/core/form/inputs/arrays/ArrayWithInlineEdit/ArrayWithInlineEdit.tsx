/* eslint-disable react/jsx-handler-names */
import React from 'react'
import {Box, Button, Card, Flex, Inline, Menu, MenuButton, MenuItem, Stack, Text} from '@sanity/ui'
import {AnimatePresence, motion, Reorder, useDragControls} from 'framer-motion'
import {
  AddIcon,
  CollapseIcon,
  DragHandleIcon,
  EllipsisVerticalIcon,
  ExpandIcon,
  TrashIcon,
} from '@sanity/icons'
import {ObjectSchemaType} from '@sanity/types'
import styled from 'styled-components'
import {useChildValidation} from '../../../studio/contexts/Validation'
import {
  ArrayOfObjectsInputProps,
  ObjectItemProps,
  RenderArrayOfObjectsItemCallback,
  RenderPreviewCallback,
} from '../../../types'
import {FormFieldValidationStatus} from '../../../components'
import {useChildPresence} from '../../../studio/contexts/Presence'
import {createProtoArrayValue} from '../ArrayOfObjectsInput/createProtoArrayValue'
import {FieldPresence} from '../../../../presence'
import {ArrayOfObjectsInputMembers} from '../../../members'

const HoverCard = styled(Card)<{collapsed: boolean}>`
  background-color: ${(props) => (props.collapsed ? 'transparent' : 'inherit')};
  border: 1px solid transparent;

  &:hover {
    border-color: ${(props) =>
      props.collapsed ? 'var(--card-shadow-umbra-color)' : 'transparent'};
  }
`

function Item<T>(
  props: Omit<ObjectItemProps, 'renderDefault'> & {
    value: T
    collapsed: boolean
    onRemove: () => void
    onExpand: () => void
    onCollapse: () => void
    renderPreview: RenderPreviewCallback
  }
) {
  const {
    value,
    collapsed,
    onRemove,
    onExpand,
    onCollapse,
    schemaType,
    children,
    onFocus,
    onBlur,
    presence,
    validation,
  } = props
  const controls = useDragControls()

  const childPresence = useChildPresence(props.path)
  const childValidation = useChildValidation(props.path)

  const itemPresence = collapsed ? childPresence : presence
  const itemValidation = collapsed ? childValidation : validation
  return (
    <Reorder.Item as="div" value={value} dragListener={false} dragControls={controls}>
      <HoverCard shadow={collapsed ? 0 : 2} margin={1} radius={2} collapsed={collapsed}>
        <Flex align="center">
          <Box marginLeft={1}>
            <Button
              icon={DragHandleIcon}
              mode="bleed"
              className="reorder-handle"
              onPointerDown={(e) => controls.start(e)}
            />
          </Box>
          <Box flex={1}>
            <Card
              as="button"
              onClick={collapsed ? onExpand : onCollapse}
              radius={2}
              margin={1}
              paddingY={1}
              onFocus={onFocus}
              onBlur={onBlur}
              __unstable_focusRing
            >
              {props.renderPreview({value, schemaType})}
            </Card>
          </Box>
          {itemPresence.length > 0 && (
            <Box marginLeft={1}>
              <FieldPresence presence={itemPresence} maxAvatars={1} />
            </Box>
          )}

          {itemValidation.length > 0 && (
            <Box marginLeft={1} paddingX={1} paddingY={3}>
              <FormFieldValidationStatus />
            </Box>
          )}

          <Box marginRight={1}>
            <MenuButton
              button={<Button mode="bleed" icon={EllipsisVerticalIcon} />}
              id="menu-button-example"
              menu={
                <Menu>
                  <MenuItem text="Delete" icon={TrashIcon} tone="critical" onClick={onRemove} />
                </Menu>
              }
              popover={{portal: true}}
            />
          </Box>
        </Flex>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.section
              key="content"
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: {height: 'auto'},
                collapsed: {height: 0, overflow: 'hidden'},
              }}
              transition={{duration: 0.2}}
            >
              <Box padding={3}>
                <>{children}</>
              </Box>
            </motion.section>
          )}
        </AnimatePresence>
      </HoverCard>
    </Reorder.Item>
  )
}
export function ArrayWithInlineEdit(props: ArrayOfObjectsInputProps) {
  const exclusive = (props.schemaType.options as any).exclusive === true
  const renderItem: RenderArrayOfObjectsItemCallback = (itemProps) => {
    const collapsed = exclusive ? !itemProps.open : itemProps.collapsed !== false

    const onExpand = exclusive ? itemProps.onOpen : itemProps.onExpand
    const onCollapse = exclusive ? itemProps.onClose : itemProps.onCollapse

    return (
      <Item
        {...itemProps}
        key={itemProps.key}
        collapsed={collapsed}
        onExpand={onExpand}
        onCollapse={onCollapse}
        renderPreview={props.renderPreview}
      >
        {itemProps.children}
      </Item>
    )
  }
  const handleAddItem = () => {
    const itemType = props.schemaType.of[0]

    const key = Math.random().toString(32).substring(2)
    const item = {...createProtoArrayValue(itemType), _key: key}

    props.onItemAppend(item)
    if (exclusive) {
      props.onItemOpen([...props.path, {_key: key}])
    } else {
      props.onItemExpand(key)
    }
    props.onPathFocus([{_key: key}, (itemType as ObjectSchemaType).fields[0].name])
  }
  const handleCollapseAll = () => {
    props.members.forEach((member) => {
      if (member.kind === 'item' && !member.collapsed) props.onItemCollapse(member.key)
    })
  }
  const handleExpandAll = () => {
    props.members.forEach((member) => {
      if (member.kind === 'item') props.onItemExpand(member.key)
    })
  }
  const handleReorder = (nextItems: any[]) => {
    const moved = nextItems.flatMap((item, nextIndex) => {
      const currentIndex = props.value?.findIndex((currentItem) => currentItem._key === item._key)
      return currentIndex === undefined || currentIndex === nextIndex
        ? []
        : [[currentIndex, nextIndex]]
    })
    moved.forEach(([fromIndex, toIndex]) => {
      props.onItemMove({fromIndex, toIndex})
    })
  }

  const anyExpanded = props.members.find(
    (member) => member.kind === 'item' && member.collapsed === false
  )

  const handleToggleCollapse = () => {
    if (anyExpanded) {
      handleCollapseAll()
    } else {
      handleExpandAll()
    }
  }
  return (
    <Reorder.Group axis="y" values={props.value || []} onReorder={handleReorder} as="div">
      <Stack space={1}>
        {exclusive ? null : (
          <Flex justify="flex-end">
            <Inline space={2}>
              <Button
                icon={anyExpanded ? CollapseIcon : ExpandIcon}
                text={anyExpanded ? 'Collapse all' : 'Expand   all'}
                mode="bleed"
                fontSize={1}
                onClick={handleToggleCollapse}
                disabled={props.members.length === 0}
              />
            </Inline>
          </Flex>
        )}
        <Card
          radius={1}
          {...props.elementProps}
          border
          tabIndex={0}
          __unstable_focusRing
          marginY={1}
        >
          {props.members.length === 0 ? (
            <Box padding={2}>
              <Text muted>{props.schemaType.placeholder || 'No items'}</Text>
            </Box>
          ) : (
            <Stack>
              <ArrayOfObjectsInputMembers
                members={props.members}
                renderInput={props.renderInput}
                renderField={props.renderField}
                renderItem={renderItem}
                renderPreview={props.renderPreview}
                renderAnnotation={props.renderAnnotation!}
                renderBlock={props.renderBlock!}
                renderInlineBlock={props.renderInlineBlock!}
              />
            </Stack>
          )}
        </Card>
        <Button icon={AddIcon} text="Add item" mode="ghost" onClick={handleAddItem} />
      </Stack>
    </Reorder.Group>
  )
}
