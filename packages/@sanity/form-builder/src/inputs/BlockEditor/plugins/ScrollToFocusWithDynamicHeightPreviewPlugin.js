// @flow

// This plugin tries to scroll the focusblock into view for 2 seconds after the editor is mounted.
// This makes it active long enough to bypass any quirks regarding scollheight as the
// dynamic height preview are loading.

export default function ScrollToFocusWithDynamicHeightPreviewPlugin(
  scrollContainer: ElementRef<any>,
  scrollIntoView: void => void
) {
  let isActive = true
  setTimeout(() => {
    isActive = false
  }, 1000)
  return {
    onSelect(selection: any, editor: any, next: void => void) {
      if (isActive && editor.value.focusBlock) {
        scrollIntoView(editor.value.focusBlock, {behavior: 'instant'})
      }
      return next()
    }
  }
}
