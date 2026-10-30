# Cross-tab listen sharing

## Constraint

Chrome shows the first Sanity API requests as Pending when the per-host connection pool is full. Pending here means queued in the browser. The request has not been sent.

Studio requires HTTP/2. The production API host ppsg7ml5.api.sanity.io advertises SETTINGS_MAX_CONCURRENT_STREAMS 100. A local HTTP/2 server with that cap stalled the next fetch once 100 event streams were held. 90 held streams still returned 200 quickly. Closing one EventSource lets the next fetch return 200.

Replaying authenticated listen fetches against the real API, without reading the body, stalled around 98 extra held 200 responses. A 204 listen response completes and releases the stream. A 200 response stays open for the life of the listen. Every listen in that probe shared one HTTP/2 connection.

The test studio structure home holds 5 long-lived listens on that same host. Two use the path /v2025-02-19/data/listen/test. One uses /vX/data/listen/test. One is the agent bundle listen. One is the addon dataset listen on /data/listen/test-cmts. Same host means one shared pool. 16 structure tabs still answered a ping in about 10ms. The predicted cliff is integer division of the 100 stream cap by the streams one tab holds. 100 divided by 5 is 20 tabs. A desk that holds about 12 streams falls near 8 tabs, because integer division of 100 by 12 is 8.

@sanity/client listen sends Authorization Bearer through the eventsource package and its custom fetch. Native EventSource has no way to set that header. Presence uses a bifur WebSocket. That socket was absent from the held listen set on the structure screen.

Same URL path does not make two listens the same stream. Treat them as distinct until the query, the params, and the API version match. A full page navigation inflates DevTools unfinished counts. That inflation is a measurement error, and it is a separate problem from a leaked socket.

Auth, project id, dataset, and API version stay part of every shared stream. A listener for dataset test must receive only events for dataset test. A listener for dataset test-cmts must receive only events for dataset test-cmts. A shared socket opened with one user token must serve only tabs for that same user.

These studio call sites are the ones a share would touch.

Safe to fan out, one socket per matching key.

- The global document listener is `createGlobalListener` in `packages/sanity/src/core/preview/createGlobalListener.ts`. `createDocumentPreviewStore` builds it with API version 2025-02-19. The query is `*`. Options include welcome, mutation, and reconnect, with `includeResult` false, `includeAllVersions` true, and tag `preview.global`. Every preview subscriber in one tab already shares that socket through `shareReplayLatest`. Tabs of the same project, dataset, API version, and user can share it too.
- The agent bundle listen is `createAgentBundlesStore` in `packages/sanity/src/core/store/agent/createAgentBundlesStore.ts`. The URL is `/agent/${organizationId}/bundles/mine/listen` on API version `v2025-02-19`. A token sets Authorization Bearer on the eventsource polyfill. There is no token path that can use native EventSource. The stream is per organization and per user. It is the same for every tab in that workspace. It is a different host path from `/data/listen`.
- The measured socket on `/data/listen/test-cmts` was open on structure home with no document pane. Per-document comment listens do not match that. `useTasksStore` listens for `tasks.task` documents on the addon dataset client, and the default test workspace enables tasks. Treat that tasks listen as the likely owner. It is a different dataset from `test`. Fan-out is safe across tabs of the same project, addon dataset, API version, and user. Document-scoped comment listens stay local.

Likely owners of the other two structure sockets, still safe only when the full query matches.

- `createReleaseStore` calls `listenQuery` with tag `releases.listen` on a client fixed to API version `v2025-02-19`. The query lists release documents. That is a workspace list. It is a candidate for the second `/v2025-02-19/data/listen/test` socket. It must stay a separate shared stream from the global `*` listener.
- `createVariantsStore` calls `listenQuery` with tag `variants.listen` on API version X, and only while the variants beta is on. The query lists variant documents. That is a candidate for `/vX/data/listen/test`. With the beta off, this store opens no socket, and the measured vX listen has some other owner.

Per document, or per pane filter. Keep the socket in the tab, or multiplex it with a subscription id that includes dataset, API version, query, and params.

- `getPairListener` listens to `*[_id in $ids]` for one published id, draft id, and optional version id. It enables resume and handles welcome, mutation, reconnect, reset, and welcomeback. Resume state and `messageReceivedAt` belong to that pair. A desk that opens many documents adds these streams on top of the structure set. That is the path from 5 streams toward about 12.
- `listenQuery` serves arbitrary queries. Document lists use it. The first event must be welcome, or the observable errors.
- `listenSearchQuery` listens to one pane filter, then refetches search results.
- `createDocumentIdSetObserver` listens to one filter and tracks ids entering and leaving the set.
- Comments v2 `useCommentsStore` calls `client.collaboration.comments.listen` with a query on type `sanity.comment`, a target document ref, and a source document id. Draft and published share one comment set. Any other version id is exact. That socket is per document group, even if the transport dataset is `test-cmts`.
- Legacy `useCommentsStore` listens on the client dataset for `_type == "comment"` and one document id.
- `useTasksStore` listens for `tasks.task` documents on the addon dataset client.
- Cross-dataset reference preview opens its own `*` listen inside `getReferenceInfo`.
- Presentation `PostMessageDocuments` listens for mutations outside the system document path, and that listen sits outside the structure-home set.

`listenQuery` replays work only after welcome. A late tab that joins an already open shared stream still needs a welcome, or its list stays on the initial state. Replaying the last welcome is the same contract `shareReplayLatest` already uses inside one tab.

This note compares designs. It does not approve shipping any of them.

## Designs

### SharedWorker

#### Mechanism

A SharedWorker is one thread for same-origin tabs. The worker opens each shared listen with the eventsource polyfill so Authorization Bearer can be set. A tab sends a subscribe message. The message carries project id, dataset, API version, query, params, listener options, user id, and a subscription id. The worker holds one HTTP/2 stream per distinct key and posts each SSE event only to subscribers of that key. The last unsubscribe closes that stream. Per-document pair listens stay in the tab unless the message includes their subscription id and the worker forwards only matching events.

#### Tab gain

Sharing all 5 structure streams holds 5 streams for the whole profile. The baseline cliff is 20 tabs, from 100 divided by 5. After a correct share, further identical structure tabs add no listen stream. The 100 cap no longer yields a tab count for this screen. Spare capacity is 100 minus 5, so 95 streams remain for listens that stay private to a tab. The gain for a desk at about 12 streams is unknown until a count shows how many of those 12 keys match across tabs.

#### Failure

A worker crash closes every shared stream. Each tab sees the port close, starts a new worker, and must receive a fresh welcome before it trusts list state again. A leader tab is not required, so a single tab crash leaves the worker and the sockets up while any other port remains. Discarding a page closes its port. The worker keeps the sockets while another live tab is subscribed. Discarding the last subscribed tab lets the worker exit and frees the streams. A discarded page does not keep old events. On the next load it subscribes again and waits for welcome.

If Safari or Firefox has no SharedWorker constructor, this design opens nothing shared. Each tab keeps its own 5 listens. The cliff stays 20 tabs on HTTP/2. The prototype needs a second path for that browser, or those browsers stay on the measured limit. Current Firefox exposes SharedWorker. Safari before version 16 does not.

#### Why it might lose

The worker must receive the bearer token, because native EventSource cannot set the header. Moving that token into a worker widens who can ask for a socket. A path-only key merges the two `/v2025-02-19/data/listen/test` listens and drops one query. A missing dataset check lets a `test` subscriber see `test-cmts` events. Replayed welcome marks every store loading and refetches. A busy `*` stream copies every mutation into every tab, so main-thread work grows with tabs even while the stream count stays at 5. DevTools unfinished counts after a navigation can fake a leak and kill a good run, or hide a real one.

### Dedicated worker plus BroadcastChannel

#### Mechanism

One tab starts a dedicated Worker. That worker runs the eventsource polyfill and reads the SSE body. The page copies each event onto a BroadcastChannel whose name includes project id, dataset, and user id. Other tabs subscribe to the channel and open no listen of their own. The channel message carries dataset, API version, query key, and subscription id. Receivers drop messages whose key they did not subscribe to. The dedicated worker dies with the page that created it, so some election still has to pick the owner tab.

#### Tab gain

While one worker holds the 5 structure listens, the count matches the SharedWorker case. 5 streams replace 5 per tab, and the 20 tab cliff from 100 divided by 5 is gone for identical structure homes. 95 streams remain under the cap. During owner handover the gain is unknown. A stampede can open 5 listens per tab and return the pool to the original cliff. Desk gain at about 12 streams is unknown for the same reason as above.

#### Failure

A crash of the owner tab destroys the dedicated worker and closes the 5 streams at once. Followers go quiet until a new owner opens 5 new listens and emits welcome. Discarding the owner page does the same, and discard prefers hidden tabs. If the owner is hidden, discard is a normal outcome, and every visible follower loses the stream together. BroadcastChannel keeps no backlog. Events emitted while a follower is discarded are gone. The reloaded tab needs welcome, then a refetch, which is the same recovery `listenQuery` already uses after reconnect.

Safari and Firefox both have dedicated workers and BroadcastChannel. This design still runs where SharedWorker is missing. Those browsers then depend on the owner tab staying alive.

#### Why it might lose

The socket owner is still a tab. Background freeze of that tab freezes its worker and stalls every follower. Handover that is slow, or handover that double-opens, spends the stream savings in the failure window. The channel fans the global `*` traffic into every tab. A follower that forgets to check dataset will apply `test-cmts` events to `test` state. The worker still needs the bearer token inside the owner tab. That is narrower than a SharedWorker, and it is still a second auth path beside `client.listen`.

### Visible leader tab

#### Mechanism

Tabs elect one visible tab to own the shared sockets. That tab calls the existing `client.listen` and the existing agent bundle polyfill. It posts events on a BroadcastChannel with the same key fields as the worker designs. Hidden tabs do not open those five listens. When the visible owner hides, it can hand the sockets to another visible tab, or it can keep them until crash or discard. Per-document listens stay in the tab that has the document open. A follower applies a comments event only when the subscription id matches its document group and version. The global `*` listener, the agent bundle listen, and the tasks addon listen are the three keys that are safe to copy to every structure tab. Release and variant list listens join that set only after their query text is part of the key.

#### Tab gain

One visible owner holding all 5 structure streams uses 5 streams total. Baseline is 20 tabs from 100 divided by 5. Identical structure tabs past that no longer add listen streams, and 95 cap slots stay free. Sharing only the three named safe streams, and leaving the other two structure sockets private, gives a smaller known gain. Total streams are 3 plus 2 per tab. 3 plus 2 times 48 is 99. The 49th tab pushes the count past 100. That partial share moves the cliff from 20 tabs to 48 tabs. Sharing one stream and leaving four private moves it only to 24 tabs, because 1 plus 4 times 24 is 97 and the next tab crosses 100. Desk gain at about 12 mixed streams is unknown.

#### Failure

A crash of the visible owner closes its EventSources immediately. The pool frees those streams, and every follower stops receiving until the next visible tab opens them and emits welcome. The gap is election time plus a new listen welcome. Discard of a hidden tab does not drop the sockets if the visible owner is some other tab. Discard of the visible owner is the same as a crash. If every tab is hidden, a visible-only rule closes all shared sockets, and the first tab to become visible opens them again. Users then see a reconnect on return.

This design uses the Page Visibility API and BroadcastChannel. It does not use SharedWorker. Safari and Firefox can run it even when SharedWorker is absent. Browsers that also lack BroadcastChannel cannot fan out, and each tab would keep private listens.

#### Why it might lose

Handoff on every hide reconnects the five sockets and refetches every list in every tab. That churn can cost more than 20 private listens. Split brain from a stale visibility signal opens a second set of 5 streams. Two owners are still far under 100. Many owners recreate the cliff. A background owner that never hands off can be frozen, and then every visible tab looks disconnected. The first-event welcome rule in `listenQuery` fails closed for a follower that missed welcome. Pair-listener resume cannot be copied across tabs without a subscription id, and a wrong id would apply one document mutation to another document.

### Web Locks API

#### Mechanism

Each tab calls the Web Locks API with a lock name built from user id, project id, dataset, and API version. The granted tab is the only tab allowed to open the shared listens. Other tabs wait on that lock and read events from BroadcastChannel. They must not open a listen while waiting. The browser releases the lock when the holding document crashes, navigates, or is discarded. The next queued tab is granted and opens the streams. Lock mode is exclusive. The steal flag stays off. The lock does not carry SSE bytes. Without BroadcastChannel, or without a SharedWorker, followers learn nothing.

Per-stream locks are an alternative. One lock per full listen key still yields 5 locks on the structure screen. A tab waiting on a lock for dataset `test` must not become the holder for dataset `test-cmts`.

#### Tab gain

The lock itself adds no sockets and removes none. Gain exists only when the holder is the sole opener and followers share those events. In that setup the arithmetic matches the visible leader. All 5 structure streams shared means 5 streams total, against a 20 tab baseline from 100 divided by 5, with 95 streams spare. Three shared and two private reaches 48 tabs before the count exceeds 100. One shared and four private reaches 24 tabs. If each tab holds a different document pair, those private streams do not collapse, and the desk cliff stays near 8 tabs at about 12 streams. That desk gain is unknown.

#### Failure

Crash, navigation, and discard all release the lock, because the holding document is gone. The next waiter is granted and must open fresh listens and emit welcome. There is a gap with zero shared sockets. Followers that were not queued on the lock never notice, so every interested tab has to be waiting. Discard of a hidden holder hands the lock to another waiter. That wakeup is the useful case. Discard of the only remaining tab releases the lock and frees the pool, and there is nobody to notify.

Safari and Firefox both implement Web Locks, including browsers with no SharedWorker. The fan-out channel is the piece those browsers still need. A missing BroadcastChannel leaves the lock able to prevent duplicate sockets and unable to deliver events.

#### Why it might lose

A hidden frozen tab can win the lock and then stall delivery for everyone. Polling with ifAvailable invites a herd that opens listens before the grant. The steal flag lets a new tab drop the current holder and briefly double the streams. A lock name that omits dataset makes one holder responsible for `test` and `test-cmts` without a forced split, and a sloppy forwarder will cross the streams. Web Locks do not replay SSE. A prototype that ships the lock and forgets welcome replay leaves `listenQuery` consumers on their initial state forever.

## Recommendation

Prototype one composition. A visible leader tab holds an exclusive Web Lock and is the only tab that opens the five structure-home listens. It uses the existing client listen path and the existing agent bundle polyfill, so the bearer token stays inside that tab. Followers subscribe on BroadcastChannel and do not open those five sockets. The channel key includes user id, project id, dataset, API version, query, params, and listener options. The global document listener, the agent bundle listen, and the tasks addon listen are in the shared set. The release list and the variant list join only under their own query keys. `getPairListener`, document-scoped comments listens, search listens, and reference preview listens stay local.

This note does not approve shipping that design. Build the prototype only as a measurement harness.

The first measurement that kills it is a single Chrome profile against the production HTTP/2 API. Open identical structure home tabs past 20. Count held 200 listen responses, and watch the next ordinary API fetch. Kill the prototype if the held 200 count still climbs by about 5 per tab, or if that next fetch stays Pending at 20 tabs or sooner. A flat count near 5, with the new fetch returning 200 quickly past 20 tabs, is the only result that justifies a larger design.

A leader crash or a discarded leader must show up as a released Web Lock, a new welcome, and five replacement streams. Missing SharedWorker support does not apply to this prototype. Safari and Firefox can run the lock and the channel. If that first cliff measurement fails, stop. A SharedWorker port is a later idea for the crash gap, and only after the cliff actually moves.
