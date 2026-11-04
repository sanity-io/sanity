# Document tabs: keyboard model (K9)

Switch: Design options → Document tabs (`docTabs`). `b` is F4 (breadcrumb and tabs), `c` is F1 (breadcrumb only). Code: `tabs/`.
Figma: Studio Core UX, page D · Frame (3052:2), sections F3 and F4. Status: exploration, not decided.

## Structure

| Part                   | Role                                                                          | Notes                                                                               |
| ---------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Bar's tab group        | `tablist`, `aria-label="Open documents"`, horizontal                          |                                                                                     |
| One document           | `tab`, with `aria-selected`, `aria-posinset`, `aria-setsize`, `aria-controls` | The name is the document's title; a split tab adds ", split beside the active tab". |
| The Structure tool     | `tabpanel`, `aria-labelledby` the active tab                                  | With a split, the panel holds both panes and is named by the active tab.            |
| Breadcrumb ("Books ▾") | a button, `aria-expanded`                                                     | Unfolds the list over the document. Escape or choosing a row folds it.              |
| Announcements          | one `role="status"` live region (polite, atomic)                              | See the list below.                                                                 |

The close and split buttons on a tab are for the pointer. They are not tab stops (`tabIndex=-1`), so a tab is not an interactive container with controls inside it. The keyboard has the same actions on the tab itself.

## Keys (the focused tab)

| Key                  | Action                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| Tab                  | Enters the tab bar at the active tab (the bar is **one** Tab stop: roving `tabindex`). Tab again leaves it. |
| ← / →                | Move focus to the previous or next tab. Wraps at both ends. Does **not** open the document.                 |
| Home / End           | First / last tab.                                                                                           |
| Enter or Space       | Open the focused tab. Focus stays on the tab.                                                               |
| Shift+Enter          | Split the focused tab beside the active one.                                                                |
| Delete               | Close the focused tab. Focus goes to the tab now in its place (the previous one if it was last).            |
| Cmd/Ctrl+W           | Same as Delete, **where the page receives it**. See "Findings".                                             |
| Cmd/Ctrl+Shift+← / → | Move the tab one place left or right. Focus stays on it.                                                    |
| Alt+] / Alt+[        | From anywhere in the Studio (a form, a panel): the next / previous tab.                                     |

Mouse: click opens, × closes, ◫ splits, drag a tab onto another to reorder.

## Decisions

1. **Manual activation.** Arrows move focus; Enter opens. Opening a tab loads a document and remounts the pane, so a user crossing three tabs should not load three documents. (The ARIA Authoring Practices allow both.)
2. **One Tab stop.** The bar costs one Tab press to enter and one to leave, however many tabs there are. This keeps the tab order to the navbar, the bar and the document.
3. **Focus stays on the tab** after Enter, Shift+Enter and the reorder keys. The pane remounts and focus would otherwise fall to the page (found in the first build: the focus was lost after Enter).
4. **After a close, focus moves to the neighbour**, never to the page.
5. **Closing the active tab opens the neighbour** (the one that takes its place); closing the last tab shows the list alone.
6. **No cycling with Ctrl+Tab.** The browser keeps it. Alt+] and Alt+[ are the Studio's own.

## Announcements (polite)

- `<Title> opened in a new tab, tab N of M`
- `Switched to <Title>, tab N of M`
- `Closed <Title>. <Title>, tab N of M` or `Closed <Title>. No tabs open`
- `Moved <Title> to position N of M`
- `<Title> split beside <Title>`

## Findings from the build

- The document pane remounts on every switch. Without an explicit refocus, keyboard focus is lost to `body` after Enter and after a close. Both are handled; any later change to the pane must keep the check "focus is on a tab after each key".
- **Cmd/Ctrl+W:** browsers reserve it for closing the browser tab, and a page cannot take it. It is implemented, but it should be expected to work only in an installed or embedded Studio (not tested here). In a browser, Delete is the way. Product decision needed: is a key a browser reserves acceptable in the spec?
- Browser-reserved keys also rule out Ctrl+Tab and Ctrl+PageUp/PageDown for cycling.
- A reference opened from a document used to add a pane. With tabs on, the URL is rewritten to the one document and a tab is added. The same document twice (a comparison) is left to the stock panes.

## Not covered (for a later round)

- Overflow: tabs shrink to 96 px and then the group scrolls sideways. There is no overflow menu and no "scroll into view" for the focused tab.
- Screen reader runs: the roles and announcements are set, but they have not been tested with VoiceOver or NVDA.
- Touch and 834 px: the layout is checked; drag to reorder does not work on touch.
