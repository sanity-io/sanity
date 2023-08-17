import React, {useCallback} from 'react'
import {Box, Button, Card, Code, Stack, Text} from '@sanity/ui'
import {TrashIcon} from '@sanity/icons'
import {FormPatch, PatchEvent, unset} from '../../patch'
import {Details} from '../../components/Details'
import {Alert} from '../../components/Alert'
import {isDev} from '../../../environment'

type Props = {
  fieldNames: string[]
  value?: Record<string, unknown>
  onChange(patch: FormPatch): void
  onChange(patch: FormPatch[]): void
  onChange(patch: PatchEvent): void
  readOnly?: boolean
}

export function UnknownFields(props: Props) {
  const {fieldNames, onChange, readOnly, value} = props
  const fieldsLen = fieldNames.length

  const handleUnsetClick = useCallback(
    (fieldName: any) => {
      onChange(unset([fieldName]))
    },
    [onChange],
  )

  return (
    <Alert
      status="warning"
      title={
        <>
          {fieldsLen === 1 && <>Unknown field found</>}
          {fieldsLen > 1 && <>Unknown fields found</>}
        </>
      }
    >
      <Text as="p" muted size={1}>
        {fieldsLen === 1 ? (
          <>Encountered a field that is not defined in the schema.</>
        ) : (
          <>Encountered {fieldsLen} fields that are not defined in the schema.</>
        )}
      </Text>

      <Details marginTop={4} open={isDev} title={<>Developer info</>}>
        <Box marginBottom={3}>
          <Text as="p" muted size={1}>
            {fieldsLen === 1 ? (
              <>
                This field is not defined in the schema, which could mean that the field definition
                has been removed or that someone else has added it to their own local project and
                have not deployed their changes yet.
              </>
            ) : (
              <>
                These fields are not defined in the document’s schema, which could mean that the
                field definitions have been removed or that someone else has added them to their own
                local project and have not deployed their changes yet.
              </>
            )}
          </Text>
        </Box>

        <Stack as="ul" space={3}>
          {fieldNames.map((fieldName) => {
            return (
              <UnknownField
                key={fieldName}
                fieldName={fieldName}
                onUnsetClick={handleUnsetClick}
                readOnly={readOnly}
                value={value?.[fieldName]}
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
  onUnsetClick,
  readOnly,
  value,
}: {
  fieldName: string
  onUnsetClick: (fieldName: string) => void
  readOnly?: boolean
  value: unknown
}) {
  const handleUnsetClick = useCallback(() => {
    onUnsetClick(fieldName)
  }, [fieldName, onUnsetClick])

  return (
    <Card as="li" padding={3} radius={2} shadow={1} tone="caution">
      <Stack space={2}>
        <Card border radius={1}>
          <Card borderBottom padding={3}>
            <Code weight="medium">{fieldName}</Code>
          </Card>
          <Box overflow="auto" padding={3}>
            <Code language="json">{JSON.stringify(value, null, 2)}</Code>
          </Box>
        </Card>

        {readOnly && (
          <Text as="p" muted size={1}>
            This field is <strong>read only</strong> according to the document’s schema and cannot
            be unset. If you want to be able to unset this in Studio, make sure you remove the{' '}
            <code>readOnly</code> field from the enclosing type in the schema.
          </Text>
        )}

        {!readOnly && (
          <Button
            icon={TrashIcon}
            onClick={handleUnsetClick}
            tone="critical"
            text={<>Remove field</>}
          />
        )}
      </Stack>
    </Card>
  )
}
