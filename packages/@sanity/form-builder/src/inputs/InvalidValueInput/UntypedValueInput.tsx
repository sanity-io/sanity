import React from 'react'
import schema from 'part:@sanity/base/schema'
import PatchEvent, {setIfMissing, unset} from '../../PatchEvent'
import styles from '../ObjectInput/styles/UnknownFields.css'
import Warning from '../Warning'
import {Button} from '@sanity/ui'

type Props = {
  validTypes?: string[]
  value?: Record<string, unknown>
  onChange?: (event: PatchEvent, value?: Record<string, unknown>) => void
}

function SetMissingTypeButton({
  value,
  targetType,
  onChange,
}: {
  value: Record<string, unknown>
  targetType: string
  onChange: Props['onChange']
}) {
  const itemValue = {...value, _type: targetType}
  return (
    <Button
      onClick={() => onChange(PatchEvent.from(setIfMissing(targetType, ['_type'])), itemValue)}
      tone="primary"
      text={`Set <code>_type</code> to <code>${targetType}</code>`}
    />
  )
}

function UnsetItemButton({
  value,
  onChange,
  validTypes,
}: {
  value: Record<string, unknown>
  validTypes: string[]
  onChange: Props['onChange']
}) {
  // Doesn't matter which `_type` we use as long as it's allowed by the array
  const itemValue = {...value, _type: validTypes[0]}
  return (
    <Button
      onClick={() => onChange(PatchEvent.from(unset()), itemValue)}
      tone="critical"
      text="Remove value"
    />
  )
}

/**
 * When the value does not have an `_type` property,
 * but the schema has a named type
 */
export function UntypedValueInput({validTypes, value, onChange}: Props) {
  const isSingleValidType = validTypes.length === 1
  const isHoistedType = schema.has(validTypes[0])
  const fix = isSingleValidType ? (
    <SetMissingTypeButton onChange={onChange} targetType={validTypes[0]} value={value} />
  ) : null

  const message = (
    <>
      Encountered an object value without a <code>_type</code> property.
      {isSingleValidType && !isHoistedType && (
        <div>
          Either remove the <code>name</code> property of the object declaration, or set{' '}
          <code>_type</code> property on items.
        </div>
      )}
      {!isSingleValidType && (
        <div>
          The following types are valid here according to schema:{' '}
          <ul>
            {validTypes.map((validType) => (
              <li key={validType}>
                <code>{validType}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
      <h4>object</h4>
      <pre className={styles.inspectValue}>{JSON.stringify(value, null, 2)}</pre>
      {fix}
      {fix && ' '}
      <UnsetItemButton onChange={onChange} validTypes={validTypes} value={value} />
    </>
  )

  return <Warning heading="Content is missing _type" message={message} />
}
