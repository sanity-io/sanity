# Short-term mitigations

## What is full

Pending means the browser has not sent the request. The browser is holding it in the per-profile connection pool for that host. Tabs in one browser profile share the pool. Separate profiles do not.

The production API host for the test studio, ppsg7ml5.api.sanity.io, speaks HTTP/2 and advertises SETTINGS_MAX_CONCURRENT_STREAMS 100. A local HTTP/2 server with that cap stalled the next fetch at 100 held event streams. 90 held streams still returned 200 quickly. Closing one stream let the ping return.

Replaying the studio listen URL with fetch, and not reading the body, kept ping at 200 through 95 extra held listens. The 95th ping took 655ms. The next listen aborted at 4001ms once 98 extra listens had already received headers. All of those listens were HTTP/2 on one connection. A 204 listen response completes. A 200 listen response stays open. An unread body holds the stream. @sanity/client listen uses the eventsource package so the fetch can set Authorization Bearer. A native EventSource cannot send that header. packages/sanity/src/core/network/unconsumedBodyBlocking.test.ts documents the Node form of the same hold.

Studio requires HTTP/2. The measured stall on this host follows the HTTP/2 cap of 100. The customer stall near 8 tabs matches a desk that holds about 12 streams. 100 divided by 12, rounded down, is 8.

The test studio structure home holds 5 long-lived HTTP/2 listens on that host. WebSockets were not in that set. 16 structure tabs in one Chromium profile all reached the studio layout, and a ping from tab 1 still returned 200 in about 10ms. The run stopped at tab 17 because Chrome RSS was about 10GB, not because the API stalled. The stall prediction is 100 divided by the streams one tab holds, rounded down. Structure home is 100 divided by 5, which is 20 tabs. A type list that adds one listen on top of those 5 would hold 6, and 100 divided by 6, rounded down, is 16 tabs. That extra listen was not recaptured on a clean type-list screen.

The five structure-home listens map to these call sites.

- Agent bundles. The path ends in /v2025-02-19/agent/.../bundles/mine/listen. createAgentBundlesStore in packages/sanity/src/core/store/agent/createAgentBundlesStore.ts builds that URL on API version v2025-02-19. The navbar subscribes through useAgentBundles, including CurrentGlobalPerspectiveLabel, so the listen is open with no document pane.
- Addon dataset. The path is /v2025-02-19/data/listen/test-cmts. useTasksStore listens for tasks.task documents on the addon dataset client from AddonDatasetProvider. That client uses API version 2025-02-19. TasksStudioLayout mounts the store when tasks are enabled, and the default test workspace enables tasks. Comment stores mount with a document, so they are absent on structure home. Comments v2 would use API version vX if it were mounted. That is not the measured /vX/data/listen/test socket.
- Variants. The path is /vX/data/listen/test. createVariantsStore listens through listenQuery with tag variants.listen on API version X. PerspectiveProvider calls useAllVariants on every screen. The default test workspace turns the variants beta on, and the store then keeps the listen for the rest of the session. A workspace with the beta off opens no socket here. This measured studio had the beta on.
- Releases. One of the two paths /v2025-02-19/data/listen/test. createReleaseStore listens through listenQuery with tag releases.listen on API version v2025-02-19. The query lists release documents. PerspectiveProvider calls useActiveReleases on every screen, and the store does not disconnect.
- Preview. The other path /v2025-02-19/data/listen/test. createGlobalListener listens to every document, tag preview.global, API version 2025-02-19. The structure root renders a document list item, and PaneItemPreview subscribes to that shared listen. Every preview in the tab already shares it.

The capture recorded paths, not query strings. The releases query and the preview query differ in code, so treat the two listens as distinct until a live request shows the same query. The structure-home set is those five. getPairListener, listenSearchQuery, liveDocumentIdSet, useReferringDocuments, and getReferenceInfo mount with a document, a list pane, or a reference view. listenSearchQuery is the likely extra listen on a type list. A full page back navigation inflated DevTools unfinished counts. That is an instrumentation artifact, not a proven leak.

## Ranked changes

1. Pause listens while the tab is hidden

Mechanism. When the page visibility state is hidden, unsubscribe the listens this tab holds. Subscribe again when the tab becomes visible. This is a lifecycle change inside one tab.

Saving. A hidden structure-home tab releases 5 streams. A hidden type list releases 6. A hidden desk releases about 12. Hidden tabs then add nothing to the pool. The stall count becomes 100 divided by the streams still held by visible tabs, rounded down. Eight visible desks at about 12 streams still hold about 96 streams and still stall. One visible desk and seven hidden desks hold about 12 streams, which is under the cap. Tabs that stay visible still stall at 100 divided by the streams each visible tab holds, rounded down.

Risk. A hidden tab misses mutations until it is visible again and the listen sends welcome. Lists that refetch on welcome will reload. The preview listen and the pair listen already wait about 5 seconds after the last subscriber, so a quick tab switch can overlap old and new streams for those seconds. The pause has to include the shell listens, or a hidden tab still holds the measured 5.

Proof. Open eight desk tabs that each hold about 12 listens. Hide seven. The held listen count on the API host falls from about 96 to about 12, and a ping from the visible tab returns 200 in about 10ms. Show the hidden tabs again and the count returns. A ping at 90 held streams still returns 200 quickly, matching the local server.

2. Stop shell listens the screen is not using

Mechanism. The tasks listen runs for the whole studio session once tasks are enabled, including on structure home with the tasks UI closed. The agent listen runs because the perspective label subscribes on every screen, including the drafts perspective. Replace each with a fetch while that UI is closed, and start the listen only while the tasks UI or an agent perspective is open. Leave the releases listen and the preview listen in place. Structure home uses both, and their queries differ.

Saving. Stopping both removes 2 of the measured 5 streams. Structure home goes from 5 to 3. 100 divided by 3, rounded down, is 33 tabs, up from 20. A desk that holds those same two shell listens goes from about 12 streams to about 10. 100 divided by 10, rounded down, is 10 tabs, up from about 8. The variants listen is a third shell stream only while the variants beta is on, as in this test workspace. Stopping it as well, after the other two are stopped, takes this structure home from 5 to 2. 100 divided by 2 is 50. Subtract the variants stream only when that workspace has the beta on.

Risk. Task counts and agent labels stay stale until the listen starts again. A fetch on focus covers the common case. The releases store and the variants store never disconnect after the first subscriber. A new listen that copies that pattern puts the stream back for the whole session.

Proof. On structure home, the held set no longer includes /data/listen/test-cmts or the agent bundles path. The two /v2025-02-19/data/listen/test listens remain. A ping still returns 200. With the variants beta on, stopping that listen also removes /vX/data/listen/test.

3. Release a pane listen when the pane unmounts

Mechanism. listenSearchQuery ends when the document list pane unmounts. getPairListener and the preview listen wait about 5 seconds after the last subscriber, then disconnect. Confirm that behavior before adding a second teardown. Releases, variants, tasks, and the agent listen belong to the shell and stay up when a pane unmounts. A back navigation that inflates DevTools unfinished counts is an instrumentation artifact.

Saving. If the existing teardown already runs, the saving is 0 streams. While a type list stays mounted, any listenSearchQuery it added is still held. After that list unmounts, the tab returns to the shell streams if no listen remains, and the stall for structure home is 20 tabs again. If a document list listen is still held more than 5 seconds after the pane is gone, removing it saves 1 stream. A desk near 12 includes more listens than that one list. This change moves that desk only for pane listens that are still held after unmount. Every shell listen and every pane that stays mounted still counts toward the about 12.

Risk. Shortening the 5 second grace makes every pane change reconnect. The grace exists so a quick back and forward does not flap the socket.

Proof. Open a type list and record the held listen count on the API host. Return to structure home. After 5 seconds the count is back to the shell 5, and a ping returns 200 in about 10ms. If the count stays above 5, that pane listen is still held and is the one to release.

4. Share listens inside one document

Mechanism. One open document already uses one pair listen for draft, published, and version through memoizedPair. Previews in the tab already share createGlobalListener. Keep that sharing. Leave the releases listen and the preview listen as two sockets. The queries differ, and the capture did not record them. getReferenceInfo opens a separate listen of every document for each global document reference field. useReferringDocuments opens one listen per caller. Feed those from the shared preview listen, or from one listen for that document, only after the event options match.

Saving. Structure home does not mount these callers, so the saving there is 0. Each extra listen removed is 1 stream on a document that mounts it. The new stall is 100 divided by the new per-tab count, rounded down. A new tab count for the desk at about 12 streams waits on a capture that shows these duplicates inside that 12.

Risk. The preview listen sets includeResult to false. getReferenceInfo asks for the result documents. Sharing them without the same options drops fields or keeps the second stream. A referring listen that moves onto a shared listen must still limit events to that document id.

Proof. On a document that today holds extra reference listens, the held count on the API host falls by one for each listen that folds into the shared preview listen. The pair listen remains. Both structure-home listens on /v2025-02-19/data/listen/test remain. A ping stays at 200.

5. Surface a diagnostic when the pool is nearly full

Mechanism. The studio shows no trying to connect banner. The browser has not sent the request, and nothing is retrying. When a listen or a ping to the API host is still pending long after a normal response, show a diagnostic that this tab is waiting for a free stream. The local server returned 200 quickly at 90 held streams and stalled at 100. On the real API the 95th extra listen still allowed a ping, and that ping took 655ms. The next listen aborted at 4001ms once 98 extra listens had headers.

Saving. 0 streams. The stall stays where the stream count puts it.

Risk. A slow response is also pending after the browser has sent it. The diagnostic should fire only for a request the browser has not sent. Unfinished counts after a back navigation are the wrong signal.

Proof. At 90 held streams the diagnostic stays quiet and ping returns 200 quickly. At 100 held streams the diagnostic appears while the next fetch stays pending. Closing one stream makes that fetch return 200 and clears the diagnostic.

6. Release a completed 204

Mechanism. A 200 listen stays open because the body is the event stream. A 204 completes. Cancel or read that body so an unread 204 cannot hold a stream the way an unread 200 does.

Saving. 0 of the 5 structure-home streams. Those responses are open 200s. The replay showed 204 responses complete. The saving is 1 stream only for a 204 the client still leaves unread. The structure-home capture did not show that case.

Risk. Canceling a 200 drops a live listen. Release a response only after its status shows the body has ended.

Proof. A listen that returns 204 disappears from the held set, and the next ping on that connection returns 200.

## What not to do

- Do not share listens across tabs, and do not add a SharedWorker or a leader election. Another note covers that.
- Do not collapse the two /v2025-02-19/data/listen/test listens because the paths match. One query lists releases. The other matches every document.
- Do not treat a back navigation unfinished count in DevTools as a leaked listen.
- Do not switch the listen to native EventSource. It cannot set Authorization Bearer.
- Do not show a trying to connect banner for this stall. The request was never sent.
- Do not size the fix for the HTTP/1.1 cap of 6. This host is HTTP/2 at 100. The customer number near 8 tabs is the 12 stream desk, not the 6 connection cap.
- Do not expect a second browser profile to drain this pool. Profiles do not share it.
- Do not add a new listen that stays up for the whole app session. The releases store and the variants store already do that, and both sit in the measured 5.
- Do not chase the presence socket. WebSockets were not in the held set.
