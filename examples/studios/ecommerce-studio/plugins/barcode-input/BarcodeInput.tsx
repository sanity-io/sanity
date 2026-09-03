// Copied from `@sanity/cli` (templates/ecommerce/plugins/barcode-input/BarcodeInput.js)

import './BarcodeInput.css'

import {Text} from '@sanity/ui'
import {useState} from 'react'
import Barcode from 'react-barcode'
import {type FieldMember, MemberField, type ObjectInputProps} from 'sanity'
import {Box} from 'ui5'

interface BarcodeValue {
  barcode?: string
  format?: string
}

export const BarcodeInput = function BarcodeInput(props: ObjectInputProps<BarcodeValue>) {
  const {value, renderInput, renderItem, renderPreview, renderField, members} = props
  const [valid, setValid] = useState(true)

  const memberFields = members.filter((member): member is FieldMember => member.kind === 'field')

  return (
    <>
      <Box className="barcode-root">
        {value && value.barcode && (
          <Barcode
            textAlign="center"
            value={value.barcode}
            format={value.format || ''}
            valid={setValid}
          />
        )}
        {!valid && <Text className="barcode-error">Not a valid {value?.format}</Text>}
      </Box>
      <div className="barcode-fields">
        {memberFields.map((member) => (
          <MemberField
            key={member.key}
            member={member}
            renderInput={renderInput}
            renderField={renderField}
            renderItem={renderItem}
            renderPreview={renderPreview}
          />
        ))}
      </div>
    </>
  )
}
