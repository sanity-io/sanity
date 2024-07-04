/* eslint-disable camelcase */
import {type DeprecatedProperty, type FormNodeValidation} from '@sanity/types'
import {Badge, Box, Flex, Stack, Text, type Theme} from '@sanity/ui'
import {
  type FocusEvent,
  type ForwardedRef,
  forwardRef,
  type HTMLProps,
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import {css, styled} from 'styled-components'

import {TextWithTone} from '../../../components'
import {type DocumentFieldActionNode} from '../../../config'
import {useTranslation} from '../../../i18n'
import {type FormNodePresence} from '../../../presence'
import {useFieldActions} from '../../field'
import {createDescriptionId} from '../../members/common/createDescriptionId'
import {type FieldCommentsProps} from '../../types'
import {FormFieldBaseHeader} from './FormFieldBaseHeader'
import {FormFieldSetLegend} from './FormFieldSetLegend'
import {FormFieldValidationStatus} from './FormFieldValidationStatus'
import {AlignedBottomGrid, focusRingStyle} from './styles'

/** @internal */
export interface FormFieldSetProps {
  /**
   *
   * @hidden
   * @beta
   */
  __unstable_headerActions?: DocumentFieldActionNode[]
  /**
   * @beta
   */
  __unstable_presence?: FormNodePresence[]
  /** @internal @deprecated DO NOT USE */
  __internal_comments?: FieldCommentsProps
  /** @internal @deprecated ONLY USED BY AI ASSIST PLUGIN */
  __internal_slot?: ReactNode
  children: ReactNode | (() => ReactNode)
  collapsed?: boolean
  collapsible?: boolean
  columns?: number | number[]
  description?: ReactNode
  /**
   * The nesting level of the form field set
   */
  level?: number
  onCollapse?: () => void
  onExpand?: () => void
  title?: ReactNode
  /**
   *
   * @hidden
   * @beta
   */
  validation?: FormNodeValidation[]
  inputId: string
  deprecated?: DeprecatedProperty
}

function getChildren(children: ReactNode | (() => ReactNode)): ReactNode {
  return typeof children === 'function' ? children() : children
}

const Root = styled(Stack).attrs({forwardedAs: 'fieldset'})`
  border: none;

  /* See: https://thatemil.com/blog/2015/01/03/reset-your-fieldset/ */
  body:not(:-moz-handler-blocked) & {
    display: table-cell;
  }
`

const Content = styled(Box)<{
  /*
   * @note: The dollar sign ($) prefix is a `styled-components` convention for
   * denoting transient props. See:
   * https://styled-components.com/docs/api#transient-props
   */
  $borderLeft: boolean
  $focused?: boolean
  theme: Theme
}>((props) => {
  const {$borderLeft, $focused, theme} = props
  const {focusRing} = theme.sanity
  const {base} = theme.sanity.color

  return css`
    outline: none;
    border-left: ${$borderLeft ? '1px solid var(--card-border-color)' : undefined};
    transition:
      border-color 0.2s ease-in-out,
      box-shadow 0.2s ease-in-out;

    ${$borderLeft &&
    $focused &&
    `border-left: 1px solid var(--card-focus-ring-color);
    box-shadow: inset 1px 0 0 var(--card-focus-ring-color);`}

    ${$borderLeft &&
    !$focused &&
    `
      box-shadow: inset 0 0 0 transparent;
    `}

    &:focus {
      box-shadow: ${focusRingStyle({base, focusRing: {...focusRing, offset: 2}})};
    }

    &:focus:not(:focus-visible) {
      box-shadow: none;
    }
  `
})

const EMPTY_ARRAY: never[] = []

/** @internal */
export const FormFieldSet = forwardRef(function FormFieldSet(
  props: FormFieldSetProps & Omit<HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref'>,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const {
    __internal_comments: comments,
    __internal_slot: slot = null,
    __unstable_headerActions: actions = EMPTY_ARRAY,
    __unstable_presence: presence = EMPTY_ARRAY,
    children,
    collapsed,
    collapsible,
    columns,
    description,
    level = 0,
    onCollapse,
    onExpand,
    onFocus,
    tabIndex,
    title,
    validation = EMPTY_ARRAY,
    inputId,
    deprecated,
    ...restProps
  } = props

  const {focused, hovered, onMouseEnter, onMouseLeave} = useFieldActions()

  const hasValidationMarkers = validation.length > 0
  const ref = useRef<HTMLDivElement | null>(null)
  const {t} = useTranslation()

  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(forwardedRef, () => ref.current)

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const element = ref.current

      if (element === event.target) {
        if (onFocus) onFocus(event)
      }
    },
    [onFocus],
  )

  const handleToggle = useCallback(
    () => (collapsed ? onExpand?.() : onCollapse?.()),
    [collapsed, onCollapse, onExpand],
  )

  const content = useMemo(() => {
    if (collapsed) {
      return null
    }
    return (
      <AlignedBottomGrid columns={columns} gapX={4} gapY={5}>
        {getChildren(children)}
      </AlignedBottomGrid>
    )
  }, [children, collapsed, columns])

  return (
    <Root
      data-level={level}
      {...restProps}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      space={2}
    >
      <FormFieldBaseHeader
        __internal_comments={comments}
        __internal_slot={slot}
        actions={actions}
        fieldFocused={Boolean(focused)}
        fieldHovered={hovered}
        presence={presence}
        inputId={inputId}
        content={
          <Stack space={3}>
            <Flex align="center">
              {title && (
                <FormFieldSetLegend
                  collapsed={Boolean(collapsed)}
                  collapsible={collapsible}
                  onClick={collapsible ? handleToggle : undefined}
                  title={title}
                />
              )}
              {deprecated && (
                <Box marginLeft={2}>
                  <Badge data-testid={`deprecated-badge-${title}`} tone="caution">
                    {t('form.field.deprecated-label')}
                  </Badge>
                </Box>
              )}
              {hasValidationMarkers && (
                <Box marginLeft={2}>
                  <FormFieldValidationStatus fontSize={1} placement="top" validation={validation} />
                </Box>
              )}
            </Flex>

            {deprecated && (
              <TextWithTone data-testid={`deprecated-message-${title}`} tone="caution" size={1}>
                {deprecated.reason}
              </TextWithTone>
            )}

            {description && (
              <Text muted size={1} id={createDescriptionId(inputId, description)}>
                {description}
              </Text>
            )}
          </Stack>
        }
      />

      <Content
        $borderLeft={level > 0}
        $focused={Boolean(focused)}
        hidden={collapsed}
        paddingLeft={level === 0 ? 0 : 3}
        onFocus={typeof tabIndex === 'number' && tabIndex > -1 ? handleFocus : undefined}
        ref={ref}
        tabIndex={tabIndex}
      >
        {!collapsed && content}
      </Content>
    </Root>
  )
})
