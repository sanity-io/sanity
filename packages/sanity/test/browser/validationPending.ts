/**
 * Which mounted `TestForm`s have a document validation run in flight.
 *
 * Module state rather than a DOM marker on purpose: Chromatic's archive is
 * the serialized DOM, so a `data-*` attribute set while a run is in flight
 * made the archive of a test that ended mid-run differ from one that did not
 * (nine of the 117 head archives carried it, none of them visibly). Nothing
 * here reaches the archive; `validationPending()` in `testHelpers` reads it.
 */
const pendingForms = new Set<string>()

export function setValidationPending(formId: string, pending: boolean): void {
  if (pending) pendingForms.add(formId)
  else pendingForms.delete(formId)
}

/** True while any mounted `TestForm` has a validation run in flight. */
export function isValidationPending(): boolean {
  return pendingForms.size > 0
}
