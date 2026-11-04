# K4: the next document in the list, with a panel open

Measured 4 Nov 2026 in the Design Studio (`docTabs`), at a 1728 px window, on Tidewater, then the next book in the list (Midsummer), with the Versions panel (the inventory) open. One action is one click or one key press (a chord counts as one). Done by hand in the browser, once per row; nothing was written to the dataset.

| Direction                         | Switch      | Next document         | Actions                                       | Panel stays open |
| --------------------------------- | ----------- | --------------------- | --------------------------------------------- | ---------------- |
| Stock panes (list visible)        | `docTabs.a` | in the list on screen | **1** (click the row)                         | yes              |
| F1: list folded into a breadcrumb | `docTabs.c` | not open yet          | **2** (unfold the breadcrumb, click the row)  | yes              |
| F4: breadcrumb and tabs           | `docTabs.b` | not open yet          | **2** (the same; the document becomes a tab)  | yes              |
| F4: breadcrumb and tabs           | `docTabs.b` | already a tab         | **1** (click its tab, or Alt+] from anywhere) | yes              |

## Reading

- Folding the list costs **one extra action** for a document that is not open (stock 1, F1 2). Tabs do not remove it: F4 opens the list the same way as F1.
- Tabs pay off only for a document that is already a tab: 1 action, from the mouse or from inside the form (Alt+]).
- With the list folded, "the next document in the list" is not one of the tabs unless it was opened before, so a walk down a list of N documents costs 2 per document in F1 and in F4 (the first time), and 1 per document on a second pass in F4.
- The panel stayed open in every row. In F4 this needed a fix found during the measure: a tab saved the group it was opened with, so a panel opened afterwards was lost on a switch (the panel then had to be opened again: +1 action, 2 with a menu). A switch now carries the panel of the document on screen (`carryPanel` in `DocTabsTool.tsx`).

## Not measured

- A panel other than the inventory (History): it uses the same `inspect=` group parameter, so it should behave the same; not run.
- The split case, and a window of 1280 or 834 px: at 834 the open panel takes most of the width (see the screenshots), so the unfolded list covers the form.
- Keyboard-only paths through the breadcrumb and the unfolded list (the list is the stock list, so its own arrow keys apply).
