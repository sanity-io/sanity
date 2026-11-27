import {type DocumentBadgeComponent} from 'sanity'
import {useTranslation} from 'sanity/i18n'

import {getPublishedId} from '../../core/util/draftUtils'
import {structureLocaleNamespace} from '../i18n'

/** @internal */
export const useSingletonBadge: DocumentBadgeComponent = ({id}) => {
  const {t} = useTranslation(structureLocaleNamespace)

  return {
    label: t('document.singleton.label'),
    title: t('document.singleton.details', {documentGroupId: getPublishedId(id)}),
  }
}

useSingletonBadge.displayName = 'SingletonBadge'
