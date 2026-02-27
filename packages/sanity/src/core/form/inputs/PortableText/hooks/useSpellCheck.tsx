import {useMemo} from 'react'

import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'

export function useSpellCheck(): boolean {
  const schemaTypes = usePortableTextMemberSchemaTypes()
  return useMemo(() => {
    // Chrome 96. has serious perf. issues with spellchecking
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1271918
    // This issue is verified fixed in Chrome 97.
    const spellCheckOption = schemaTypes.block.options?.spellCheck
    const isChrome96 =
      typeof navigator === 'undefined' ? false : /Chrome\/96/.test(navigator.userAgent)
    return spellCheckOption === undefined && isChrome96 ? false : spellCheckOption
  }, [schemaTypes])
}
