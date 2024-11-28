import {TransferIcon} from '@sanity/icons'
import {useMemo} from 'react'

import {type ActionComponent, type DocumentActionProps} from '../../../config'
import {useDiffViewRouter} from '../../../diffView/hooks/useDiffViewRouter'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../hooks/usePerspective'
import {releasesLocaleNamespace} from '../../i18n'

export const CompareVersionsAction: ActionComponent<DocumentActionProps> = ({type, version}) => {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {navigateDiffView} = useDiffViewRouter()
  const {perspectiveStack} = usePerspective()
  const isEnabled = version !== null && perspectiveStack.length > 1

  return useMemo(
    () => ({
      icon: TransferIcon,
      label: t('action.compare-versions'),
      group: ['paneActions'],
      disabled: !isEnabled,
      onHandle: () => {
        if (!isEnabled) {
          return
        }
        navigateDiffView({
          mode: 'version',
          nextDocument: {
            type,
            id: version._id,
          },
        })
      },
    }),
    [isEnabled, navigateDiffView, t, type, version?._id],
  )
}
