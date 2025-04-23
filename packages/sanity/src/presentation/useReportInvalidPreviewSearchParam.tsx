import {useToast} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {useEffect} from 'react'
import {Translate, useTranslation} from 'sanity'
import {useRouter} from 'sanity/router'

import {presentationLocaleNamespace} from './i18n'
import {type PreviewUrlRef} from './machines/preview-url'

export function useReportInvalidPreviewSearchParam(previewUrlRef: PreviewUrlRef): void {
  const {t} = useTranslation(presentationLocaleNamespace)
  const {push: pushToast} = useToast()
  const router = useRouter()
  const routerSearchParams = new URLSearchParams(router.state._searchParams)
  const previewSearchParam = routerSearchParams.get('preview')

  const allowOrigins = useSelector(previewUrlRef, (state) => state.context.allowOrigins)
  const currentOrigin = useSelector(previewUrlRef, (state) => state.context.previewUrl?.origin)
  useEffect(() => {
    if (!Array.isArray(allowOrigins) || !previewSearchParam || !currentOrigin) return
    const nextOrigin = new URL(previewSearchParam, currentOrigin).origin
    if (!allowOrigins.some((pattern) => pattern.test(nextOrigin))) {
      pushToast({
        closable: true,
        id: `presentation-iframe-origin-mismatch-${nextOrigin}`,
        status: 'error',
        duration: Infinity,
        title: t('preview-search-param.configuration.error.title'),
        description: (
          <Translate
            t={t}
            i18nKey="preview-search-param.configuration.error.description"
            components={{Code: 'code'}}
            values={{
              previewSearchParam,
              blockedOrigin: nextOrigin,
            }}
          />
        ),
      })
    }
  }, [allowOrigins, currentOrigin, previewSearchParam, pushToast, t])
}
