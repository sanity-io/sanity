import {AddIcon} from '@sanity/icons'
import {type ArraySchemaType} from '@sanity/types'
import {Grid, Menu} from '@sanity/ui'
import {useCallback, useId} from 'react'

import {
  Button,
  MenuButton,
  type MenuButtonProps,
  MenuItem,
  Tooltip,
} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {type ArrayInputFunctionsProps, type ObjectItem} from '../../../types'
import {FullInsertMenuButton} from './FullInsertMenu'
import {getSchemaTypeIcon} from './getSchemaTypeIcon'

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  portal: true,
  fallbackPlacements: ['top', 'bottom'],
}

/**
 * @hidden
 * @beta */
export function ArrayOfObjectsFunctions<
  Item extends ObjectItem,
  SchemaType extends ArraySchemaType,
>(props: ArrayInputFunctionsProps<Item, SchemaType>) {
  const {schemaType, readOnly, children, onValueCreate, onItemAppend} = props
  const menuButtonId = useId()
  const {t} = useTranslation()

  const insertItem = useCallback(
    (itemType: any) => {
      const item = onValueCreate(itemType)

      onItemAppend(item)
    },
    [onValueCreate, onItemAppend],
  )

  const handleAddBtnClick = useCallback(() => {
    insertItem(schemaType.of[0])
  }, [schemaType, insertItem])

  // If we have more than a single type candidate, we render a menu, so the button might show
  // "Add item..." instead of simply "Add item", to indicate that further choices are available.
  const addItemI18nKey =
    schemaType.of.length > 1
      ? 'inputs.array.action.add-item-select-type'
      : 'inputs.array.action.add-item'

  const insertButtonProps: React.ComponentProps<typeof Button> = {
    icon: AddIcon,
    mode: 'ghost',
    size: 'large',
    text: t(addItemI18nKey),
  }

  if (readOnly) {
    return (
      <Tooltip portal content={t('inputs.array.read-only-label')}>
        <Grid>
          <Button {...insertButtonProps} data-testid="add-read-object-button" disabled />
        </Grid>
      </Tooltip>
    )
  }

  if (schemaType.of.length === 1) {
    return (
      <Container>
        <Button
          {...insertButtonProps}
          onClick={handleAddBtnClick}
          data-testid="add-single-object-button"
        />
        {children}
      </Container>
    )
  }

  if (schemaType.options?.insertMenu?.layout === 'full') {
    return (
      <Container>
        <FullInsertMenuButton
          groups={schemaType.options.insertMenu.groups}
          insertButtonProps={insertButtonProps}
          schemaTypes={schemaType.of}
          onSelect={insertItem}
          views={schemaType.options.insertMenu.views}
        />
        {children}
      </Container>
    )
  }

  return (
    <Container>
      <MenuButton
        button={<Button {...insertButtonProps} data-testid="add-multiple-object-button" />}
        id={menuButtonId || ''}
        menu={
          <Menu>
            {schemaType.of.map((memberDef, i) => {
              return (
                <MenuItem
                  key={i}
                  text={memberDef.title || memberDef.type?.name}
                  onClick={() => insertItem(memberDef)}
                  icon={getSchemaTypeIcon(memberDef)}
                />
              )
            })}
          </Menu>
        }
        popover={POPOVER_PROPS}
      />
      {children}
    </Container>
  )
}

function Container(props: React.PropsWithChildren<unknown>) {
  return (
    <Grid gap={1} style={{gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))'}}>
      {props.children}
    </Grid>
  )
}
