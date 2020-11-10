import React, {useRef, useCallback} from 'react'
import Switch from 'part:@sanity/components/toggles/switch'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import ValidationStatus from 'part:@sanity/components/validation/status'
import FieldStatus from '@sanity/base/lib/__legacy/@sanity/components/fieldsets/FieldStatus'
import {ChangeIndicator} from '@sanity/base/lib/change-indicators'
import {BooleanSchemaType} from '@sanity/types'
import {FieldPresence} from '@sanity/base/presence'
import PatchEvent, {set} from '../PatchEvent'
import styles from './BooleanInput.css'
import {Props} from './types'

const BooleanInput = React.forwardRef(
  (props: Props<boolean, BooleanSchemaType>, ref: React.MutableRefObject<HTMLDivElement>) => {
    const {onChange} = props
    const inputRef = useRef<any>(null)
    const {value, type, readOnly, onFocus, markers, presence} = props
    const layout = type.options?.layout || 'switch'

    const handleChange = useCallback(
      (event: React.SyntheticEvent<HTMLInputElement>) => {
        onChange(PatchEvent.from(set(event.currentTarget.checked)))
      },
      [onChange]
    )

    return (
      <ChangeIndicator>
        <div className={styles.root} ref={ref}>
          <div className={styles.inputWrapper} data-layout={layout}>
            {layout === 'checkbox' && (
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
            )}

            {layout === 'switch' && (
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
          </div>

          <FieldStatus maxAvatars={1} position="top">
            <FieldPresence maxAvatars={1} presence={presence} />
          </FieldStatus>
        </div>
      </ChangeIndicator>
    )
  }
)

BooleanInput.displayName = 'BooleanInput'

export default BooleanInput
