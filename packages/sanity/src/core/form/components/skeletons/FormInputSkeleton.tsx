import {Card, TextSkeleton} from '@sanity/ui'

/**
 * Placeholder for a form input while a lazy input component loads. Same padding and radius as
 * `TextInput` around a size 1 text line, which comes out as tall as the default text input
 * (`FormInputFallback.browser.test.tsx` measures both).
 *
 * @internal
 */
export function FormInputSkeleton() {
  return (
    <Card border data-testid="form-input-skeleton" padding={3} radius={2}>
      <TextSkeleton animated radius={1} size={1} style={{width: '40%'}} />
    </Card>
  )
}
