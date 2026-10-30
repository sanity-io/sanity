import {isBooleanSchemaType, isNumberSchemaType, isStringSchemaType} from '@sanity/types'
import {Card, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {BooleanInput} from '../BooleanInput'
import {EmailInput} from '../EmailInput'
import {NumberInput} from '../NumberInput/NumberInput'
import {StringInputBasic} from '../StringInput/StringInputBasic/StringInputBasic'
import {TelephoneInput} from '../TelephoneInput'
import {TextInput} from '../TextInput'
import {UrlInput} from '../UrlInput'
import {
  createPrimitiveInputProps,
  getPrimitiveSchemaType,
  isTextSchemaType,
} from './primitiveInputFixtures'

const headlineType = getPrimitiveSchemaType('headline', isStringSchemaType)
const bioType = getPrimitiveSchemaType('bio', isTextSchemaType)
const websiteType = getPrimitiveSchemaType('website', isStringSchemaType)
const emailType = getPrimitiveSchemaType('contactEmail', isStringSchemaType)
const phoneType = getPrimitiveSchemaType('phone', isStringSchemaType)
const ratingType = getPrimitiveSchemaType('rating', isNumberSchemaType)
const publishedType = getPrimitiveSchemaType('published', isBooleanSchemaType)
const featuredType = getPrimitiveSchemaType('featured', isBooleanSchemaType)

function Section(props: {title: string; children: ReactNode}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium">
        {props.title}
      </Text>
      {props.children}
    </VStack>
  )
}

/**
 * Renders every primitive input (string, text, url, email, telephone, number and both boolean
 * layouts) directly with form-builder shaped props: empty, filled, read-only and invalid.
 */
export function PrimitiveInputsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} data-testid="primitive-inputs">
        <VStack gap={5}>
          <Section title="StringInputBasic: empty with placeholder, filled, read-only">
            <StringInputBasic
              {...createPrimitiveInputProps(headlineType, {placeholder: 'A short headline'})}
            />
            <StringInputBasic
              {...createPrimitiveInputProps(headlineType, {value: 'Studio visual coverage'})}
            />
            <StringInputBasic
              {...createPrimitiveInputProps(headlineType, {
                value: 'Locked headline',
                readOnly: true,
              })}
            />
          </Section>

          <Section title="TextInput: four rows, filled, read-only">
            <TextInput
              {...createPrimitiveInputProps(bioType, {placeholder: 'A few lines about yourself'})}
            />
            <TextInput
              {...createPrimitiveInputProps(bioType, {
                value: 'Writes documentation, tests components,\nand keeps the schema tidy.',
              })}
            />
            <TextInput
              {...createPrimitiveInputProps(bioType, {value: 'Read only', readOnly: true})}
            />
          </Section>

          <Section title="UrlInput: filled and invalid">
            <UrlInput
              {...createPrimitiveInputProps(websiteType, {value: 'https://www.sanity.io'})}
            />
            <UrlInput
              {...createPrimitiveInputProps(websiteType, {
                value: 'not a url',
                validationError: 'Not a valid URL',
              })}
            />
          </Section>

          <Section title="EmailInput and TelephoneInput">
            <EmailInput {...createPrimitiveInputProps(emailType, {value: 'ada@example.com'})} />
            <TelephoneInput {...createPrimitiveInputProps(phoneType, {value: '+47 22 33 44 55'})} />
          </Section>

          <Section title="NumberInput: filled, read-only, invalid">
            <NumberInput {...createPrimitiveInputProps(ratingType, {value: 4})} />
            <NumberInput {...createPrimitiveInputProps(ratingType, {value: 2, readOnly: true})} />
            <NumberInput
              {...createPrimitiveInputProps(ratingType, {
                value: 9,
                validationError: 'Must be at most 5',
              })}
            />
          </Section>

          <Section title="BooleanInput: switch on, switch off read-only, checkbox on, unset">
            <BooleanInput {...createPrimitiveInputProps(publishedType, {value: true})} />
            <BooleanInput
              {...createPrimitiveInputProps(publishedType, {value: false, readOnly: true})}
            />
            <BooleanInput {...createPrimitiveInputProps(featuredType, {value: true})} />
            <BooleanInput {...createPrimitiveInputProps(featuredType, {})} />
          </Section>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
