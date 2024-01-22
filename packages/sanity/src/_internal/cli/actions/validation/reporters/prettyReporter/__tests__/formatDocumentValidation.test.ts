import {formatDocumentValidation} from '../formatDocumentValidation'

// disables some terminal specific things that are typically auto detected
jest.mock('tty', () => ({isatty: () => false}))

describe('formatDocumentValidation', () => {
  it('formats a set of markers in to a printed tree, sorting markers, and adding spacing', () => {
    const result = formatDocumentValidation({
      basePath: '/test',
      documentId: 'my-document-id',
      documentType: 'person',
      level: 'error',
      revision: 'rev',
      studioHost: null,
      markers: [
        {level: 'error', message: 'Top-level marker', path: []},
        {level: 'error', message: '2nd top-level marker', path: []},
        {level: 'error', message: 'Property marker', path: ['foo']},
        {level: 'error', message: 'Nested marker', path: ['bar', 'title']},
        {level: 'error', message: '2nd nested marker', path: ['bar', 'title']},
        {level: 'error', message: '2nd property marker', path: ['baz']},
        {level: 'warning', message: 'Warning', path: ['beep', 'boop']},
        {level: 'error', message: 'Errors sorted first', path: ['beep', 'boop']},
      ],
    })

    expect(result).toEqual(
      `
[ERROR] [person] my-document-id
│  (root) ........................ ✖ Top-level marker
│                                  ✖ 2nd top-level marker
├─ foo ........................... ✖ Property marker
├─ bar
│ └─ title ....................... ✖ Nested marker
│                                  ✖ 2nd nested marker
├─ baz ........................... ✖ 2nd property marker
└─ beep
  └─ boop ........................ ✖ Errors sorted first
                                   ⚠ Warning`.trim(),
    )
  })

  it('formats a set of top-level markers only (should have an elbow at first message)', () => {
    const result = formatDocumentValidation({
      basePath: '/test',
      documentId: 'my-document-id',
      documentType: 'person',
      level: 'error',
      revision: 'rev',
      studioHost: null,
      markers: [
        {level: 'info', message: '2nd top-level marker (should come last)', path: []},
        {level: 'error', message: 'Lone top-level marker (should get elbow)', path: []},
        {level: 'warning', message: 'Warning, should come second', path: []},
      ],
    })

    expect(result).toEqual(
      `
[ERROR] [person] my-document-id
└─ (root) ........................ ✖ Lone top-level marker (should get elbow)
                                   ⚠ Warning, should come second
                                   ℹ 2nd top-level marker (should come last)
`.trim(),
    )
  })
})
