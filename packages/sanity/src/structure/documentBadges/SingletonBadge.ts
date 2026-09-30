import {getPublishedId, useTranslation, type DocumentBadgeComponent} from 'sanity'

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
