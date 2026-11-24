import {EditIcon} from '@sanity/icons/Edit'
import {Button, Dialog, Stack} from '@sanity/ui'
import {type FocusEvent, type ReactNode, useId, useState} from 'react'
import {InlineCode, useTranslation} from 'sanity/i18n'
import {Box, Flex, Text} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {isPlainObject, objectFields, previewObject, setObjectKey} from '../../util/objectParams'
import {type InferredParam} from '../../util/paramInference'
import * as themeStyles from '../themeTokens.module.css'

export interface ObjectParamInputProps {
  id: string
  /** The param's name as written in the query, like `$range` or `$range.limits` */
  label: string
  param: InferredParam
  value: unknown
  disabled: boolean
  onChange: (value: unknown) => void
  onFocus?: (event: FocusEvent<HTMLElement>) => void
  onBlur?: (event: FocusEvent<HTMLElement>) => void
  /** Renders a key's field with the same inputs a param has, nested objects included */
  renderField: (
    field: InferredParam,
    value: unknown,
    isSet: boolean,
    onChange: (value: unknown) => void,
  ) => ReactNode
}

/**
 * An object param: a one-line preview of its keys in the grid, which opens a dialog with a field
 * per key, like object fields that Studio edits in a modal
 */
export function ObjectParamInput(props: ObjectParamInputProps) {
  const {id, label, param, value, disabled, onChange, onFocus, onBlur, renderField} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const [open, setOpen] = useState(false)
  const dialogId = useId()
  const fields = objectFields(param, value)
  const preview = previewObject(fields, value)
  const object = isPlainObject(value) ? value : {}

  return (
    <>
      <Button
        aria-haspopup="dialog"
        aria-label={t('vision.params-form.object.edit', {name: label})}
        data-testid={`vision-params-form-${param.name}-object`}
        disabled={disabled}
        id={id}
        justify="flex-start"
        mode="ghost"
        onBlur={onBlur}
        onClick={() => setOpen(true)}
        onFocus={onFocus}
        padding={2}
        width="fill"
      >
        <Flex alignItems="center" gap={2}>
          <Box flexBasis="0%" flexGrow={1} minWidth="0">
            <Text
              data-testid={`vision-params-form-${param.name}-object-preview`}
              muted={!preview}
              size={1}
              truncate={1}
              as="div"
              trim={true}
            >
              {preview || t('vision.params-form.not-set')}
            </Text>
          </Box>
          <Text muted size={1} as="div" trim={true}>
            <EditIcon />
          </Text>
        </Flex>
      </Button>
      {open && (
        <Dialog
          data-testid={`vision-params-form-${param.name}-dialog`}
          header={
            <Text className={themeStyles.themeTokens} size={1} weight="medium" as="div" trim={true}>
              <InlineCode>{label}</InlineCode>
            </Text>
          }
          id={dialogId}
          onClose={() => setOpen(false)}
          width={1}
        >
          <Stack className={themeStyles.themeTokens} gap={4} padding={4}>
            {fields.length === 0 ? (
              <Text muted size={1} as="div" trim={true}>
                {t('vision.params-form.object.empty')}
              </Text>
            ) : (
              fields.map((field) => (
                <Box key={field.name}>
                  {renderField(
                    field,
                    object[field.name],
                    Object.hasOwn(object, field.name),
                    (next) => onChange(setObjectKey(value, field.name, next)),
                  )}
                </Box>
              ))
            )}
          </Stack>
        </Dialog>
      )}
    </>
  )
}
