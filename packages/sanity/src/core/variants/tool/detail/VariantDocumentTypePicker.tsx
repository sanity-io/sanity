import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {useMemo} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {getSearchableTypes} from '../../../search/common/getSearchableTypes'
import {variantsLocaleNamespace} from '../../i18n'

/**
 * Picks the document type the Missing half is computed for. `undefined` means the default: the
 * types that already have a version for the definition.
 *
 * Which types a definition applies to is an open product decision (SAPP-4171). Until it is
 * decided, the editor picks, from the same document types the "Add document" search offers.
 *
 * @internal
 */
export function VariantDocumentTypePicker({
  selectedType,
  onSelect,
}: {
  selectedType: string | undefined
  onSelect: (type: string | undefined) => void
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const schema = useSchema()
  const documentTypes = useMemo(
    () =>
      getSearchableTypes(schema).toSorted((left, right) =>
        (left.title ?? left.name).localeCompare(right.title ?? right.name),
      ),
    [schema],
  )
  const selectedSchemaType = selectedType ? schema.get(selectedType) : undefined

  return (
    <MenuButton
      id="variant-missing-type-picker"
      button={
        <Button
          data-testid="variant-missing-type-picker"
          iconRight={ChevronDownIcon}
          mode="ghost"
          text={
            selectedType
              ? (selectedSchemaType?.title ?? selectedType)
              : t('detail.missing.type-picker.default')
          }
        />
      }
      menu={
        <Menu>
          <MenuItem
            iconRight={selectedType ? undefined : CheckmarkIcon}
            onClick={() => onSelect(undefined)}
            pressed={!selectedType}
            text={t('detail.missing.type-picker.default')}
          />
          <MenuDivider />
          {documentTypes.map((type) => (
            <MenuItem
              key={type.name}
              iconRight={selectedType === type.name ? CheckmarkIcon : undefined}
              onClick={() => onSelect(type.name)}
              pressed={selectedType === type.name}
              text={type.title ?? type.name}
            />
          ))}
        </Menu>
      }
      popover={{placement: 'bottom-end', portal: true}}
    />
  )
}
