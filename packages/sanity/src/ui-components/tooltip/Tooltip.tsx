import {type HotkeysProps, Text} from '@sanity/ui'
import {
  // oxlint-disable-next-line no-restricted-imports
  Tooltip as UITooltip,
  // oxlint-disable-next-line no-restricted-imports
  type TooltipProps as UITooltipProps,
} from '@sanity/ui/tooltip'
import {
  cloneElement,
  type FocusEvent,
  type MouseEvent,
  type RefAttributes,
  useMemo,
  useState,
} from 'react'
import {Flex, Box} from 'ui5'

import {Hotkeys} from '../../core/components/Hotkeys'
import {useOverlayContentMounted} from '../hooks/useOverlayContentMounted'
import {TOOLTIP_DELAY_PROPS} from './constants'

/** @internal */

export type TooltipProps = Omit<UITooltipProps, 'arrow' | 'padding' | 'shadow'> & {
  hotkeys?: HotkeysProps['keys']
}

const TOOLTIP_SHARED_PROPS: UITooltipProps = {
  animate: true,
  arrow: false,
  boundaryElement: null,
  delay: TOOLTIP_DELAY_PROPS,
  fallbackPlacements: ['bottom-start', 'bottom-end', 'top-start', 'top-end'],
  placement: 'bottom',
  portal: true,
}

/** The handlers of the reference element that the wrapper chains into. */
interface ReferenceInteractionProps {
  onBlur?: (event: FocusEvent<HTMLElement>) => void
  onFocus?: (event: FocusEvent<HTMLElement>) => void
  onMouseEnter?: (event: MouseEvent<HTMLElement>) => void
  onMouseLeave?: (event: MouseEvent<HTMLElement>) => void
}

/**
 * Tracks whether the tooltip's reference element is hovered or focused, which is the only way a
 * Sanity UI tooltip can open. Sanity UI's `Tooltip` chains the reference element's own hover and
 * focus handlers, so adding them to the child is enough to learn about the interaction.
 */
function useReferenceInteraction(child: React.JSX.Element | undefined): {
  active: boolean
  child: React.JSX.Element | undefined
} {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  const trackedChild = useMemo(() => {
    if (!child) return child

    const childProps: ReferenceInteractionProps = child.props

    return cloneElement(child, {
      onMouseEnter: (event: MouseEvent<HTMLElement>) => {
        childProps.onMouseEnter?.(event)
        setHovered(true)
      },
      onMouseLeave: (event: MouseEvent<HTMLElement>) => {
        childProps.onMouseLeave?.(event)
        setHovered(false)
      },
      onFocus: (event: FocusEvent<HTMLElement>) => {
        childProps.onFocus?.(event)
        setFocused(true)
      },
      onBlur: (event: FocusEvent<HTMLElement>) => {
        childProps.onBlur?.(event)
        setFocused(false)
      },
    })
  }, [child])

  return {active: hovered || focused, child: trackedChild}
}

/**
 * Customized Sanity UI <Tooltip> with limited layout options and support for showing hotkeys.
 *
 * In just about all cases, its strongly recommended that you pass a string to the `content` prop.
 * This helps simplify i18n and encourages short and concise.
 *
 * Passing ReactNode values to `content` is supported, but discouraged.
 *
 * The tooltip content is only rendered while the reference element is hovered or focused (plus
 * the exit grace), see {@link useOverlayContentMounted}. Sanity UI v4 otherwise keeps every closed
 * tooltip's content mounted in a hidden `<Activity>`, and a large form has several per field and
 * per array item. The tooltip is deliberately never toggled through `disabled`: Sanity UI renders
 * the child alone in that case and a Fragment otherwise, so flipping it remounts the reference
 * element.
 *
 * @internal
 */
export function Tooltip(props: TooltipProps & RefAttributes<HTMLDivElement>) {
  const {ref, children, content, hotkeys, ...rest} = props
  const {active, child} = useReferenceInteraction(children)
  const contentMounted = useOverlayContentMounted(active)

  if (typeof content === 'string') {
    return (
      <UITooltip
        {...TOOLTIP_SHARED_PROPS}
        content={
          contentMounted ? (
            <Flex alignItems="center">
              {content && (
                <Box flexBasis="0%" flexGrow={1} padding={1}>
                  <Text size={1}>{content}</Text>
                </Box>
              )}
              {hotkeys && (
                <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
                  <Hotkeys keys={hotkeys} />
                </Box>
              )}
            </Flex>
          ) : null
        }
        padding={1}
        ref={ref}
        {...rest}
      >
        {child}
      </UITooltip>
    )
  }

  return (
    <UITooltip
      {...TOOLTIP_SHARED_PROPS}
      content={contentMounted ? content : null}
      ref={ref}
      {...rest}
    >
      {child}
    </UITooltip>
  )
}
