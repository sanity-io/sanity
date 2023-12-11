import type {FlatNamespace, KeyPrefix, Namespace, TFunction} from 'i18next'
import type {$Tuple} from 'react-i18next/helpers'
import {type FallbackNs, useTranslation as useOriginalTranslation} from 'react-i18next'
import {maybeWrapT} from '../debug'

/**
 * Return value from the `useTranslate` hook
 *
 * @public
 */
export type UseTranslationResponse<Ns extends Namespace, KPrefix> = {
  /**
   * The translate function for the given namespace(s)
   */
  t: TFunction<Ns, KPrefix>
}

/**
 * Options for the `useTranslate` hook
 *
 * @public
 */
export interface UseTranslationOptions<KPrefix> {
  /**
   * @deprecated Avoid using this, it may be
   */
  keyPrefix?: KPrefix
  lng?: string
}

const translationOptionOverrides = {
  // We're manually forcing a re-render with the locale key in the LocaleProvider,
  // so we don't need to bind to the i18n instance for language change events.
  bindI18n: false as const,
}

/**
 * Returns a `t` translator function for the given namespace.
 *
 * If the given namespace is not loaded, it will trigger a suspense, and the component will resume
 * rendering once the namespace is loaded.
 *
 * @public
 */
export function useTranslation<
  Ns extends FlatNamespace | $Tuple<FlatNamespace> | undefined = undefined,
  KPrefix extends KeyPrefix<FallbackNs<Ns>> = undefined,
>(
  ns?: Ns,
  options?: UseTranslationOptions<KPrefix>,
): UseTranslationResponse<FallbackNs<Ns>, KPrefix> {
  const {t} = useOriginalTranslation(
    ns,
    options
      ? {keyPrefix: options.keyPrefix, lng: options.lng, ...translationOptionOverrides}
      : translationOptionOverrides,
  )

  return {t: maybeWrapT(t)}
}
