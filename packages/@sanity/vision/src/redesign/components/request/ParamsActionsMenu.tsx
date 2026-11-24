import {CodeIcon} from '@sanity/icons/Code'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {PackageIcon} from '@sanity/icons/Package'
import {Button} from '@sanity/ui'
import {Menu, MenuButton, MenuItem, type MenuItemProps} from '@sanity/ui/menu'
import {Tooltip} from '@sanity/ui/tooltip'
import {useCallback, useMemo, useState} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Text} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type VisionTab} from '../../store/types'
import {usePendingEdits} from '../../store/VisionActorContext'
import {findParamNames} from '../../util/paramInference'
import * as styles from '../redesign.module.css'
import {type TypesExportFormat} from '../response/ExportTypesDialog'
import {ExportParamsTypesDialog} from './ExportParamsTypesDialog'

export interface ParamsActionsMenuProps {
  tab: VisionTab
}

/** The "More actions" menu next to Copy in the params toolbar: types for the query's params */
export function ParamsActionsMenu({tab}: ParamsActionsMenuProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const pendingEdits = usePendingEdits()
  const [exportFormat, setExportFormat] = useState<TypesExportFormat | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const hasParams = useMemo(() => findParamNames(tab.query).length > 0, [tab.query])
  const moreActions = t('vision.actions.more')

  const openExport = useCallback(
    (format: TypesExportFormat) => {
      // A query edit still in the debounce is what the types are for
      pendingEdits.commit()
      setExportFormat(format)
    },
    [pendingEdits],
  )

  return (
    <>
      <Tooltip
        animate
        content={
          <Text as="div" size={1}>
            {moreActions}
          </Text>
        }
        // The tooltip would cover the menu it names
        disabled={menuOpen}
        placement="top"
        portal
      >
        {/* The tooltip attaches to this wrapper, which leaves the button's ref to the menu */}
        <span className={styles.tooltipTarget} data-testid="vision-params-menu-tooltip-target">
          <MenuButton
            button={
              <Button
                aria-label={t('vision.params.actions')}
                data-testid="vision-params-menu-button"
                fontSize={1}
                icon={EllipsisHorizontalIcon}
                mode="bleed"
                padding={2}
              />
            }
            id={`vision-params-menu-${tab.id}`}
            menu={
              <Menu data-testid="vision-params-menu">
                <ExportMenuItem
                  data-testid="vision-params-export-typescript"
                  disabled={!hasParams}
                  icon={CodeIcon}
                  onClick={() => openExport('typescript')}
                  text={t('vision.params.export-typescript')}
                />
                <ExportMenuItem
                  data-testid="vision-params-export-zod"
                  disabled={!hasParams}
                  icon={PackageIcon}
                  onClick={() => openExport('zod')}
                  text={t('vision.params.export-zod')}
                />
              </Menu>
            }
            onClose={() => setMenuOpen(false)}
            onOpen={() => setMenuOpen(true)}
            popover={{animate: true, portal: true, placement: 'bottom-end'}}
          />
        </span>
      </Tooltip>
      {exportFormat && (
        <ExportParamsTypesDialog
          format={exportFormat}
          onClose={() => setExportFormat(null)}
          query={tab.query}
        />
      )}
    </>
  )
}

/**
 * A menu item that says why it is disabled. A disabled button gets no pointer events, so the
 * tooltip attaches to a wrapper the item lets the pointer through to
 */
function ExportMenuItem(
  props: Pick<MenuItemProps, 'disabled' | 'icon' | 'text'> & {
    'data-testid': string
    'onClick': () => void
  },
) {
  const {t} = useTranslation(visionLocaleNamespace)
  if (!props.disabled) return <MenuItem {...props} />
  return (
    <Tooltip
      animate
      content={
        <Text as="div" size={1}>
          {t('vision.params.export-unavailable')}
        </Text>
      }
      placement="left"
      portal
    >
      <div className={styles.disabledMenuItemTarget}>
        <MenuItem {...props} />
      </div>
    </Tooltip>
  )
}
