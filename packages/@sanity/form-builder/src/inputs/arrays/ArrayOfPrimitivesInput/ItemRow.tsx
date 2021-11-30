import {FieldPresence, FormFieldPresence} from '@sanity/base/presence'
import React, {useCallback, useMemo} from 'react'
import {Box, Card, CardTone, Flex} from '@sanity/ui'
import {FormFieldValidationStatus} from '@sanity/base/components'
import {
  Marker,
  Path,
  SchemaType,
  isValidationErrorMarker,
  isValidationWarningMarker,
} from '@sanity/types'
import {DragHandle} from '../common/DragHandle'
import PatchEvent, {set} from '../../../PatchEvent'
import {ItemWithMissingType} from '../ArrayOfObjectsInput/item/ItemWithMissingType'
import {FormBuilderInput} from '../../../FormBuilderInput'
import {ConfirmDeleteButton} from '../ArrayOfObjectsInput/ConfirmDeleteButton'
import getEmptyValue from './getEmptyValue'

const dragHandle = <DragHandle paddingX={1} paddingY={3} />

type Props = {
  type?: SchemaType
  onChange: (event: PatchEvent) => void
  onRemove: (item: number) => void
  onEnterKey: (item: number) => void
  onEscapeKey: (item: number) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  focusPath: Path
  markers: Marker[]
  index: number
  value: string | number | boolean
  compareValue?: (string | number | boolean)[]
  isSortable: boolean
  readOnly?: boolean | null
  level: number
  presence: FormFieldPresence[]
}

export const ItemRow = React.forwardRef(function ItemRow(
  props: Props,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const focusRef = React.useRef<FormBuilderInput>(null)
  const {
    isSortable,
    value,
    index,
    compareValue,
    level,
    onEscapeKey,
    onEnterKey,
    onFocus,
    onChange,
    onBlur,
    onRemove,
    focusPath,
    markers,
    type,
    readOnly,
    presence,
  } = props

  const hasError = markers.filter(isValidationErrorMarker).length > 0
  const hasWarning = markers.filter(isValidationWarningMarker).length > 0

  const showValidationStatus = !readOnly && markers.length > 0 && !type?.title
  const showPresence = !type?.title && !readOnly && presence.length > 0

  const handleRemove = useCallback(() => {
    onRemove(index)
  }, [index, onRemove])

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        onEnterKey(index)
      }
    },
    [index, onEnterKey]
  )

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<any>) => {
      if (event.shiftKey && event.key === 'Backspace' && value === '') {
        onRemove(index)
      }

      if (event.key === 'Escape') {
        onEscapeKey(index)
      }
    },
    [index, onEscapeKey, onRemove, value]
  )

  const handleChange = useCallback(
    (patchEvent: PatchEvent) => {
      onChange(
        PatchEvent.from(
          patchEvent.patches.map((
            patch // Map direct unset patches to empty value instead in order to not *remove* elements as the user clears out the value
          ) =>
            patch.path.length === 0 && patch.type === 'unset' && type
              ? set(getEmptyValue(type))
              : patch
          )
        ).prefixAll(index)
      )
    },
    [index, onChange, type]
  )

  const handleMissingTypeFocus = useCallback(() => onFocus([]), [onFocus])

  const tone = useMemo(() => {
    if (hasError) {
      return 'critical'
    }
    if (hasWarning) {
      return 'caution'
    }

    return undefined
  }, [hasError, hasWarning])

  return (
    <Card tone={tone} radius={2} paddingX={1} paddingY={2}>
      <Flex align={type ? 'flex-end' : 'center'} ref={ref}>
        {type ? (
          <Flex align="flex-end" flex={1}>
            {isSortable && <Box marginRight={1}>{dragHandle}</Box>}

            <Box flex={1} marginRight={2}>
              <FormBuilderInput
                ref={focusRef}
                value={value}
                path={[index]}
                compareValue={compareValue}
                markers={markers}
                focusPath={focusPath}
                onFocus={onFocus}
                onBlur={onBlur}
                type={type}
                readOnly={Boolean(readOnly || type.readOnly)}
                level={level}
                presence={presence}
                onKeyUp={handleKeyUp}
                onKeyPress={handleKeyPress}
                onChange={handleChange}
              />
            </Box>
          </Flex>
        ) : (
          <Box flex={1}>
            <ItemWithMissingType value={value} onFocus={handleMissingTypeFocus} />
          </Box>
        )}

        <Flex align="center" marginLeft={2}>
          {showValidationStatus && (
            <Box marginRight={3}>
              <FormFieldValidationStatus __unstable_markers={markers} />
            </Box>
          )}

          {showPresence && (
            // if title is set on type, presence avatars will be shown in the input' formfield instead
            <Box marginRight={1}>
              <FieldPresence presence={presence} maxAvatars={1} />
            </Box>
          )}

          {!readOnly && onRemove && (
            <Box paddingY={1}>
              <ConfirmDeleteButton placement="left" title="Remove item" onConfirm={handleRemove} />
            </Box>
          )}
        </Flex>
      </Flex>
    </Card>
  )
})
