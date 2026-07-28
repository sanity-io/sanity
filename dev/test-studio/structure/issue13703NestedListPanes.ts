/**
 * Reproduction for https://github.com/sanity-io/sanity/issues/13703
 *
 * Structure Tool: nested list panes lose items when a 4-pane-deep navigation
 * forces PaneLayout to collapse the root pane. On restore the virtualizer's
 * cached viewport height stays at the stale ~0 value from the 0x0 collapse, so
 * `aria-setsize` on the root list's `<ul>` stays correct but only the tail
 * item(s) render. The missing items are also not clickable, so it's a
 * navigation dead-end rather than a purely cosmetic glitch.
 *
 * This mirrors the second reporter's simpler navigation-only repro from the
 * issue comments: Content > Shop > Products > Product Settings, using
 * `S.listItem().child(S.list().items([...]))` at every level (NOT
 * `S.documentTypeList()`). The nested generic list wrapper is required to
 * trigger the bug; a `documentTypeList` sibling at the same depth does not
 * reproduce it, which is why the "All Products" sibling below is a useful
 * negative control.
 *
 * How to reproduce (in the test-studio, after `pnpm dev`, in the default
 * workspace):
 *   1. In the root Content pane, click "Issue #13703 > Shop".
 *   2. In the "Shop" pane, click "Products".
 *   3. In the "Products" pane, click "Product Settings".
 *   4. Look at the *root* Content pane on the far left: it will have
 *      collapsed and re-expanded, and now only its final item + trailing
 *      divider render. `aria-setsize` on the root <ul> is still correct;
 *      the <ul>'s `style="height: ..."` is a small stale value (~100-150px).
 *      The missing rows are not clickable.
 *   5. Back-navigating one pane does NOT restore rendering. Switching to
 *      Vision (or any other tool) and back DOES. A full reload DOES.
 *
 * The bug reproduces in a production build too (React StrictMode ruled out
 * by the second reporter), and on the newest `@tanstack/react-virtual`
 * (^3.14.8, floated from the ^3.14.6 declared in sanity 6.6.0).
 */

import {type StructureBuilder} from 'sanity/structure'

export function issue13703NestedListPanes(S: StructureBuilder) {
  return S.listItem()
    .id('issue13703-shop')
    .title('Issue #13703: Shop')
    .child(
      // Pane 2: Shop
      S.list()
        .id('issue13703-shop-list')
        .title('Shop')
        .items([
          S.listItem()
            .id('issue13703-products')
            .title('Products')
            .child(
              // Pane 3: Products
              S.list()
                .id('issue13703-products-list')
                .title('Products')
                .items([
                  S.listItem()
                    .id('issue13703-product-settings')
                    .title('Product Settings')
                    .child(
                      // Pane 4: Product Settings. Opening THIS pane is what
                      // triggers the root-pane collapse that breaks the
                      // virtualizer on restore.
                      S.list()
                        .id('issue13703-product-settings-list')
                        .title('Product Settings')
                        .items([
                          S.listItem()
                            .id('issue13703-general-product-settings')
                            .title('General')
                            .child(
                              // Leaf: a plain document editor. Using `grrm`
                              // (an author singleton that already exists in
                              // this dev studio's test data) so the pane
                              // resolves to something concrete without
                              // needing new schema types.
                              S.document().documentId('grrm').schemaType('author'),
                            ),
                          S.listItem()
                            .id('issue13703-product-templates')
                            .title('Templates')
                            .child(
                              // Sibling nested S.list() (5th pane if you
                              // navigate into it). Matches the second
                              // reporter's structure: a leaf that is itself
                              // an S.list(), not a documentTypeList.
                              S.list()
                                .id('issue13703-product-templates-list')
                                .title('Templates')
                                .items([
                                  S.documentListItem().id('grrm').schemaType('author'),
                                ]),
                            ),
                        ]),
                    ),
                  S.divider(),
                  // Same depth as `Product Settings` but a `documentTypeList`,
                  // NOT a nested `S.list()`. Per the second reporter,
                  // navigating into this branch does NOT break the root pane.
                  // Useful as a negative control for the maintainer to check.
                  S.listItem()
                    .id('issue13703-all-products')
                    .title('All Products (control: uses documentTypeList, no bug)')
                    .child(S.documentTypeList('author').title('All Products')),
                ]),
            ),
        ]),
    )
}
