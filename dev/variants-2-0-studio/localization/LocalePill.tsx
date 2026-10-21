import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {TranslateIcon} from '@sanity/icons/Translate'
import {useLanguageFilterStudioContext} from '@sanity/language-filter'
import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'

import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'

// The locale pill in the navbar (a third pill, after Drafts and Variants): which languages the field-level documents show. Neither plugin draws it;
// it is drawn here from the language filter's own state (`useLanguageFilterStudioContext`), the same state its button in the document header
// reads and writes. "All (4)" when every language is shown, "2 of 4" when some are hidden.

const FLAGS: Record<string, string> = {en: '🇬🇧', da: '🇩🇰', sv: '🇸🇪', nb: '🇳🇴'}
const HEIGHT = 33

export function LocalePill() {
  const {options, selectedLanguageIds, setSelectedLanguageIds} = useLanguageFilterStudioContext()
  const languages = options.supportedLanguages
  const all = languages.every((language) => selectedLanguageIds.includes(language.id))
  const label = all
    ? `All (${languages.length})`
    : `${languages.filter((l) => selectedLanguageIds.includes(l.id)).length} of ${languages.length}`
  const toggle = (id: string) =>
    setSelectedLanguageIds(
      selectedLanguageIds.includes(id)
        ? selectedLanguageIds.filter((selected) => selected !== id)
        : [...selectedLanguageIds, id],
    )

  return (
    <div data-testid="locale-pill" style={{display: 'inline-flex'}}>
      <MenuButton
        button={
          <Card border radius="full" style={{height: HEIGHT, overflow: 'hidden'}}>
            <Button
              data-testid="locale-pill-button"
              icon={TranslateIcon}
              iconRight={ChevronDownIcon}
              mode="bleed"
              style={{
                borderRadius: 0,
                height: HEIGHT - 2,
                minHeight: HEIGHT - 2,
                paddingLeft: 14,
                paddingRight: 4,
              }}
              text={label}
              tooltipProps={null}
            />
          </Card>
        }
        id="locale-pill-menu"
        menu={
          <Menu padding={1}>
            <MenuItem
              data-testid="locale-all"
              icon={EarthGlobeIcon}
              onClick={() => setSelectedLanguageIds(languages.map((language) => language.id))}
              pressed={all}
              text="Show all locales"
            />
            {languages.map((language) => (
              <MenuItem
                data-testid={`locale-${language.id}`}
                iconRight={selectedLanguageIds.includes(language.id) ? CheckmarkIcon : undefined}
                key={language.id}
                onClick={() => toggle(language.id)}
                text={`${FLAGS[language.id] ?? ''} ${language.title}`.trim()}
              />
            ))}
          </Menu>
        }
        popover={{placement: 'bottom-end', portal: true}}
      />
    </div>
  )
}
