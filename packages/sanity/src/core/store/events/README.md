# Document group Events

## Events API

The **Events API** introduces a new mechanism for accessing `DocumentGroupEvent` entries derived from the translog. These events are accessible through the endpoint:

This events are accessible through:

```
/data/history/<datasetName>/events/documents/<documentsIds>
```

This API is designed to be lightweight, providing only the essential data required to render the UI. Additionally, it offers insights into the document variants impacted by each event.

## Pre read

With the introduction of releases, users now select the `DocumentVariantType` (`draft | published | version`) they wish to work with in the form. This represents a significant shift from the previous behavior, where users interacted only with two types of documents `published` or `draft —without the ability to focus on one or the other independently.

## How `useEventsStore` works:

When a user visits a document, the `useEventsStore` retrieves events relevant to the selected document variant (`draft`, `version`, or `published`). It also sets up a listener using `getRemoteTransactions` to monitor real-time transactions for the document.

When a new transaction is received, the system determines whether to reload the events or append the transaction to the existing event list. This decision depends on the transaction type and the specific document variant.

The retrieved events are displayed in the **History Inspector**. To render a **diff**, the system uses the `getChangesList` function, which fetches the transactions between two selected document revisions (`since` and `revision`). This process involves:

1. Retrieving the full documents for the specified revisions from the history endpoint.
2. Comparing the two documents to identify differences.
3. Fetching transactions to enable attribution rendering, showing detailed information about who made the changes, what was modified, and when.

## How it worked before:

Previously, we used the `Timeline` class, which always fetched transactions from the translog. It also set up listeners for incoming transactions, using both the draft and published IDs. The system then mapped these transactions into human-readable events like **edit**, **publish**, or **live edit**.

### Why this is changing

The previous approach was tailored to a simpler model with only two variants (`draft` and `published`). It displayed the changes for both document types in a unified view. However, this model does not align with the new paradigm of multiple document variants.

Now, each document variant has its own dedicated view, showing only the changes relevant to that specific variant.

Key updates:

- **Draft document:** Shows only changes made to the `draft`.
- **Version document:** Displays changes specific to the selected version.
- **Published document:** Includes changes made to the `published` document, specifying whether the change originated from publishing a `draft` or `version`, or from a `live edit`.

## Types of Events and Document Lifecycle

Each event represents a significant state change in the lifecycle of a document, its versions, and its published state. These events help to track the creation, modification, scheduling, publication and deletion of documents.

### **Version variant Lifecycle**

A version variant is document that has an id which starts with `versions.` is a short-lived document that undergoes creation, editing, and publication or deletion. Once published, the same ID will not be reused for a new version. The events affecting a version include:

- **`CreateDocumentVersionEvent`**: Triggered when a version is created.
- **`DeleteDocumentVersionEvent`**: Occurs if a version is deleted, though this is uncommon.
- **`PublishDocumentVersionEvent`**: Marks the publication of the version as part of a release.
- **`ScheduleDocumentVersionEvent`** _(not implemented yet)_: Indicates that the version's release has been scheduled.
- **`UnscheduleDocumentVersionEvent`** _(not implemented yet)_: Indicates that the version's release has been unscheduled.
- **`EditDocumentVersionEvent`**: Triggered when the version is edited.

### **Draft Document**

Draft documents are long-lived documents, which could be published and recreated multiple times. Events specific to drafts include:

- **`CreateDocumentVersionEvent`**: Occurs when a new draft is created, after publishing or deleting a document.
- **`DeleteDocumentVersionEvent`**: Triggered when a draft is discarded.
- **`PublishDocumentVersionEvent`**: Indicates that the draft has been published, either through manual action or a scheduled release.
- **`ScheduleDocumentVersionEvent`** _(not implemented yet)_: Indicates that the draft has been scheduled for publication.
- **`UnscheduleDocumentVersionEvent`** _(not implemented yet)_: Indicates that a scheduled draft has been unscheduled.
- **`EditDocumentVersionEvent`**: Triggered when edits are made to the draft.

### **Published Document**

Published documents represent the live, publicly available version of a document. Events specific to published documents include:

- **`UnpublishDocumentEvent`**: Triggered when the document is unpublished. This deletes the live document and creates a draft with the published document's data if no draft exists.
- **`CreateLiveDocumentEvent`**: Occurs when a live document is created outside the typical publish action, such as through live edits or API-created documents.
- **`UpdateLiveDocumentEvent`**: Triggered when a live document is edited directly, typically in live edit workflows or through API actions bypassing the publish process.
- **`PublishDocumentVersionEvent`**: Captures when a `draft` or `version` document is published. This event includes details such as the ID and revision of the document that initiated the modification.

### **Edit Event**

The **Edit Event** is a special case. It is not returned directly by the API but is generated within the Studio by:

1. Fetching transactions from the translog.
2. Processing new transactions as they are received in real-time through change listeners.
