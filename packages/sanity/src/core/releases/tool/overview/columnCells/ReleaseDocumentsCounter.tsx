import {Text} from '@sanity/ui'
import {useMemo} from 'react'

import {Translate, useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'

type Props = {
  documentCount: number | undefined
}

export const ReleaseDocumentsCounter = ({documentCount}: Props) => {
  const {t} = useTranslation(releasesLocaleNamespace)

  const count = useMemo(() => {
    if (!documentCount) return '-'

    return <Translate t={t} i18nKey="document-count" values={{count: documentCount}} />
  }, [documentCount, t])

  return (
    <Text muted size={1}>
      {count}
    </Text>
  )
}
