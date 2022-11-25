import {ColorTintKey} from '@sanity/color'
import {useColorScheme} from '../../studio'

interface DefaultTintKeysHookValue {
  bg: ColorTintKey
  border: ColorTintKey
  fg: ColorTintKey
}

/** @internal */
export function useDefaultTintKeys(): DefaultTintKeysHookValue {
  const {scheme} = useColorScheme()
  const isDarkScheme = scheme === 'dark'

  return {
    bg: isDarkScheme ? '900' : '100',
    border: isDarkScheme ? '700' : '300',
    fg: isDarkScheme ? '200' : '700',
  }
}
