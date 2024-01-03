/* eslint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
import React, {useCallback, useState, useId} from 'react'
import {Stack, Text} from '@sanity/ui'
import {WarningOutlineIcon} from '@sanity/icons'
import {Dialog} from '../../../../../ui-components'
import {useSchema} from '../../../../hooks'
import {SchemaProblemGroups} from '../../../screens/schemaErrors/SchemaProblemGroups'
import {useColorScheme} from '../../../colorScheme'
import {StatusButton} from '../../../../components'
import {useTranslation} from '../../../../i18n'

export function ConfigIssuesButton() {
  const schema = useSchema()
  const groupsWithWarnings =
    schema._validation?.filter((group) =>
      group.problems.some((problem) => problem.severity === 'warning'),
    ) || []

  // get root scheme
  const {scheme} = useColorScheme()
  const {t} = useTranslation()

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
      <StatusButton
        icon={WarningOutlineIcon}
        mode="bleed"
        onClick={handleOpen}
        ref={setButtonElement}
        selected={isDialogOpen}
        tone="caution"
        tooltipProps={{scheme, content: t('configuration-issues.button.tooltip')}}
      />

      {isDialogOpen && (
        <Dialog
          header="Configuration issues"
          width={2}
          onClickOutside={handleClose}
          onClose={handleClose}
          // force root scheme here to "break out" of the navbar's dark scheme
          scheme={scheme}
          id={dialogId}
        >
          <Stack space={4}>
            <Stack space={3}>
              <Text as="h2" size={1} weight="medium">
                Found {groupsWithWarnings.length} schema warnings
              </Text>{' '}
              <Text muted size={1}>
                Configuration checks are only performed during development and will not be visible
                in production builds
              </Text>
            </Stack>
            <SchemaProblemGroups problemGroups={groupsWithWarnings} />
          </Stack>
        </Dialog>
      )}
    </>
  )
}
