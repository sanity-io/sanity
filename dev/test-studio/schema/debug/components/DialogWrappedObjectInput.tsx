'use client'

import {EditIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Stack, Text} from '@sanity/ui'
import {useState} from 'react'
import {type InputProps} from 'sanity'

export function ModalObjectInput(props: InputProps) {
  const {value, renderDefault, schemaType, readOnly} = props
  const [open, setOpen] = useState(false)

  const _title = (typeof schemaType?.title === 'string' ? schemaType.title : undefined) ?? 'Edit'

  const hasValue = value !== undefined && value !== null

  return (
    <Stack space={3}>
      <Card padding={3} radius={2} shadow={1} tone="transparent">
        <Stack space={3}>
          <Box>
            {hasValue && (
              <Text size={1} muted>
                Configured
              </Text>
            )}
          </Box>
          <Button
            icon={EditIcon}
            mode="ghost"
            onClick={() => setOpen(true)}
            text={hasValue ? 'Edit' : 'Configure'}
            disabled={readOnly}
          />
        </Stack>
      </Card>

      {open && (
        <Dialog
          open
          id={'modal-object-input'}
          header={_title}
          onClose={() => setOpen(false)}
          width={4}
        >
          <Box padding={4}>{renderDefault(props)}</Box>
        </Dialog>
      )}
    </Stack>
  )
}
