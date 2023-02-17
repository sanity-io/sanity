import React from 'react'
import {Box, Button, Label, Stack, useRootTheme} from '@sanity/ui'
import {CheckmarkIcon, DesktopIcon, MoonIcon, SunIcon} from '@sanity/icons'
import styled from 'styled-components'
import {useColorScheme} from '../../../colorScheme'
import {StudioTheme} from '../../../../theme'

const StyledButton = styled(Button)`
  cursor: pointer;
`

export function Appearance() {
  const {scheme, setScheme, clearStoredScheme, usingSystemScheme} = useColorScheme()
  const theme = useRootTheme().theme as StudioTheme

  if (!theme?.__legacy)
    return (
      <Stack as="ul" space={[1, 2]}>
        <Box padding={2}>
          <Label size={1} muted>
            Appearance
          </Label>
        </Box>

        <Stack as="li" key="System">
          <StyledButton
            aria-label="Use system appearance"
            icon={DesktopIcon}
            iconRight={usingSystemScheme && <CheckmarkIcon />}
            justify="flex-start"
            mode="bleed"
            selected={usingSystemScheme}
            onClick={clearStoredScheme}
            tabIndex={0}
            text="System"
          />
        </Stack>
        <Stack as="li" key="Dark">
          <StyledButton
            aria-label="Use dark appearance"
            icon={MoonIcon}
            iconRight={scheme === 'dark' && !usingSystemScheme && <CheckmarkIcon />}
            justify="flex-start"
            mode="bleed"
            tabIndex={0}
            selected={scheme === 'dark' && !usingSystemScheme}
            onClick={() => setScheme('dark')}
            text="Dark"
          />
        </Stack>

        <Stack as="li" key="Light">
          <StyledButton
            aria-label="Use light appearance"
            icon={SunIcon}
            mode="bleed"
            tabIndex={0}
            justify="flex-start"
            onClick={() => setScheme('light')}
            selected={scheme === 'light' && !usingSystemScheme}
            iconRight={scheme === 'light' && !usingSystemScheme && <CheckmarkIcon />}
            text="Light"
          />
        </Stack>
      </Stack>
    )
  return null
}
