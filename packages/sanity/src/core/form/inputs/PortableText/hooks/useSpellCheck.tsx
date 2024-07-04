import {usePortableTextEditor} from '@portabletext/editor'
import {useMemo} from 'react'

export function useSpellCheck(): boolean {
  const editor = usePortableTextEditor()
  return useMemo(() => {
    // Chrome 96. has serious perf. issues with spellchecking
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1271918
    // This issue is verified fixed in Chrome 97.
    const spellCheckOption = editor.schemaTypes.block.options?.spellCheck
    const isChrome96 =
      typeof navigator === 'undefined' ? false : /Chrome\/96/.test(navigator.userAgent)
    return spellCheckOption === undefined && isChrome96 === true ? false : spellCheckOption
  }, [editor])
}
