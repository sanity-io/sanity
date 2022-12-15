import i18n from 'i18next'
import k from './../../../../../i18n/keys'
import React, {useCallback, useState, useId} from 'react'
import {Box, Button, Dialog, Heading, Stack, Text, Tooltip} from '@sanity/ui'
import {WarningOutlineIcon} from '@sanity/icons'
import {useSchema} from '../../../../hooks'
import {SchemaProblemGroups} from '../../../screens/schemaErrors/SchemaProblemGroups'
import {useColorScheme} from '../../../colorScheme'

export function ConfigIssuesButton() {
  const schema = useSchema()
  const groupsWithWarnings =
    schema._validation?.filter((group) =>
      group.problems.some((problem) => problem.severity === 'warning')
    ) || []

  // get root scheme
  const {scheme} = useColorScheme()

  const dialogId = useId()

  const [isDialogOpen, setDialogOpen] = useState(false)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const handleOpen = useCallback(() => setDialogOpen(true), [])

  const handleClose = useCallback(() => {
    setDialogOpen(false)

    if (buttonElement) {
      buttonElement.focus()
    }
  }, [buttonElement])

  if (groupsWithWarnings.length === 0) {
    return null
  }

  return (
    <>
      <Tooltip
        content={
          <Box padding={2}>
            <Text size={1}>{i18n.t(k.FOUND_CONFIGURATION_ISSUES)}</Text>
          </Box>
        }
        placement="bottom"
        portal
        scheme={scheme}
      >
        <Box>
          <Button
            icon={WarningOutlineIcon}
            mode="bleed"
            tone="caution"
            onClick={handleOpen}
            ref={setButtonElement}
            selected={isDialogOpen}
          />
        </Box>
      </Tooltip>

      {isDialogOpen && (
        <Dialog
          header={
            <Stack space={3}>
              <Text weight="semibold">{i18n.t(k.CONFIGURATION_ISSUES)}</Text>
              <Text muted size={1}>
                {i18n.t(k.CONFIGURATION_CHECKS_ARE_ONLY)}
              </Text>
            </Stack>
          }
          width={2}
          onClickOutside={handleClose}
          onClose={handleClose}
          // force root scheme here to "break out" of the navbar's dark scheme
          scheme={scheme}
          id={dialogId}
        >
          <Stack space={4} padding={4}>
            <Heading as="h2" size={1}>
              {i18n.t(k.FOUND)} {groupsWithWarnings.length} {i18n.t(k.SCHEMA_WARNINGS)}
            </Heading>
            <SchemaProblemGroups problemGroups={groupsWithWarnings} />
          </Stack>
        </Dialog>
      )}
    </>
  )
}
