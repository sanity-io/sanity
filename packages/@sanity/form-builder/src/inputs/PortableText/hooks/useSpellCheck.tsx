import {usePortableTextEditor} from '@sanity/portable-text-editor'
import {useMemo} from 'react'

export function useSpellcheck(): boolean {
  const editor = usePortableTextEditor()
  return useMemo(() => {
    // Chrome 96. has serious perf. issues with spellchecking
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1271918
    // TODO: check up on the status of this.
    const spellCheckOption = editor.portableTextFeatures.types.block.options?.spellCheck
    const isChrome96 =
      typeof navigator === 'undefined' ? false : /Chrome\/96/.test(navigator.userAgent)
    return spellCheckOption === undefined && isChrome96 === true ? false : spellCheckOption
  }, [editor])
}
