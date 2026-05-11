# Sanity Studio Telemetry

This document describes how frontend tracking and event sending works in the Sanity Studio.

## Overview

Sanity Studio uses the `@sanity/telemetry` package to collect anonymized usage data and performance metrics. Events are batched, enriched with studio context, and sent to Sanity's intake API. All telemetry respects user consent and can be disabled.

## Architecture

```
StudioProvider
  └── StudioTelemetryProvider          # Creates batched store, enriches events with context
        └── TelemetryProvider            # React context from @sanity/telemetry/react
              └── PerformanceTelemetryTracker   # Core Web Vitals + legacy INP
                    └── [Studio children]        # Components use useTelemetry() hook
```

### Key Files

| File                                                                          | Purpose                                                                 |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `packages/sanity/src/core/studio/telemetry/StudioTelemetryProvider.tsx`       | Main provider - creates the batched store, enriches events with context |
| `packages/sanity/src/core/studio/telemetry/types.ts`                          | `TelemetryContext` interface definition                                 |
| `packages/sanity/src/core/studio/telemetry/PerformanceTelemetry.ts`           | Mounts Core Web Vitals and legacy INP tracking                          |
| `packages/sanity/src/core/studio/telemetry/useWebVitalsTelemetry.ts`          | Core Web Vitals via `web-vitals/attribution`                            |
| `packages/sanity/src/core/studio/telemetry/useMeasurePerformanceTelemetry.ts` | Legacy INP v1 tracking                                                  |
| `packages/sanity/src/core/studio/MaybeEnableErrorReporting.ts`                | Consent check for error reporting                                       |

## How Events Are Defined

Events are defined using `defineEvent()` from `@sanity/telemetry`. Each event has a name, version, description, and optional typed payload and sampling rate.

```typescript
import {defineEvent} from '@sanity/telemetry'

interface DocumentPublishedInfo {
  publishedImmediately: boolean
  previouslyPublished: boolean
}

export const DocumentPublished = defineEvent<DocumentPublishedInfo>({
  name: 'Document Published',
  version: 1,
  description: 'User clicked the "Publish" button in the document pane',
})
```

### Optional Sampling

Events can specify a `maxSampleRate` (in milliseconds) to throttle high-frequency metrics:

```typescript
export const PerformanceINPMeasuredV2 = defineEvent<INPMetricWithAttribution>({
  name: 'Performance INP Measured',
  version: 2,
  description: 'Interaction to Next Paint with attribution',
  maxSampleRate: 30_000, // At most once every 30 seconds
})
```

### Event Definition Convention

Event definitions live in `__telemetry__/` directories alongside the feature code that uses them:

```
src/
  core/
    comments/__telemetry__/comments.telemetry.ts
    canvas/__telemetry__/canvas.telemetry.ts
    releases/__telemetry__/releases.telemetry.ts
    tasks/__telemetry__/tasks.telemetry.ts
    form/__telemetry__/form.telemetry.ts
    studio/__telemetry__/performance.telemetry.ts
    ...
  structure/
    documentActions/__telemetry__/documentActions.telemetry.ts
    panes/document/__telemetry__/documentPanes.telemetry.ts
    panes/documentList/__telemetry__/documentListSearch.telemetry.ts
    ...
```

## How Events Are Sent

### React Hook

Components log events using the `useTelemetry()` hook from `@sanity/telemetry/react`:

```typescript
import {useTelemetry} from '@sanity/telemetry/react'
import {DocumentPublished} from './__telemetry__/documentActions.telemetry'

function MyComponent() {
  const telemetry = useTelemetry()

  const handlePublish = () => {
    telemetry.log(DocumentPublished, {
      publishedImmediately: true,
      previouslyPublished: false,
    })
  }
}
```

### Feature-Specific Telemetry Hooks

For features with multiple events, a dedicated hook encapsulates the telemetry logic:

```typescript
// useCommentsTelemetry.ts
export function useCommentsTelemetry() {
  const telemetry = useTelemetry()

  return {
    linkCopied: () => telemetry.log(CommentLinkCopied),
    viewedFromLink: () => telemetry.log(CommentViewedFromLink),
    listViewChanged: () => telemetry.log(CommentListViewChanged),
  }
}
```

### Batching and Transport

Events are **not sent immediately**. They are collected in a batched store and flushed periodically:

| Setting                | Value                                              |
| ---------------------- | -------------------------------------------------- |
| Flush interval         | **30 seconds** (production)                        |
| Flush interval (debug) | **1 second**                                       |
| Session ID             | Created once per page load via `createSessionId()` |

**Two delivery methods:**

1. **HTTP POST** (primary) - `POST /intake/batch` via the Sanity client
2. **Beacon API** (page unload) - `navigator.sendBeacon()` to `/intake/batch` for reliable delivery when the page is closing

### Event Enrichment

Every event in a batch is enriched with a `TelemetryContext` object before sending:

```typescript
// Payload sent to /intake/batch
{
  projectId: "abc123",
  batch: [
    {
      // Original event data (name, version, data, timestamp, etc.)
      ...event,
      // Enrichment context
      context: {
        // Static (captured once)
        userAgent: "Mozilla/5.0...",
        screen: { density: 2, height: 1080, width: 1920, innerHeight: 900, innerWidth: 1600 },
        studioVersion: "5.18.0",
        reactVersion: "19.2.3",
        environment: "production",
        connection: { effectiveType: "4g", downlink: 10, rtt: 50, saveData: false },

        // Dynamic (updated on navigation)
        orgId: "org_xyz",
        activeTool: "desk",
        workspaceCount: 2,
        activeWorkspace: "default",
        activeProjectId: "abc123",
        activeDataset: "production",
        pluginCount: 12,
        schemaTypeCount: 84,
      }
    }
  ]
}
```

The context is stored in a `useRef` so that dynamic values (workspace, tool, org) can update without re-creating the batched store.
Workspace, plugin, and schema type counts are derived from the already-resolved Studio configuration. Connection quality uses the browser Network Information API when available. None of these fields add Sanity API requests.

## Consent

Telemetry is **consent-gated**. Before any events are sent, the studio checks the user's consent status:

```
GET /intake/telemetry-status
→ { status: "granted" | "denied" }
```

- If `"granted"`: events are sent normally
- If `"denied"`: events are silently dropped

This check happens once when the `StudioTelemetryProvider` mounts (via the `resolveConsent` option on the batched store).

A separate consent check exists for error reporting (`MaybeEnableErrorReporting`), using the same endpoint with a different tag (`telemetry-consent.error-reporting`).

## Debug Mode

Set the environment variable to log events to the console instead of sending them:

```
SANITY_STUDIO_DEBUG_TELEMETRY=true
```

In debug mode:

- Consent is auto-granted
- Flush interval drops to 1 second
- Events are logged to `console.log` with `[telemetry]` prefix
- No network requests are made

## Event Categories

### Performance (Core Web Vitals)

Tracked automatically via `web-vitals/attribution` library:

| Event                       | Metric                    | Version          |
| --------------------------- | ------------------------- | ---------------- |
| `Performance LCP Measured`  | Largest Contentful Paint  | v2               |
| `Performance FCP Measured`  | First Contentful Paint    | v2               |
| `Performance CLS Measured`  | Cumulative Layout Shift   | v2               |
| `Performance TTFB Measured` | Time to First Byte        | v2               |
| `Performance INP Measured`  | Interaction to Next Paint | v1 (legacy) + v2 |

### Document Actions

| Event                                                 | When                                                |
| ----------------------------------------------------- | --------------------------------------------------- |
| `Document Published`                                  | Publish action completes                            |
| `Publish Button Clicked`                              | Publish operation stages (started/completed/failed) |
| `Publish Button Becomes Disabled - Started/Completed` | Publish button state transitions                    |

### Releases

| Event                               | When                        |
| ----------------------------------- | --------------------------- |
| `Version Document Added to Release` | Document added to a release |
| `Release Created/Deleted/Published` | Release lifecycle           |
| `Release Scheduled/Unscheduled`     | Release scheduling          |
| `Release Archived/Unarchived`       | Release archival            |
| `Release Reverted/Duplicated`       | Release management          |
| `Release Link/ID/Title Copied`      | Clipboard actions           |
| `Navigated to Releases Overview`    | Navigation                  |
| `Navigated to Scheduled Drafts`     | Navigation                  |

### Comments

| Event                       | When                             |
| --------------------------- | -------------------------------- |
| `Comment Link Copied`       | Comment link copied to clipboard |
| `Comment Viewed From Link`  | Comment opened via shared link   |
| `Comment List View Changed` | View mode toggled                |

### Tasks

| Event                             | When               |
| --------------------------------- | ------------------ |
| `Task Created/Duplicated/Removed` | Task lifecycle     |
| `Task Status Changed`             | Task state changes |
| `Task Link Copied/Opened`         | Task sharing       |

### Search

| Event                              | When                         |
| ---------------------------------- | ---------------------------- |
| `Recent Search Clicked`            | User clicks a recent search  |
| `Document List Load Time Measured` | Search performance (sampled) |

### Canvas

| Event                                | When                     |
| ------------------------------------ | ------------------------ |
| `Canvas Opened`                      | Canvas opened            |
| `Canvas Link CTA Clicked/Redirected` | Canvas link interactions |
| `Canvas Unlink CTA Clicked/Approved` | Canvas unlinking         |

### Form Interactions

| Event                                        | When               |
| -------------------------------------------- | ------------------ |
| `Portable Text Input Expanded/Collapsed`     | PTE editor state   |
| `Portable Text Invalid Value Ignore/Resolve` | PTE error handling |
| `Created Draft`                              | New draft creation |

### Divergences

A divergence session starts on the first `Inspected Divergence` event for a document and lasts while the document stays open with unresolved divergences. Each studio pane, browser tab, and device tracks its own session, so one user can hold parallel sessions for the same document. Both `Inspected Divergence` and `Acted On Divergence` carry the session id, so BigQuery can join the resolution funnel per session.

| Event                         | When                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `Inspected Divergence`        | User views a divergence in a single node                                                       |
| `Acted On Divergence`         | User resolves a divergence. Payload carries `action: 'take-upstream-value' \| 'mark-resolved'` |
| `Workspace Features Observed` | Fires once per workspace mount with the `advancedVersionControl.enabled` flag                  |

### Other

- **Copy/Paste** - Document ID and URL copied
- **Upsell dialogs** - Free trial and feature upsell interactions
- **Studio announcements** - Announcement views and interactions
- **Request permission dialogs** - Permission request flows
- **Document out-of-sync** - Divergence and conflict events
- **Document pair loading** - Loading performance metrics
- **Listener latency** - Real-time listener performance
- **Nested object editing** - Tree-editing interactions
- **Draft live edit banner** - Banner interactions
- **Focus events** - Document panel focus tracking

## Adding a New Tracked Event

1. **Create the event definition** in a `__telemetry__/` directory alongside your feature:

   ```typescript
   // src/core/myFeature/__telemetry__/myFeature.telemetry.ts
   import {defineEvent} from '@sanity/telemetry'

   interface MyEventData {
     actionType: string
   }

   export const MyFeatureUsed = defineEvent<MyEventData>({
     name: 'My Feature Used',
     version: 1,
     description: 'User interacted with my feature',
   })
   ```

2. **Log the event** from your component:

   ```typescript
   import {useTelemetry} from '@sanity/telemetry/react'
   import {MyFeatureUsed} from './__telemetry__/myFeature.telemetry'

   function MyFeature() {
     const telemetry = useTelemetry()

     const handleAction = (type: string) => {
       telemetry.log(MyFeatureUsed, {actionType: type})
     }
   }
   ```

3. For features with multiple events, consider creating a **dedicated telemetry hook** (e.g., `useMyFeatureTelemetry()`) to encapsulate all event logging for that feature.

## Testing

The telemetry provider is tested via mocks in:
`packages/sanity/src/core/studio/telemetry/__tests__/StudioTelemetryProvider.test.tsx`

In unit tests, `@sanity/telemetry` and `@sanity/telemetry/react` are mocked. Components that use `useTelemetry()` will get a no-op logger by default.
