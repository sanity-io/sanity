import React from 'react'
import Switch from 'part:@sanity/components/toggles/switch'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import ValidationStatus from 'part:@sanity/components/validation/status'
import PatchEvent, {set} from '../PatchEvent'
import {Type, Marker} from '../typedefs'
import styles from './BooleanInput.css'

type Props = {
  type: Type
  value: boolean | null
  readOnly: boolean | null
  onFocus: () => void
  onChange: (arg0: PatchEvent) => void
  markers: Marker[]
}

export default React.forwardRef(function BooleanInput(props: Props, ref) {
  const handleChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    props.onChange(PatchEvent.from(set(event.currentTarget.checked)))
  }
  const {value, type, readOnly, onFocus, markers} = props
  const isCheckbox = type.options && type.options.layout === 'checkbox'
  return (
    <div className={styles.root}>
      {isCheckbox ? (
        <Checkbox
          inputRef={ref}
          label={type.title}
          readOnly={readOnly}
          onChange={handleChange}
          onFocus={onFocus}
          checked={value}
          description={type.description}
        >
          <ValidationStatus markers={markers} />
        </Checkbox>
      ) : (
        <Switch
          inputRef={ref}
          readOnly={readOnly}
          checked={value}
          label={type.title}
          description={type.description}
          onChange={handleChange}
          onFocus={onFocus}
        >
          <ValidationStatus markers={markers} />
        </Switch>
      )}
    </div>
  )
})
