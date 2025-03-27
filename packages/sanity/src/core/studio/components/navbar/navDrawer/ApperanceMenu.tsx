import {CheckmarkIcon} from '@sanity/icons'
import {Card, Stack} from '@sanity/ui'

import {Button} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {type StudioColorScheme} from '../../../../theme'
import {useColorSchemeOptions} from '../../../colorScheme'

export function AppearanceMenu({setScheme}: {setScheme: (nextScheme: StudioColorScheme) => void}) {
  const {t} = useTranslation()
  // Subscribe to just what we need, if the menu isn't shown then we're not subscribed to these contexts
  const options = useColorSchemeOptions(setScheme, t)

  return (
    <Card borderTop flex="none" padding={2} overflow="auto">
      <Stack as="ul" gap={1}>
        {options.map(({icon, label, name, onSelect, selected, title}) => (
          <Stack key={name} as="li">
            <Button
              aria-label={label}
              icon={icon}
              iconRight={selected && <CheckmarkIcon />}
              justify="flex-start"
              mode="bleed"
              onClick={onSelect}
              selected={selected}
              size="large"
              text={title}
            />
          </Stack>
        ))}
      </Stack>
    </Card>
  )
}
