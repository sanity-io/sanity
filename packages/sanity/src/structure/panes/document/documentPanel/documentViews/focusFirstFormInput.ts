/**
 * Marks a subtree whose controls are form chrome, not field input: the form header (title,
 * schema description), field headers (field actions, comments, fieldset toggles), field group
 * tabs, the Portable Text toolbar and its activate-on-focus overlay. Initial focus passes over
 * them, keyboard users still reach them with Tab and Shift+Tab.
 * The attribute is set by `FormHeader`, `FormFieldBaseHeader`, `FieldGroupTabs`, the Portable
 * Text toolbar and `ActivateOnFocus`.
 */
const SKIP_SELECTOR = '[data-skip-initial-focus]'

const CANDIDATE_SELECTOR = [
  'input:not([type="hidden"]):not([type="file"])',
  'textarea',
  'select',
  'button',
  'a[href]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const NATIVE_CONTROL_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'])

function isControl(element: HTMLElement): boolean {
  return NATIVE_CONTROL_TAGS.has(element.tagName) || element.isContentEditable
}

/** True when `element` has a descendant that would itself be an initial-focus candidate. */
function hasCandidateDescendant(element: HTMLElement): boolean {
  for (const descendant of element.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR)) {
    if (!descendant.closest(SKIP_SELECTOR)) return true
  }
  return false
}

function isEditable(element: HTMLElement): boolean {
  if (
    element.getAttribute('aria-disabled') === 'true' ||
    element.getAttribute('aria-readonly') === 'true'
  ) {
    return false
  }
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLButtonElement
  ) {
    if (element.disabled) return false
  }
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    if (element.readOnly) return false
  }
  return true
}

function attemptFocus(element: HTMLElement): boolean {
  try {
    element.focus()
  } catch {
    // Some custom elements throw when focused while detached or hidden.
  }
  // `focus()` is a no-op for elements that are not rendered (`display: none`, collapsed
  // fieldsets, inactive groups, closed overlays), so landing focus is the visibility check.
  return element.ownerDocument.activeElement === element
}

/**
 * Focuses the first visible control that edits a field, in document order: the first enabled,
 * writable input, or the first control of an input that has no text entry (an array's items or
 * its add button, an image's upload button). Falls back to the first read-only control when the
 * form has nothing editable, so keyboard users still start inside the form.
 *
 * Returns `false` when nothing in `form` could take focus yet.
 */
export function focusFirstFormInput(form: HTMLElement): boolean {
  const candidates = Array.from(form.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR)).filter(
    (element) =>
      !element.closest(SKIP_SELECTOR) &&
      // A focusable wrapper (a nested object input's root) is not an input itself, its first
      // control is. Skip-marked chrome (field actions, etc.) does not count as that control.
      (isControl(element) || !hasCandidateDescendant(element)),
  )

  for (const element of candidates) {
    if (isEditable(element) && attemptFocus(element)) return true
  }
  for (const element of candidates) {
    if (attemptFocus(element)) return true
  }
  return false
}
