import React, {useCallback} from 'react'
import {Box, Button, Card, Code, Stack, Text} from '@sanity/ui'
import {TrashIcon} from '@sanity/icons'
import {Details} from '../../components/Details'
import PatchEvent, {unset} from '../../PatchEvent'
import {ActivateOnFocus} from '../../transitional/ActivateOnFocus'
import {Alert} from '../../components/Alert'

declare const __DEV__: boolean

type Props = {
  fieldNames: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: Record<string, any>
  onChange: (event: PatchEvent) => void
  readOnly?: boolean
}

export function UnknownFields(props: Props) {
  const {fieldNames, onChange, readOnly, value} = props
  const fieldsLen = fieldNames.length

  const handleUnsetClick = useCallback(
    (fieldName) => {
      onChange(PatchEvent.from(unset([fieldName])))
    },
    [onChange]
  )

  return (
    <Alert
      status="warning"
      title={
        <>
          {fieldsLen === 1 && <>This document contains an unknown property</>}
          {fieldsLen > 1 && <>This document contains unknown properties</>}
        </>
      }
    >
      <Text as="p" muted size={1}>
        {fieldsLen === 1 && (
          <>Encountered a property that is not defined in the document’s schema.</>
        )}
        {fieldsLen > 1 && (
          <>Encountered {fieldsLen} properties that are not defined in the document’s schema.</>
        )}
      </Text>

      <Details marginTop={4} open={__DEV__} title={<>Developer info</>}>
        <Box marginBottom={3}>
          {fieldsLen === 1 && (
            <Text as="p" muted size={1}>
              This field is not defined in the document’s schema, which could mean that the field
              definition has been removed or that someone else has added it to their own local
              project and have not deployed their changes yet.
            </Text>
          )}

          {fieldsLen > 1 && (
            <Text as="p" muted size={1}>
              These fields are not defined in the document’s schema, which could mean that the field
              definitions have been removed or that someone else has added them to their own local
              project and have not deployed their changes yet.
            </Text>
          )}
        </Box>

        <Stack as="ul" space={3}>
          {fieldNames.map((fieldName) => {
            return (
              <UnknownField
                key={fieldName}
                fieldName={fieldName}
                onUnsetClient={handleUnsetClick}
                readOnly={readOnly}
                value={value[fieldName]}
              />
            )
          })}
        </Stack>
      </Details>
    </Alert>
  )
}

function UnknownField({
  fieldName,
  onUnsetClient,
  readOnly,
  value,
}: {
  fieldName: string
  // eslint-disable-next-line no-shadow
  onUnsetClient: (fieldName: string) => void
  readOnly: boolean
  value: any
}) {
  const handleUnsetClick = useCallback(() => {
    onUnsetClient(fieldName)
  }, [fieldName, onUnsetClient])

  return (
    <Card as="li" padding={3} radius={2} shadow={1} tone="caution">
      <Stack space={2}>
        <Card border radius={1}>
          <ActivateOnFocus>
            <Card borderBottom padding={3}>
              <Code weight="medium">{fieldName}</Code>
            </Card>
            <Box padding={3}>
              <Code language="json">{JSON.stringify(value, null, 2)}</Code>
            </Box>
          </ActivateOnFocus>
        </Card>

        {readOnly && (
          <Text as="p" muted size={1}>
            This property is <strong>read only</strong> according to the document’s schema and
            cannot be unset. If you want to be able to unset this in Studio, make sure you remove
            the <code>readOnly</code> property from the enclosing type in the schema.
          </Text>
        )}

        {!readOnly && (
          <Button
            icon={TrashIcon}
            onClick={handleUnsetClick}
            tone="critical"
            text={<>Remove property</>}
          />
        )}
      </Stack>
    </Card>
  )
}
