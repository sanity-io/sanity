import {useCallback, useMemo} from 'react'

import {ChangeIndicator} from '../../changeIndicators'
import {TagInput} from '../components/tagInput'
import {set, unset} from '../patch'
import {type ArrayOfPrimitivesInputProps} from '../types'

/**
 *
 * @hidden
 * @beta
 */
export type TagsArrayInputProps = ArrayOfPrimitivesInputProps<string>

/**
 *
 * @hidden
 * @beta
 */
export function TagsArrayInput(props: TagsArrayInputProps) {
  const {onChange, readOnly, value = [], elementProps, path, changed} = props
  const tagInputValue = useMemo(() => value?.map((v) => ({value: v})), [value])

  const handleChange = useCallback(
    (nextValue: {value: string}[]) => {
      onChange(nextValue.length === 0 ? unset() : set(nextValue.map((v) => v.value)))
    },
    [onChange],
  )

  return (
    <ChangeIndicator path={path} isChanged={changed} hasFocus={false}>
      <TagInput
        onChange={handleChange}
        readOnly={readOnly}
        value={tagInputValue}
        {...elementProps}
      />
    </ChangeIndicator>
  )
}
