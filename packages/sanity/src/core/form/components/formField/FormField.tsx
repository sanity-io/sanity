import {type DeprecatedProperty, type FormNodeValidation} from '@sanity/types'
import {Stack} from '@sanity/ui'
import {type HTMLProps, memo, type ReactNode, useMemo} from 'react'

import {TextWithTone} from '../../../components'
import {type DocumentFieldActionNode} from '../../../config'
import {useTranslation} from '../../../i18n'
import {type FormNodePresence} from '../../../presence'
import {sanitizeFieldValue} from '../../../studio/components/navbar/search/utils/sanitizeField'
import {useFieldActions} from '../../field'
import {type FieldCommentsProps} from '../../types'
import {FormRow} from '../layout/FormRow'
import {FormFieldBaseHeader} from './FormFieldBaseHeader'
import {FormFieldHeaderText} from './FormFieldHeaderText'

const EMPTY_ARRAY: never[] = []

/** @internal */
export interface FormFieldProps {
  /**
   * @hidden
   * @beta
   */
  __unstable_headerActions?: DocumentFieldActionNode[]
  /**
   * @hidden
   * @beta
   */
  __unstable_presence?: FormNodePresence[]
  /** @internal @deprecated DO NOT USE */
  __internal_comments?: FieldCommentsProps
  /** @internal @deprecated ONLY USED BY AI ASSIST PLUGIN */
  __internal_slot?: ReactNode
  children: ReactNode
  description?: ReactNode
  /**
   * The unique ID used to target the actual input element
   */
  inputId?: string
  /**
   * The nesting level of the form field
   */
  level?: number
  title?: ReactNode
  /**
   * @beta
   */
  validation?: FormNodeValidation[]
  deprecated?: DeprecatedProperty
}

/** @internal */
export const FormField = memo(function FormField(
  props: FormFieldProps & Omit<HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref'>,
) {
  const {
    __unstable_headerActions: actions = EMPTY_ARRAY,
    __unstable_presence: presence = EMPTY_ARRAY,
    __internal_slot: slot = null,
    __internal_comments: comments,
    children,
    description,
    inputId,
    level,
    title,
    validation,
    deprecated,
    ...restProps
  } = props
  const {focused, hovered, onMouseEnter, onMouseLeave} = useFieldActions()
  const {t} = useTranslation()

  const sanitizedTitle = useMemo(() => {
    if (!title) return title
    const result = sanitizeFieldValue(title as string | React.JSX.Element)
    return (
      result || (
        <TextWithTone tone="caution" size={1}>
          {t('form.field.title.unsupported-react-element')}
        </TextWithTone>
      )
    )
  }, [title, t])

  const sanitizedDescription = useMemo(() => {
    if (!description) return description
    const result = sanitizeFieldValue(description as string | React.JSX.Element)
    return (
      result || (
        <TextWithTone tone="caution" size={1}>
          {t('form.field.description.unsupported-react-element')}
        </TextWithTone>
      )
    )
  }, [description, t])

  return (
    <FormRow>
      <Stack
        {...restProps}
        data-level={level}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        space={2}
      >
        {/*
        NOTE: It’s not ideal to hide validation, presence and description when there's no `title`.
        So we might want to separate the concerns of input vs formfield components later on.
      */}
        {title && (
          <FormFieldBaseHeader
            __internal_comments={comments}
            __internal_slot={slot}
            actions={actions}
            fieldFocused={Boolean(focused)}
            fieldHovered={hovered}
            presence={presence}
            inputId={inputId}
            content={
              <FormFieldHeaderText
                description={sanitizedDescription}
                inputId={inputId}
                title={sanitizedTitle}
                validation={validation}
                deprecated={deprecated}
              />
            }
          />
        )}
        <div>{children}</div>
      </Stack>
    </FormRow>
  )
})
