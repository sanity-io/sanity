import {type ColorHueKey, hues} from '@sanity/color'
import {AddIcon, ChevronDownIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Button, rgba} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback, useMemo, useState} from 'react'
import {useTranslation} from 'sanity'
import styled, {css} from 'styled-components'

import {MenuItem} from '../../../../../ui-components'
import {BundlesMenu} from '../../../../bundles/components/BundlesMenu'
import {BundleDetailsDialog} from '../../../../bundles/components/dialog/BundleDetailsDialog'
import {usePerspective} from '../../../../bundles/hooks/usePerspective'
import {useBundles} from '../../../../store/bundles'

const SpecialButton = styled(Button)((props) => {
  const {color} = getTheme_v2(props.theme)
  const hue: ColorHueKey = props.$hue

  return css`
    --card-bg-color: ${rgba(hues[hue][color._dark ? 700 : 300].hex, 0.2)};
    --card-fg-color: ${hues[hue][color._dark ? 400 : 600].hex};
    --card-icon-color: ${hues[hue][color._dark ? 400 : 600].hex};
    background-color: var(--card-bg-color);
    opacity: ${props.$isDisabled ? 0.5 : 1};

    &:not([data-disabled='true']) {
      &:hover,
      &:active {
        --card-bg-color: ${rgba(hues[hue][color._dark ? 700 : 300].hex, 0.2)};
        --card-fg-color: ${hues[hue][color._dark ? 400 : 600].hex};
        --card-icon-color: ${hues[hue][color._dark ? 400 : 600].hex};
        background-color: var(--card-bg-color);
        opacity: ${props.$isDisabled ? 0.5 : 1};
      }
    }
  `
})

export function GlobalPerspectiveMenu(): JSX.Element {
  const {data: bundles, loading, deletedBundles} = useBundles()

  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)

  const {currentGlobalBundle} = usePerspective()
  const {title, hue, icon} = currentGlobalBundle
  const {t} = useTranslation()

  /* create new bundle */
  const handleCreateBundleClick = useCallback(() => {
    setCreateBundleDialogOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setCreateBundleDialogOpen(false)
  }, [])

  const menuBundles = useMemo(
    () => [...(bundles || []), ...Object.values(deletedBundles)],
    [bundles, deletedBundles],
  )

  const bundleMenuButton = useMemo(
    () => (
      <SpecialButton
        $hue={hue}
        mode="ghost"
        padding={2}
        space={2}
        icon={icon}
        text={title}
        iconRight={ChevronDownIcon}
      />
    ),
    [hue, icon, title],
  )

  const bundleMenuActions = useMemo(
    () => (
      <MenuItem icon={AddIcon} onClick={handleCreateBundleClick} text={t('bundle.action.create')} />
    ),
    [handleCreateBundleClick, t],
  )

  return (
    <>
      <BundlesMenu
        button={bundleMenuButton}
        bundles={menuBundles}
        loading={loading}
        actions={bundleMenuActions}
      />

      {createBundleDialogOpen && (
        <BundleDetailsDialog onCancel={handleClose} onSubmit={handleClose} />
      )}
    </>
  )
}
