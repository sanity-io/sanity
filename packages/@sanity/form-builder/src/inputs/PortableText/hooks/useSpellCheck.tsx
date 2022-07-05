import {usePortableTextEditor} from '@sanity/portable-text-editor'
import {useMemo} from 'react'

declare global {
  interface Window {
    chrome?: any
  }
}

export function useSpellcheck(): boolean {
  const editor = usePortableTextEditor()
  return useMemo(() => {
    let spellCheckOption = editor.portableTextFeatures.types.block.options?.spellCheck
    // Slate will set spellcheck for false when undefined with Chrome browsers
    const isChrome = typeof window === 'undefined' ? false : !!window.chrome
    if (spellCheckOption === undefined && isChrome) {
      spellCheckOption = true
    }
    // Chrome 96. has serious perf. issues with spellchecking
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1271918
    // This issue is verified fixed in Chrome 97.
    // Disable spellcheck for those browsers.
    const isChrome96 =
      typeof navigator === 'undefined' ? false : /Chrome\/96/.test(navigator.userAgent)
    return spellCheckOption === undefined && isChrome96 === true ? false : spellCheckOption
  }, [editor])
}
