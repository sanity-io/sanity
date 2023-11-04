import {InvalidValueResolution} from '@sanity/portable-text-editor'
import {Box, Card, Code, Grid, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {Button} from '../../../../ui'
import {Alert} from '../../components/Alert'

interface InvalidValueProps {
  onChange: (...args: any[]) => any
  onIgnore: () => void
  readOnly?: boolean
  resolution: InvalidValueResolution
}

export function InvalidValue(props: InvalidValueProps) {
  const {onChange, onIgnore, resolution, readOnly} = props

  const handleAction = useCallback(() => {
    if (resolution) {
      onChange({type: 'mutation', patches: resolution.patches})
    }
  }, [onChange, resolution])

  if (!resolution) return null

  return (
    <Alert
      suffix={
        <Stack padding={2}>
          {resolution.action && (
            <Grid columns={[1, 2]} gap={1}>
              <Button mode="ghost" onClick={onIgnore} text="Ignore" />
              {!readOnly && (
                <Button onClick={handleAction} text={resolution.action} tone="caution" />
              )}
            </Grid>
          )}

          <Box padding={3}>
            {resolution.action && (
              <Text as="p" muted size={1}>
                NOTE: It’s generally safe to perform the action above, but if you are in doubt, get
                in touch with those responsible for configuring your studio.
              </Text>
            )}
          </Box>
        </Stack>
      }
      title={<>Invalid Portable Text Editor value</>}
    >
      <Stack space={3}>
        <Text as="p" muted size={1}>
          {resolution.description}
        </Text>

        <Card border overflow="auto" padding={2} tone="inherit">
          <Code language="json">{JSON.stringify(resolution.item, null, 2)}</Code>
        </Card>
      </Stack>
    </Alert>
  )
}
