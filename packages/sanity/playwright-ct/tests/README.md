**Some important notes**

- It's important to await `locator()` calls to ensure the element is rendered after you do something, like waiting for a dialog to show up. Otherwise, you might end up with flaky tests.
- The same goes for typing/keypresses. The default delay is 20ms, to emulate a human typing and to allow the PTE to render the text before we continue the test.
- Ideally, we would use testid's for all elements, but the focus for these tests was to get working tests up and running
- Sometimes you probably will end up with arbitrary selectors. In that case, an idea is to have a SELECTORS object with all selectors and then use that in the tests. This way we can label the selectors to explain what they map to in the Sanity Studio.
- Running these tests in CI might take a relatively long time. We have tweaked the timeouts to be a bit more generous. If you run into issues with timeouts, adjusting timeouts in the playwright config and making sure selectors are correct are two things you should try.
