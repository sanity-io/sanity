/** One id per browser tab, so a remote can aim its commands at the tab it was opened from (`?tab=`). */
export const TAB_ID = `tab-${Math.random().toString(36).slice(2, 8)}`
