import React, {useRef} from 'react'
import Switch from 'part:@sanity/components/toggles/switch'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import ValidationStatus from 'part:@sanity/components/validation/status'
import FieldStatus from '@sanity/components/lib/fieldsets/FieldStatus'
import {FieldPresence} from '@sanity/base/presence'
import PatchEvent, {set} from '../PatchEvent'
import styles from './BooleanInput.css'
import {Props} from './types'

const BooleanInput = React.forwardRef(
  (props: Props<boolean>, ref: React.MutableRefObject<HTMLDivElement>) => {
    const inputRef = useRef<any>(null)
    const handleChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
      props.onChange(PatchEvent.from(set(event.currentTarget.checked)))
    }
    const {value, type, readOnly, onFocus, markers, presence} = props
    const isCheckbox = type.options && type.options.layout === 'checkbox'
    return (
      <div className={styles.root} ref={ref}>
        {isCheckbox ? (
          <Checkbox
            ref={inputRef}
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
            ref={inputRef}
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
        <FieldStatus position="top">
          <FieldPresence maxAvatars={1} presence={presence} />
        </FieldStatus>
      </div>
    )
  }
)

BooleanInput.displayName = 'BooleanInput'

export default BooleanInput
