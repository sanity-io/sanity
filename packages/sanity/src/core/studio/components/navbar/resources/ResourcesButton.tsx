import React, {useCallback, useState} from 'react'
import {HelpCircleIcon} from '@sanity/icons'
import {Button, MenuButton} from '@sanity/ui'
import {useColorScheme} from '../../../colorScheme'
import {ResourcesMenu} from './ResourcesMenu'
import {useGetHelpResources} from './helper-functions/hooks'

export function ResourcesButton() {
  const {scheme} = useColorScheme()

  const {value, error, isLoading} = useGetHelpResources()
  const [open, setOpen] = useState<boolean>(false)

  const handleOpen = useCallback(() => setOpen(!open), [open])

  return (
    <>
      <MenuButton
        button={<Button icon={HelpCircleIcon} onClick={handleOpen} mode="bleed" fontSize={2} />}
        id="menu-button-resources"
        menu={<ResourcesMenu value={value} error={error} isLoading={isLoading} />}
        popoverScheme={scheme}
        placement="bottom"
        popover={{constrainSize: true, portal: true}}
      />
    </>
  )
}
