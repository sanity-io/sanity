import {
  type Path,
  type SchemaType,
  isArraySchemaType,
  type DeprecatedProperty,
  type FormNodeValidation,
} from '@sanity/types'
import {Badge, Flex, Stack, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {
  type FocusEvent,
  type HTMLProps,
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  type RefAttributes,
} from 'react'
import {Box} from 'ui5'

import {TextWithTone} from '../../../components/textWithTone/TextWithTone'
import {type DocumentFieldActionNode} from '../../../config/document/fieldActions/types'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {type FormNodePresence} from '../../../presence/types'
import {useFieldActions} from '../../field/actions/useFieldActions'
import {createDescriptionId} from '../../members/common/createDescriptionId'
import {type FieldCommentsProps} from '../../types/fieldProps'
import {FormFieldGutter} from '../FormFieldGutter'
import {FormNodeDivergenceCollectionIndicator} from '../FormNodeDivergenceCollectionIndicator'
import {FormNodeDivergenceDetail} from '../FormNodeDivergenceDetail'
import {FormRow} from '../layout/FormRow'
import {FormFieldBaseHeader} from './FormFieldBaseHeader'
import {
  content as contentClass,
  contentBorderLeft,
  contentBorderLeftFocused,
  contentFocusRingVar,
  root,
} from './FormFieldSet.css'
import {FormFieldSetLegend} from './FormFieldSetLegend'
import {FormFieldValidationStatus} from './FormFieldValidationStatus'
import {ColumnarGrid, focusRingStyle} from './styles'

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
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
  schemaType?: SchemaType
  title?: ReactNode
  /**
   *
   * @hidden
   * @beta
   */
  validation?: FormNodeValidation[]
  inputId: string
  deprecated?: DeprecatedProperty

  path: Path
  readOnly?: boolean
  /**
   * Whether the value differs to the document's base variant.
   */
  changedFromBaseVariant?: boolean
}

function getChildren(children: ReactNode | (() => ReactNode)): ReactNode {
  return typeof children === 'function' ? children() : children
}

const EMPTY_ARRAY: never[] = []

/** @internal */
export function FormFieldSet(
  props: FormFieldSetProps &
    Omit<HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref'> &
    RefAttributes<HTMLDivElement>,
) {
  const {
    ref: forwardedRef,
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    __internal_comments: comments,
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    __internal_slot: slot = null,
    __unstable_headerActions: actions = EMPTY_ARRAY,
    __unstable_presence: presence = EMPTY_ARRAY,
    changedFromBaseVariant = false,
    children,
    className,
    collapsed,
    collapsible,
    columns,
    description,
    level = 0,
    onCollapse,
    onExpand,
    onFocus,
    schemaType,
    tabIndex,
    title,
    validation = EMPTY_ARRAY,
    inputId,
    path,
    deprecated,
    readOnly,
    ...restProps
  } = props

  const {focused, hovered, onMouseEnter, onMouseLeave} = useFieldActions()
  const {color, input} = useThemeV2()

  // The rest props are typed for a `div` (public API) but rendered on a `fieldset`; widening to the
  // shared `HTMLElement` base type is what `forwardedAs="fieldset"` used to paper over.
  const rootProps: Omit<HTMLProps<HTMLElement>, 'as' | 'height' | 'ref'> = restProps

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
      <ColumnarGrid gridTemplateColumns={columns} gapX={4} gapY={5}>
        {getChildren(children)}
      </ColumnarGrid>
    )
  }, [children, collapsed, columns])

  return (
    <FormRow
      gutterStartCell={
        <FormFieldGutter path={path} changedFromBaseVariant={changedFromBaseVariant} />
      }
    >
      <FormNodeDivergenceDetail path={path} readOnly={readOnly}>
        <Stack
          as="fieldset"
          className={clsx(root, className)}
          data-level={level}
          {...rootProps}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          gap={2}
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
              <Stack gap={3}>
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
                  {isArraySchemaType(schemaType) && (
                    <Box marginLeft={2}>
                      <FormNodeDivergenceCollectionIndicator path={path} />
                    </Box>
                  )}
                  {hasValidationMarkers && (
                    <Box marginLeft={2}>
                      <FormFieldValidationStatus
                        fontSize={1}
                        placement="top"
                        validation={validation}
                      />
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
          <Box
            className={clsx(
              contentClass,
              level > 0 && (focused ? contentBorderLeftFocused : contentBorderLeft),
            )}
            hidden={collapsed}
            paddingLeft={level === 0 ? 0 : 3}
            onFocus={typeof tabIndex === 'number' && tabIndex > -1 ? handleFocus : undefined}
            ref={ref}
            style={assignInlineVars({
              [contentFocusRingVar]: focusRingStyle({
                base: color,
                focusRing: {...input.text.focusRing, offset: 2},
              }),
            })}
            tabIndex={tabIndex}
          >
            {!collapsed && content}
          </Box>
        </Stack>
      </FormNodeDivergenceDetail>
    </FormRow>
  )
}
