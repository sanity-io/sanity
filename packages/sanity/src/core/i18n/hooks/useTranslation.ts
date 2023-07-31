import type {FlatNamespace, KeyPrefix, Namespace, TFunction} from 'i18next'
import type {$Tuple} from 'react-i18next/helpers'
import {type FallbackNs, useTranslation as useOriginalTranslation} from 'react-i18next'

/**
 * @alpha
 * @hidden
 */
export type UseTranslationResponse<Ns extends Namespace, KPrefix> = {
  t: TFunction<Ns, KPrefix>
}

/**
 * @alpha
 * @hidden
 */
export interface UseTranslationOptions<KPrefix> {
  keyPrefix?: KPrefix
  lng?: string
}

const translationOptionOverrides = {
  // We're manually forcing a re-render with the locale key in the LocaleProvider,
  // so we don't need to bind to the i18n instance for language change events.
  bindI18n: false as const,
}

/**
 * @alpha
 * @hidden
 * @todo limit the options for `t` to something we want to support long term
 */
export function useTranslation<
  Ns extends FlatNamespace | $Tuple<FlatNamespace> | undefined = undefined,
  KPrefix extends KeyPrefix<FallbackNs<Ns>> = undefined
>(
  ns?: Ns,
  options?: UseTranslationOptions<KPrefix>
): UseTranslationResponse<FallbackNs<Ns>, KPrefix> {
  const {t} = useOriginalTranslation(
    ns,
    options
      ? {keyPrefix: options.keyPrefix, lng: options.lng, ...translationOptionOverrides}
      : translationOptionOverrides
  )

  return {t}
}
