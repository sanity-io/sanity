# React Doctor false positives (packages/sanity)

Documented suppressions / rejections for the `sanity` package scan. Each entry lists the rule, location, and observed predicate that makes the diagnostic a false positive or intentional exception.

## `react-doctor/require-reduced-motion` @ `package.json`

**Rejected.** The package already honors reduced motion via `usePrefersReducedMotion()` and `<MotionConfig>` in `src/presentation/preview/Preview.tsx`. The project-level heuristic looks for the exact token `useReducedMotion` and missed the local hook name. Rule disabled in `doctor.config.json`.

## `import/consistent-type-specifier-style` @ `src/_singletons/**`

**Rejected / ignored.** Repo oxlint override requires `prefer-top-level` type imports in `_singletons` so the boundaries plugin can track type-only dependencies (`import type { X }`). Inline `import { type X }` fails both the singleton override and `boundaries(dependencies)`. Matched by `doctor.config.json` ignore override.

## `react-doctor/effect-needs-cleanup` — callback-owned subscriptions

**Rejected** when the subscription/timer is created inside a `useCallback`, callback ref, or event handler the effect merely defines — not scheduled synchronously by the effect body:

- `src/core/form/inputs/arrays/ArrayOfObjectsInput/List/VirtualizedArrayList.tsx` (`observeElementOffset` callback)
- `src/core/form/inputs/files/common/useAssetSourceUploader.ts` (`handleSelectFilesToUpload`)
- `src/core/form/members/array/items/ArrayOfObjectsItem.tsx` (`handleInsert`)
- `src/core/form/members/object/fields/ArrayOfObjectsField.tsx` (`handleInsert` / `handleSelectFile`)
- `src/core/form/studio/assetSourceDataset/file/AssetRow.tsx` (`handleDeleteAsset`)
- `src/core/perspective/navbar/useScrollIndicatorVisibility.ts` (callback ref; mount effect removes listener)
- `src/core/releases/tool/detail/documentTable/DocumentTableColumnDefs.tsx` (callback ref + detach)

## `react-doctor/effect-needs-cleanup` — cleanup present, matcher miss

**Rejected** when a returned cleanup already releases the resource:

- `src/core/form/studio/assetSourceMediaLibrary/shared/UploadAssetDialog.tsx` — `return () => subscription?.unsubscribe()`
- `src/core/presence/overlay/WithIntersection.tsx` — `return () => subscription?.unsubscribe()`
- `src/presentation/overlays/PostMessageDocuments.tsx:37` — `listenSubscription.unsubscribe()` + snapshot unsubscribe in cleanup
- `src/structure/panes/document/documentPanel/header/hook/useChipScrollPosition.tsx` — both observers `disconnect()` in cleanup; detector also appears to match `.observe` as a `.on` subscription

## `react-doctor/no-layout-property-animation`

**Observation / intentional.** Small enter/exit width animations for UI chrome (perspective label, release activity panel, calendar date filter chip). Per rule guidance, bounded intrinsic-size enter/exit is an allowed exception; replacing with `scale` would distort text and hit targets. Severity lowered to `warn` in `doctor.config.json`.

## `import/no-cycle` @ `src/core/field/diff/**`

**Deferred (confirmed architectural cycle).** Cycle shape:

`defaultComponents` → `FileFieldDiff` / `ImageFieldDiff` / `PTDiff` → `ChangeList` → `buildChangeList` → `resolveDiffComponent` → `defaultComponents`

Nested field diffs intentionally re-enter `ChangeList` for nested fields. Breaking this needs a lazy/registry refactor (not a local import tweak). Left as remaining errors so the debt stays visible.
