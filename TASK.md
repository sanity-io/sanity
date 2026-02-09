# Task: Link to Field Feature

## Goal
Implement a "Link to field" field action that copies a deep link URL pointing to a specific field within a document, enabling users to share direct links to specific fields for collaboration and support workflows.

## Requirements
- Add a field action in the overflow menu alongside Copy/Paste
- Copy URL that deep links to the exact field
- Navigate to the correct field and scroll it into view
- Handle fields inside tab groups (activate correct group)
- Work in both standalone studio and dashboard-embedded contexts
- Piggyback on existing functionality used by comments

## Implementation History

### Phase 1: Initial Complex Implementation (Rejected)
**Approach**: Used complex intent URLs with router resolution
- Created `linkToFieldAction.ts` using `resolveIntentLink('edit', {id, type, path})`
- Used `buildStudioUrl()` for dashboard vs standalone contexts
- Added field validation with `validateFieldPath` helper
- Added i18n strings for field-not-found warnings
- Modified `getIntentState.ts` to forward `path` parameter

**Issues**:
1. `pushToast is not a function` - Fixed by changing destructuring from `{pushToast}` to `{push: pushToast}`
2. User feedback: Intent link format too complex, should be simpler and piggyback on existing functionality

### Phase 2: Simplified URL Approach (Current)
**Approach**: Use simple query parameters like comments do
- Simplified URL construction: `new URL(window.location.href)` + `url.searchParams.set('path', pathString)`
- Removed complex intent resolution
- Removed field validation (let form handle invalid paths)
- URL format: `...document-url?path=fieldName`

**Files Modified**:
1. `packages/sanity/src/core/form/field/actions/linkToFieldAction.ts` - Field action implementation
2. `packages/sanity/src/core/config/document/fieldActions/index.ts` - Register action
3. `packages/sanity/src/structure/getIntentState.ts` - Forward path param in getPaneParams
4. `packages/sanity/src/structure/panes/document/DocumentPaneProvider.tsx` - Consume path param and trigger focus
5. `packages/sanity/src/core/i18n/bundles/studio.ts` - i18n strings for action

## Current Implementation Details

### linkToFieldAction.ts
```typescript
export const linkToFieldAction = defineDocumentFieldAction({
  name: 'linkToField',
  useAction({path}) {
    const {push: pushToast} = useToast()
    const {t} = useTranslation('studio')

    const onAction = useCallback(() => {
      const pathString = pathToString(path)
      const url = new URL(window.location.href)
      url.searchParams.set('path', pathString)

      navigator.clipboard.writeText(url.toString())
        .then(() => pushToast({...}))
        .catch(() => pushToast({...}))
    }, [path, pushToast, t])

    // Hidden at document root
    if (path.length === 0) return null

    return defineActionItem({
      type: 'action',
      icon: LinkIcon,
      onAction,
      title: t('field-action.link-to-field.title'),
    })
  },
})
```

### DocumentPaneProvider.tsx useEffect
```typescript
useEffect(() => {
  if (ready && params.path) {
    const {path, ...restParams} = params

    if (path !== pathRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      const raf = requestAnimationFrame(() => {
        const parsedPath = pathFromString(path)
        const pathFromUrl = resolveKeyedPath(formStateRef.current?.value, parsedPath)
        onPathOpen(pathFromUrl)        // Expands fieldsets, activates groups
        onProgrammaticFocus(pathFromUrl) // Sets focus state
      })

      pathRef.current = path

      if (!enhancedObjectDialogEnabled) {
        paneRouter.setParams(restParams)
      }

      return () => cancelAnimationFrame(raf)
    }
  }
  // ...
}, [formStateRef, onPathOpen, onProgrammaticFocus, paneRouter, params, ready, enhancedObjectDialogEnabled])
```

## Issues Encountered & Solutions

### Issue 1: `pushToast is not a function`
**Cause**: Incorrect destructuring of useToast hook
**Solution**: Changed from `const {pushToast} = useToast()` to `const {push: pushToast} = useToast()`

### Issue 2: Complex intent URLs
**Cause**: Using router's resolveIntentLink created complex URLs with type and path params
**Solution**: Simplified to standard query parameters using URLSearchParams

### Issue 3: Field action disappeared
**Cause**: `usePaneRouter()` not available in field action context (form layer vs structure layer)
**Solution**: Use standard browser APIs (URL, URLSearchParams) instead of paneRouter

### Issue 4: Link navigates but doesn't scroll ⚠️ CURRENT ISSUE
**Status**: PARTIALLY WORKING
- ✅ Link navigates to correct document
- ✅ Field action appears in menu
- ✅ URL is copied correctly
- ❌ Field doesn't scroll into view from URL navigation
- ✅ BUT: Clicking comment cards DOES scroll to fields

**Investigation**:
- Comment links from URLs also don't scroll (broader issue)
- Clicking comment cards works because they call `scrollToField()` from `useCommentsScroll`
- `scrollToField()` uses `requestAnimationFrame` + `querySelector('[data-comments-field-id]')` + `scrollIntoViewIfNeeded`
- `onProgrammaticFocus` might not actually scroll - just sets focus state
- `useScrollIntoViewOnFocusWithin` hook should scroll when focus changes, but timing might be off

**Attempted Solutions**:
1. ✅ Called both `onPathOpen()` and `onProgrammaticFocus()`
2. ✅ Added `requestAnimationFrame` for timing
3. ❌ Still doesn't scroll from URL

**Hypotheses**:
1. Form might not be fully rendered when focus is set from URL params
2. `initialFocusPath` from useDocumentForm might set focus before DOM is ready
3. Fields need to be scrolled using a different mechanism than onProgrammaticFocus
4. The `useScrollIntoViewOnFocusWithin` hook might not trigger on initial URL load

## Current Status

### What Works
- ✅ Field action appears in overflow menu on all fields (except document root)
- ✅ Copies URL to clipboard with success toast
- ✅ URL format is simple: `?path=fieldName`
- ✅ Navigating to URL opens correct document
- ✅ Path parameter is consumed by DocumentPaneProvider
- ✅ `onPathOpen` and `onProgrammaticFocus` are called
- ✅ Groups are activated correctly (via getExpandOperations)
- ✅ Build passes
- ✅ Lint passes
- ✅ Tests pass (no failures related to our changes)

### What Doesn't Work
- ❌ Field doesn't scroll into view when navigating from URL
- ❌ Comment links from URLs also don't scroll (existing issue)

### Comparison: What Works vs Doesn't
| Action | Scrolls? | Method |
|--------|----------|--------|
| Click comment card in pane | ✅ Yes | Calls `scrollToField()` directly |
| Navigate to comment URL | ❌ No | Uses URL params → onPathOpen/Focus |
| Navigate to field URL (ours) | ❌ No | Uses URL params → onPathOpen/Focus |

## Next Steps to Investigate

1. **Compare timing**: When does `scrollToField()` get called vs when does `onProgrammaticFocus` get called?

2. **Check if field is rendered**: Add logging to see if field element exists in DOM when focus is called

3. **Investigate useScrollIntoViewOnFocusWithin**: Does this hook trigger on initial page load or only on focus changes?

4. **Consider alternative approach**:
   - Could we use `scrollToField()` from `useCommentsScroll` instead?
   - Could we set a data attribute on fields and manually scroll?
   - Should we wait longer (setTimeout) instead of requestAnimationFrame?

5. **Debug comment links**: Since comment URL links also don't work, fixing that might fix ours too

6. **Check form readiness**: Maybe `ready` flag isn't enough - need to wait for form to be fully mounted?

## Key Insights

1. **Context limitations**: Field actions run in form context, not structure context (can't use usePaneRouter)

2. **Two focus mechanisms**:
   - `onPathOpen` + `onProgrammaticFocus` = Set state
   - `scrollToField()` from useCommentsScroll = Actually scroll DOM

3. **Timing is critical**: Need requestAnimationFrame to wait for DOM, but might not be enough

4. **Comments have same issue**: This suggests a systemic problem with URL-based field navigation

5. **Field groups work**: The `getExpandOperations` utility correctly switches groups automatically

## Files Reference

### Created
- `packages/sanity/src/core/form/field/actions/linkToFieldAction.ts`

### Modified
- `packages/sanity/src/core/config/document/fieldActions/index.ts`
- `packages/sanity/src/structure/getIntentState.ts`
- `packages/sanity/src/structure/panes/document/DocumentPaneProvider.tsx`
- `packages/sanity/src/core/i18n/bundles/studio.ts`

### Key Related Files (Not Modified)
- `packages/sanity/src/core/comments/hooks/useCommentsScroll.ts` - Scroll mechanism
- `packages/sanity/src/core/form/hooks/useScrollIntoViewOnFocusWithin.ts` - Auto-scroll on focus
- `packages/sanity/src/structure/panes/document/comments/CommentsWrapper.tsx` - Comment deep links
- `packages/sanity/src/core/comments/plugin/inspector/CommentsInspector.tsx` - Comment click handling

## Build & Test Status

- **Build**: ✅ Passing
- **Lint**: ✅ Passing
- **Tests**: ✅ Passing (3566 passed, 6 failures unrelated to our changes)
- **Manual Test**: ⚠️ Partial - navigates but doesn't scroll

## Open Questions

1. Why don't comment links scroll from URLs either?
2. Is there a difference between how `initialFocusPath` works vs calling `onProgrammaticFocus` later?
3. Should we be using `scrollToField()` directly instead of relying on `onProgrammaticFocus`?
4. Is there a way to hook into the form's render completion to ensure DOM is ready?
5. Does the form have a "fully ready" state beyond the `ready` flag?

---

**Last Updated**: After fixing field action visibility issue (removed usePaneRouter dependency)
**Current Blocker**: URL navigation doesn't scroll to field (affects both our feature and existing comment links)
