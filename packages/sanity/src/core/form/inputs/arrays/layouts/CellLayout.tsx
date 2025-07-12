import {useSortable} from '@dnd-kit/sortable'
import {Box, Card, type CardTone, Checkbox, Flex} from '@sanity/ui'
import {
  type ComponentProps,
  type MouseEventHandler,
  type ReactNode,
  useCallback,
  useContext,
} from 'react'
import {styled} from 'styled-components'

import {SortableItemIdContext} from '../../../../../_singletons'
import {DragHandle} from '../common/DragHandle'
import {MOVING_ITEM_CLASS_NAME} from '../common/list'

interface RowLayoutProps {
  tone?: CardTone
  dragHandle?: boolean
  presence?: ReactNode
  validation?: ReactNode
  menu?: ReactNode
  footer?: ReactNode
  selectable?: boolean
  onSelect: (options?: {metaKey?: boolean; shiftKey?: boolean}) => void
  onUnselect?: () => void
  open?: boolean
  children?: ReactNode
}

const FooterFlex = styled(Flex)`
  min-height: 33px;
`
const PresenceFlex = styled(Flex)`
  position: absolute;
  top: 0;
  right: 0;
  height: 33px;
`

const Controls = styled(Card)`
  position: absolute;
  top: 0;
  left: 0;
`

const Root = styled(Card)`
  transition: border-color 250ms;
  box-sizing: border-box;
  position: relative;

  @media (hover: hover) {
    ${Controls} {
      opacity: 0;
    }

    &:hover,
    &:focus-within {
      ${Controls} {
        opacity: 1;
      }
    }
  }

  .${MOVING_ITEM_CLASS_NAME} & {
    box-shadow:
      0 0 0 0,
      0 8px 17px 2px var(--card-shadow-umbra-color),
      0 3px 14px 2px var(--card-shadow-penumbra-color),
      0 5px 5px -3px var(--card-shadow-ambient-color);
  }

  &[aria-selected='true'] {
    box-shadow: 0 0 0 2px var(--card-focus-ring-color);
  }
`

/**
 * Use this to get the layout for grid items
 */
export function CellLayout(props: RowLayoutProps & Omit<ComponentProps<typeof Root>, 'onSelect'>) {
  const {
    validation,
    selected,
    tone,
    presence,
    children,
    selectable,
    open,
    onSelect,
    onUnselect,
    dragHandle,
    menu,
    footer,
    readOnly,
    ...rest
  } = props

  const handleCheckboxChange = useCallback(
    (event) => {
      if (event.currentTarget.checked) {
        onSelect?.({shiftKey: event.shiftKey, metaKey: true})
      } else {
        onUnselect?.()
      }
    },
    [onSelect, onUnselect],
  ) satisfies MouseEventHandler<HTMLInputElement>

  const id = useContext(SortableItemIdContext)!
  const {listeners, attributes} = useSortable({id, disabled: readOnly})

  return (
    <Root
      forwardedAs={Flex}
      direction="column"
      border
      selected={selected || open}
      aria-selected={selected || open}
      radius={1}
      tone={tone}
      {...rest}
      {...listeners}
      {...attributes}
    >
      <Box
        flex={1}
        onClickCapture={(e) => {
          if (e.metaKey || e.shiftKey) {
            e.preventDefault()
            e.stopPropagation()
            onSelect?.({metaKey: true, shiftKey: e.shiftKey})
          }
        }}
      >
        {children}
      </Box>

      <Controls
        display="flex"
        margin={0}
        padding={2}
        radius={2}
        tone="inherit"
        borderRight
        borderBottom
      >
        <Flex align="center" gap={3}>
          {dragHandle && (
            <Flex>
              <DragHandle $grid mode="ghost" readOnly={!!readOnly} />
            </Flex>
          )}
          <Flex as="label">
            <Checkbox checked={selected} onClick={handleCheckboxChange} />
          </Flex>
        </Flex>
      </Controls>

      {presence && (
        <PresenceFlex align="center" marginX={1}>
          {presence}
        </PresenceFlex>
      )}

      <FooterFlex align="center" paddingX={1} sizing="border" justify="space-between">
        <Flex>{validation}</Flex>
        <Box>{footer}</Box>
        {menu}
      </FooterFlex>
    </Root>
  )
}
