import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {Card} from '@sanity/ui'
import {VStack} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {type StudioThemeColorSchemeKey} from '../../../../theme'
import {useColorSchemeOptions} from '../../../colorScheme'

export function AppearanceMenu({
  setScheme,
}: {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  setScheme: (nextScheme: StudioThemeColorSchemeKey) => void
}) {
  const {t} = useTranslation()
  // Subscribe to just what we need, if the menu isn't shown then we're not subscribed to these contexts
  const options = useColorSchemeOptions(setScheme, t)

  return (
    <Card borderTop flex="none" padding={2} overflow="auto">
      <VStack as="ul" gap={1}>
        {options.map(({icon, label, name, onSelect, selected, title}) => (
          <VStack key={name} as="li">
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
          </VStack>
        ))}
      </VStack>
    </Card>
  )
}
