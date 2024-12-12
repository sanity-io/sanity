import {LaunchIcon} from '@sanity/icons'
import {type ForwardedRef, forwardRef} from 'react'

import {Button} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {createLocaleNamespace} from '../i18n'
import {createUserDocumentationUrl} from './constants'

export const CreateLearnMoreButton = forwardRef(function CreateLearnMoreButton(
  props,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const {t} = useTranslation(createLocaleNamespace)
  return (
    <Button
      as={'a'}
      href={createUserDocumentationUrl}
      target="_blank"
      ref={ref}
      text={t('start-in-create-dialog.cta.learn-more')}
      mode="bleed"
      tone="primary"
      iconRight={LaunchIcon}
    />
  )
})
