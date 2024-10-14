/* eslint-disable i18next/no-literal-string */
import {AddIcon} from '@sanity/icons'
import {Box, Text} from '@sanity/ui'
import {memo, useState} from 'react'

import {Button, Tooltip} from '../../../../../../ui-components'

export const AddVersionButton = memo(function AddVersionButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Box flex="none">
        {/* @todo add and update translations */}
        <Tooltip content={<Text size={1}>Create version</Text>} portal>
          <Button
            icon={AddIcon}
            mode="bleed"
            onClick={() => setOpen(true)}
            padding={2}
            radius="full"
            selected={open}
            tooltipProps={{content: 'Create version'}}
          />
        </Tooltip>
      </Box>
    </>
  )
})
