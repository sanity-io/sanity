---
name: sanity-custom-input-suspense
description: Fix a Sanity Studio custom input that suspends without its own Suspense boundary, so it loads without layout shift and never blocks new documents. Use when the console warns "The custom input ... suspended without a <Suspense> boundary of its own", when a custom input uses React.lazy, use(), App SDK hooks (useDocumentProjection, useQuery, useDocument) or another suspending data library, or when a field shows a skeleton that never goes away on new documents.
---

# Custom inputs that suspend

Studio wraps every schema type's `components.input` in a fallback boundary so one suspending
input cannot blank the form. That fallback is a generic skeleton: it does not know the input's
size, so the form shifts when the input loads, and in development Studio warns about it. The fix
always lives in the input: declare a `Suspense` around the part that suspends, with a fallback
that takes the same space as what it stands in for.

## Workflow

1. **Find the input.** The warning names the component, the field path and the schema type, and
   logs the component itself; click it in the browser console to open its source. React DevTools'
   Suspense tab shows which component inside it actually suspended.
2. **Find what suspends.** Usually one of: `React.lazy`, `use(promise)`, an App SDK hook
   (`useDocumentProjection`, `useDocument`, `useQuery`, `useDocuments`), or a library in suspense
   mode (`useSuspenseQuery`).
3. **Move it into its own component** if it is not already, and wrap only that component in
   `<Suspense>` inside the input. Keep `props.renderDefault(props)` outside the boundary, so the
   built-in input never unmounts (and never loses focus while someone types) when the async part
   suspends again.
4. **Reserve the space.** The fallback must have the size of the loaded UI:
   - Additive UI (warnings, previews, counts): render it after `renderDefault` so it never pushes
     the input down, and give the fallback the height of one loaded row.
   - A whole input that loads lazily: a skeleton with the input's height, not `null`.
5. **Do not suspend on a document that does not exist yet.** A new document only exists once the
   first edit creates it, and SDK hooks that read the current document wait for it forever. Gate
   on `useFormValue(['_createdAt'])`: it is unset until the document exists.
6. **Keep promises stable.** A promise created during render, in `useState` or in `useMemo` is
   thrown away while the component suspends on mount, so `use()` gets a new one every retry and
   never settles. Use the SDK hooks, a module-scope cache keyed by the inputs, or a data library.
7. **Verify.** Open a new document of the type and an existing one: the warning is gone, the rest
   of the form is editable right away, and nothing moves when the async part lands.

## Example

```tsx
import {createDocumentHandle, useDocumentProjection} from '@sanity/sdk-react'
import {Card, Skeleton, Stack, Text} from '@sanity/ui'
import {Suspense} from 'react'
import {type ArrayOfObjectsInputProps, getPublishedId, useFormValue} from 'sanity'

export function ModelSizeInput(props: ArrayOfObjectsInputProps) {
  const documentId = useFormValue(['_id']) as string
  const documentExists = Boolean(useFormValue(['_createdAt']))
  const hasModels = (props.value?.length ?? 0) > 0

  return (
    <Stack gap={3}>
      {props.renderDefault(props)}
      {documentExists && hasModels ? (
        <Suspense fallback={<Skeleton radius={2} style={{height: 33}} animated />}>
          <ModelSizeWarnings documentId={getPublishedId(documentId)} />
        </Suspense>
      ) : null}
    </Stack>
  )
}

function ModelSizeWarnings(props: {documentId: string}) {
  const {data} = useDocumentProjection<{missing: number}>({
    ...createDocumentHandle({documentType: 'product', documentId: props.documentId}),
    projection: `{"missing": count(models[!defined(@->size)])}`,
  })
  return (
    <Card padding={2} radius={2} tone={data.missing > 0 ? 'critical' : 'positive'}>
      <Text size={1}>{data.missing} models are missing a size</Text>
    </Card>
  )
}
```

The skeleton's height matches the one-line card it stands in for. If the loaded UI's height
varies, reserve the most common case and keep the variable part below the input.
