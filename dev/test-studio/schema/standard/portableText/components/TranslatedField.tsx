import {StringFieldProps, useTranslation} from 'sanity'

export function TranslatedField(props: StringFieldProps) {
  const {t} = useTranslation('testStudio')
  return props.renderDefault({...props, title: t('translatedFieldTitle') ?? undefined})
}
