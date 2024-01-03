import {CheckmarkIcon} from '@sanity/icons'
import {Card, Stack} from '@sanity/ui'
import {Button} from '../../../../../ui-components'
import {type StudioThemeColorSchemeKey} from '../../../../theme'
import {useTranslation} from '../../../../i18n'
import {useColorSchemeOptions} from '../../../colorScheme'

export function AppearanceMenu({
  setScheme,
}: {
  setScheme: (nextScheme: StudioThemeColorSchemeKey) => void
}) {
  const {t} = useTranslation()
  // Subscribe to just what we need, if the menu isn't shown then we're not subscribed to these contexts
  const options = useColorSchemeOptions(setScheme, t)

  return (
    <Card borderTop flex="none" padding={2} overflow="auto">
      <Stack as="ul" space={1}>
        {options.map(({icon, label, name, onSelect, selected, title}) => (
          <Stack as="li" key={name}>
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
