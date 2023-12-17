import {CheckmarkIcon} from '@sanity/icons'
import {MenuDivider} from '@sanity/ui'
import {MenuItem} from '../../../../ui-components'
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
    <>
      <MenuDivider />

      {options.map(({icon, label, name, onSelect, selected, title}) => (
        <MenuItem
          key={name}
          aria-label={label}
          icon={icon}
          onClick={onSelect}
          pressed={selected}
          text={title}
          iconRight={selected && <CheckmarkIcon />}
        />
      ))}
    </>
  )
}
