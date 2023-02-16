type TestId<T extends string> = T & {__brand: 'test-id'}
function defineId<T extends string>(testId: T) {
  return testId as TestId<T>
}

type KnownTestId = 'simple-typing-speed-test'

export const KNOWN_TEST_IDS: {[P in KnownTestId]: TestId<P>} = {
  'simple-typing-speed-test': defineId('simple-typing-speed-test'),
}

export type ValidTestId = (typeof KNOWN_TEST_IDS)[keyof typeof KNOWN_TEST_IDS]
