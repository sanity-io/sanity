import {ChevronDownIcon, ImageIcon, SearchIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'
import {Menu} from '@sanity/ui'
import {startCase} from 'lodash'
import {type ForwardedRef, forwardRef, memo} from 'react'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {ASSET_IMAGE_MENU_POPOVER} from './constants'
import {type BaseImageInputProps} from './types'

function ImageInputBrowserComponent(
  props: Pick<BaseImageInputProps, 'assetSources' | 'readOnly' | 'directUploads' | 'id'> & {
    setMenuOpen: (isOpen: boolean) => void
    handleSelectImageFromAssetSource: (source: AssetSource) => void
  },
  forwardedRef: ForwardedRef<HTMLButtonElement>,
) {
  const {assetSources, readOnly, directUploads, id, setMenuOpen, handleSelectImageFromAssetSource} =
    props
  const {t} = useTranslation()

  if (assetSources && assetSources.length === 0) return null

  if (assetSources && assetSources.length > 1 && !readOnly && directUploads) {
    return (
      <MenuButton
        id={`${id}_assetImageButton`}
        ref={forwardedRef}
        button={
          <Button
            data-testid="file-input-multi-browse-button"
            icon={SearchIcon}
            iconRight={ChevronDownIcon}
            mode="bleed"
            text={t('inputs.image.browse-menu.text')}
          />
        }
        menu={
          <Menu>
            {assetSources.map((assetSource) => {
              return (
                <MenuItem
                  key={assetSource.name}
                  text={
                    (assetSource.i18nKey ? t(assetSource.i18nKey) : assetSource.title) ||
                    startCase(assetSource.name)
                  }
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={() => {
                    setMenuOpen(false)
                    handleSelectImageFromAssetSource(assetSource)
                  }}
                  icon={assetSource.icon || ImageIcon}
                  disabled={readOnly}
                  data-testid={`file-input-browse-button-${assetSource.name}`}
                />
              )
            })}
          </Menu>
        }
        popover={ASSET_IMAGE_MENU_POPOVER}
      />
    )
  }
}
export const ImageInputBrowser = memo(forwardRef(ImageInputBrowserComponent))
