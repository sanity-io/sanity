//! Field comments, stored the way the JS studio's comments plugin stores them: `comment`
//! documents in the dataset's add-on dataset (`test-cmts` for `test`) whose target is a weak
//! cross-dataset reference to the published id, scoped to a release by `documentVersionId`. A
//! thread is a parent comment plus the replies with its `threadId`, and resolving a thread sets
//! `status` on all of them, so threads started in either studio show in the other.

use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_client::{Client, ListenEvent, ListenOptions, random_key, sleep};
use sanity_ui::prelude::*;
use serde_json::{Map, Value, json};
use wasm_bindgen::JsCast;

use crate::config;
use crate::presence::presence;
use crate::schema::{self, title_of};
use crate::util::{start_case, time_ago, uuid};

const PROJECTION: &str = "{_id, _createdAt, authorId, message, threadId, parentCommentId, status, lastEditedAt, \"field\": target.path.field, \"version\": target.documentVersionId}";

#[derive(Clone, Debug, PartialEq)]
pub struct Comment {
    pub id: String,
    pub created_at: String,
    pub author_id: String,
    pub text: String,
    pub thread_id: String,
    pub parent_id: Option<String>,
    pub status: String,
    pub field: String,
    pub version: Option<String>,
    pub edited_at: Option<String>,
}

impl Comment {
    pub fn from_json(value: &Value) -> Option<Comment> {
        let text =
            |key: &str| value.get(key).and_then(Value::as_str).filter(|text| !text.is_empty()).map(str::to_owned);
        Some(Comment {
            id: text("_id")?,
            created_at: text("_createdAt").unwrap_or_default(),
            author_id: text("authorId").unwrap_or_default(),
            text: value.get("message").map(message_text).unwrap_or_default(),
            thread_id: text("threadId")?,
            parent_id: text("parentCommentId"),
            status: text("status").unwrap_or_else(|| "open".into()),
            // Projected by `PROJECTION`, or read from the whole document a listener event carries.
            field: text("field")
                .or_else(|| value.pointer("/target/path/field").and_then(Value::as_str).map(str::to_owned))
                .unwrap_or_default(),
            version: text("version")
                .or_else(|| value.pointer("/target/documentVersionId").and_then(Value::as_str).map(str::to_owned)),
            edited_at: text("lastEditedAt"),
        })
    }
}

/// A thread: its first comment, then the replies, oldest first.
#[derive(Clone, Debug, PartialEq)]
pub struct Thread {
    pub id: String,
    pub field: String,
    pub status: String,
    pub comments: Vec<Comment>,
}

/// The text of a comment message, mentions read as `@user`.
pub fn message_text(message: &Value) -> String {
    message
        .as_array()
        .into_iter()
        .flatten()
        .map(|block| {
            block
                .get("children")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
                .map(|child| match child.get("_type").and_then(Value::as_str) {
                    Some("mention") => format!("@{}", child.get("userId").and_then(Value::as_str).unwrap_or("user")),
                    _ => child.get("text").and_then(Value::as_str).unwrap_or_default().to_owned(),
                })
                .collect::<String>()
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// A comment message: one Portable Text block per line.
pub fn message(text: &str) -> Value {
    Value::Array(
        text.trim()
            .lines()
            .map(|line| {
                json!({
                    "_type": "block",
                    "_key": random_key(12),
                    "style": "normal",
                    "markDefs": [],
                    "children": [{"_type": "span", "_key": random_key(12), "text": line, "marks": []}],
                })
            })
            .collect(),
    )
}

/// Groups comments into threads, newest thread first, keeping those of `release` (or of the
/// draft when there is none).
pub fn threads(comments: &[Comment], release: Option<&str>) -> Vec<Thread> {
    let mut threads: Vec<Thread> = Vec::new();
    let mut sorted: Vec<&Comment> = comments.iter().filter(|comment| comment.version.as_deref() == release).collect();
    sorted.sort_by(|a, b| a.created_at.cmp(&b.created_at));
    for comment in sorted {
        match threads.iter_mut().find(|thread| thread.id == comment.thread_id) {
            Some(thread) => thread.comments.push(comment.clone()),
            None => threads.push(Thread {
                id: comment.thread_id.clone(),
                field: comment.field.clone(),
                status: comment.status.clone(),
                comments: vec![comment.clone()],
            }),
        }
    }
    // A thread starts with its parent; its status is the parent's.
    for thread in &mut threads {
        thread.comments.sort_by_key(|comment| comment.parent_id.is_some());
        if let Some(parent) = thread.comments.first() {
            thread.status = parent.status.clone();
            thread.field = parent.field.clone();
        }
    }
    threads.reverse();
    threads
}

thread_local! {
    static ADDON_DATASET: std::cell::RefCell<Option<String>> = const { std::cell::RefCell::new(None) };
}

/// A client for the add-on dataset, which the first comment on a dataset without one sets up.
async fn addon_client(setup: bool) -> sanity_client::Result<Option<Client>> {
    let client = crate::store::store().client();
    if let Some(name) = ADDON_DATASET.with_borrow(Clone::clone) {
        return Ok(Some(client.with_dataset(&name)));
    }
    let mut name = client.addon_dataset().await?;
    if name.is_none() && setup {
        name = match client.setup_addon_dataset().await {
            Ok(name) => name,
            // Another studio set it up first.
            Err(err) => client.addon_dataset().await?.ok_or(err).map(Some)?,
        };
    }
    if let Some(name) = &name {
        ADDON_DATASET.set(Some(name.clone()));
    }
    Ok(name.map(|name| client.with_dataset(&name)))
}

/// Commits comment mutations, retrying when the request failed in a way a later attempt may
/// not. The transaction id stays the same, so an attempt that did land is not applied twice.
async fn commit(mutations: Vec<Value>, tag: &str) -> sanity_client::Result<Value> {
    let Some(client) = addon_client(true).await? else {
        return Err(sanity_client::Error { status: None, message: "The comments dataset could not be set up".into() });
    };
    let transaction = uuid();
    let mut attempt = 0;
    loop {
        match client.mutate(mutations.clone(), &transaction, tag).await {
            Err(err) if err.is_retriable() && attempt < 3 => {
                sleep(sanity_client::retry_delay(attempt)).await;
                attempt += 1;
            }
            // The retried transaction already landed.
            Err(err) if attempt > 0 && err.status == Some(409) => return Ok(Value::Null),
            result => return result,
        }
    }
}

/// The comments of the document a pane shows, shared with the fields of its form.
#[derive(Clone, Copy)]
pub struct Comments {
    published: StoredValue<String>,
    type_name: StoredValue<String>,
    release: Signal<Option<String>>,
    doc: Memo<Option<Value>>,
    list: RwSignal<Vec<Comment>>,
    pub loaded: RwSignal<Option<Result<(), String>>>,
    /// The field the inspector composes a new thread for.
    pub field: RwSignal<Option<String>>,
    open: Callback<()>,
}

impl Comments {
    /// Loads the comments of `published` and keeps them current while the calling component
    /// lives, then provides them to the components below it.
    pub fn provide(
        published: String,
        type_name: String,
        release: Signal<Option<String>>,
        doc: Memo<Option<Value>>,
        open: Callback<()>,
    ) -> Comments {
        let comments = Comments {
            published: StoredValue::new(published.clone()),
            type_name: StoredValue::new(type_name),
            release,
            doc,
            list: RwSignal::new(Vec::new()),
            loaded: RwSignal::new(None),
            field: RwSignal::new(None),
            open,
        };
        let listener = StoredValue::new_local(None::<sanity_client::Listener>);
        on_cleanup(move || listener.dispose());
        spawn_local(async move {
            let client = match addon_client(false).await {
                Ok(Some(client)) => client,
                Ok(None) => {
                    let _ = comments.loaded.try_set(Some(Ok(())));
                    return;
                }
                Err(err) => {
                    let _ = comments.loaded.try_set(Some(Err(err.to_string())));
                    return;
                }
            };
            let load = {
                let (client, published) = (client.clone(), published.clone());
                move || {
                    let (client, published) = (client.clone(), published.clone());
                    spawn_local(async move {
                        let query = format!("*[_type == \"comment\" && target.document._ref == $id] {PROJECTION}");
                        let params = Map::from_iter([("id".to_owned(), json!(published))]);
                        match client.query(&query, &params, "comments.list").await {
                            Ok(rows) => {
                                let list: Vec<Comment> =
                                    rows.as_array().into_iter().flatten().filter_map(Comment::from_json).collect();
                                let _ = comments.list.try_set(list);
                                let _ = comments.loaded.try_set(Some(Ok(())));
                            }
                            Err(err) => {
                                let _ = comments.loaded.try_set(Some(Err(err.to_string())));
                            }
                        }
                    });
                }
            };
            // Like the JS comments store: the list is fetched when the listener connects, then kept
            // current from the documents its events carry. Querying again after an event can
            // return the list from before it.
            let options =
                ListenOptions { include_result: true, include_all_versions: true, tag: "comments.listen".into() };
            let params = Map::from_iter([("id".to_owned(), json!(published))]);
            let started = client.listen(
                "*[_type == \"comment\" && target.document._ref == $id]",
                params,
                options,
                move |event| match event {
                    ListenEvent::Welcome { .. } => load(),
                    ListenEvent::Mutation(event) => {
                        let _ = comments.list.try_update(|list| {
                            list.retain(|comment| comment.id != event.document_id);
                            if let Some(comment) = event.result.as_ref().and_then(Comment::from_json) {
                                list.push(comment);
                            }
                        });
                    }
                    _ => {}
                },
            );
            // A pane closed while the add-on dataset was looked up drops the listener here.
            let _ = listener.try_update_value(move |slot| *slot = Some(started));
        });
        provide_context(comments);
        comments
    }

    pub fn threads(&self) -> Vec<Thread> {
        let release = self.release.get();
        self.list.with(|list| threads(list, release.as_deref()))
    }

    pub fn open_threads(&self, field: &str) -> usize {
        self.threads().iter().filter(|thread| thread.field == field && thread.status == "open").count()
    }

    pub fn open_inspector(&self, field: Option<String>) {
        self.field.set(field);
        self.open.run(());
    }

    /// Posts a comment: a new thread on `field`, or a reply in `thread`.
    pub fn post(&self, field: String, text: String, thread: Option<Thread>) {
        let Some(author) = presence().current_user_id() else { return };
        let id = uuid();
        let (thread_id, parent_id, length) = match &thread {
            Some(thread) => {
                (thread.id.clone(), thread.comments.first().map(|parent| parent.id.clone()), thread.comments.len() + 1)
            }
            None => (uuid(), None, 1),
        };
        let published = self.published.get_value();
        let type_name = self.type_name.get_value();
        let release = self.release.get_untracked();
        let (title, revision) = self.doc.with_untracked(|doc| {
            let text = |key: &str| {
                doc.as_ref().and_then(|doc| doc.get(key)).and_then(Value::as_str).unwrap_or_default().to_owned()
            };
            (text("title").chars().take(120).collect::<String>(), text("_rev"))
        });
        let origin = web_sys::window().and_then(|window| window.location().origin().ok()).unwrap_or_default();
        let url = format!(
            "{origin}/{}/intent/edit/id={published};type={type_name};path={}/?comment={id}",
            config::WORKSPACE,
            js_sys::encode_uri_component(&field)
        );
        let mut target = json!({
            "documentRevisionId": revision,
            "path": {"field": field},
            "document": {
                "_dataset": config::DATASET,
                "_projectId": config::PROJECT_ID,
                "_ref": published,
                "_type": "crossDatasetReference",
                "_weak": true,
            },
            "documentType": type_name,
        });
        if let Some(release) = &release {
            target["documentVersionId"] = json!(release);
        }
        let mut doc = json!({
            "_id": id,
            "_type": "comment",
            "authorId": author,
            "message": message(&text),
            "status": thread.as_ref().map_or("open", |thread| if thread.status == "resolved" { "resolved" } else { "open" }),
            "threadId": thread_id,
            "reactions": [],
            "context": {
                "payload": {"workspace": config::WORKSPACE},
                "notification": {
                    "currentThreadLength": length,
                    "documentTitle": title,
                    "url": url,
                    "workspaceTitle": config::WORKSPACE_TITLE,
                    "workspaceName": config::WORKSPACE,
                },
                "tool": "structure",
            },
            "target": target,
        });
        if let Some(parent) = &parent_id {
            doc["parentCommentId"] = json!(parent);
        }
        let now = js_sys::Date::new_0().to_iso_string().as_string().unwrap_or_default();
        let optimistic = Comment {
            id: id.clone(),
            created_at: now,
            author_id: author,
            text: text.trim().to_owned(),
            thread_id,
            parent_id,
            status: doc["status"].as_str().unwrap_or("open").to_owned(),
            field,
            version: release,
            edited_at: None,
        };
        self.list.update(|list| list.push(optimistic));
        let list = self.list;
        spawn_local(async move {
            if let Err(err) = commit(vec![json!({"create": doc})], "comments.create").await {
                let _ = list.try_update(|list| list.retain(|comment| comment.id != id));
                crate::store::store().error("Could not post the comment", err.to_string());
            }
        });
    }

    /// Resolves or reopens a thread: the status of every comment in it.
    pub fn set_status(&self, thread: &Thread, status: &'static str) {
        let ids: Vec<String> = thread.comments.iter().map(|comment| comment.id.clone()).collect();
        self.list.update(|list| {
            for comment in list.iter_mut().filter(|comment| ids.contains(&comment.id)) {
                comment.status = status.to_owned();
            }
        });
        spawn_local(async move {
            let mutations = ids.iter().map(|id| json!({"patch": {"id": id, "set": {"status": status}}})).collect();
            if let Err(err) = commit(mutations, "comments.status").await {
                crate::store::store().error("Could not update the thread", err.to_string());
            }
        });
    }

    /// Deletes a comment, and its replies when it starts a thread.
    pub fn delete(&self, thread: &Thread, comment: &Comment) {
        let ids: Vec<String> = if comment.parent_id.is_none() {
            thread.comments.iter().map(|comment| comment.id.clone()).collect()
        } else {
            vec![comment.id.clone()]
        };
        self.list.update(|list| list.retain(|comment| !ids.contains(&comment.id)));
        spawn_local(async move {
            let mutations = ids.iter().map(|id| json!({"delete": {"id": id}})).collect();
            if let Err(err) = commit(mutations, "comments.delete").await {
                crate::store::store().error("Could not delete the comment", err.to_string());
            }
        });
    }

    /// The title of a commented field: the schema titles of its path.
    pub fn field_title(&self, field: &str) -> String {
        let schema = schema::current();
        let type_name = self.type_name.get_value();
        let mut parts = Vec::new();
        let mut fields = schema.get(&type_name).map(|def| def.fields.clone()).unwrap_or_default();
        for name in field.split('.').map(|segment| segment.split('[').next().unwrap_or(segment)) {
            if name.is_empty() {
                continue;
            }
            match fields.iter().find(|candidate| candidate.name == name).cloned() {
                Some(def) => {
                    parts.push(title_of(&def));
                    fields = schema.resolve(&def).fields.to_vec();
                }
                None => {
                    parts.push(start_case(name));
                    fields = Vec::new();
                }
            }
        }
        parts.join(" / ")
    }
}

/// Scrolls the form to the field of `path` and focuses its first input.
fn reveal_field(path: &str) {
    let Some(document) = web_sys::window().and_then(|window| window.document()) else { return };
    let selector = format!("[data-path=\"{}\"]", path.replace('\\', "\\\\").replace('"', "\\\""));
    if let Ok(Some(element)) = document.query_selector(&selector) {
        element.scroll_into_view_with_bool(false);
        if let Ok(Some(input)) = element.query_selector("input, textarea, [contenteditable=\"true\"]")
            && let Ok(input) = input.dyn_into::<web_sys::HtmlElement>()
        {
            let _ = input.focus();
        }
    }
}

/// The comment button in a field's header, with the number of open threads on the field.
#[component]
pub fn FieldCommentButton(#[prop(into)] path: String) -> impl IntoView {
    let Some(comments) = use_context::<Comments>() else { return ().into_any() };
    let count = {
        let path = path.clone();
        Memo::new(move |_| comments.open_threads(&path))
    };
    let title = Signal::derive(move || match count.get() {
        0 => "Add comment".to_owned(),
        1 => "1 open comment thread".to_owned(),
        count => format!("{count} open comment threads"),
    });
    let style = move || {
        format!(
            "display: inline-flex; align-items: center; gap: 4px; border: 0; background: none; cursor: pointer; padding: 2px 4px; border-radius: 3px; font: inherit; color: {}; opacity: {};",
            if count.get() > 0 { "var(--card-badge-primary-fg-color)" } else { "var(--card-muted-fg-color)" },
            if count.get() > 0 { "1" } else { "0.6" },
        )
    };
    let test_id = format!("comment-button-{path}");
    view! {
        <button
            type="button"
            data-testid=test_id
            title=title
            style=style
            on:click=move |_| comments.open_inspector(Some(path.clone()))
        >
            <Text size=1><Icon icon=IconName::Comment /></Text>
            {move || {
                let count = count.get();
                (count > 0).then(|| view! { <Text size=1 weight=FontWeight::Medium>{count.to_string()}</Text> })
            }}
        </button>
    }
    .into_any()
}

#[component]
fn CommentItem(comment: Comment, thread: Thread, comments: Comments) -> impl IntoView {
    let author = comment.author_id.clone();
    let user = Signal::derive(move || presence().user(&author));
    let hue = presence().hue(&comment.author_id);
    let own = presence().current_user_id().as_deref() == Some(comment.author_id.as_str());
    let is_parent = comment.parent_id.is_none();
    let resolved = thread.status == "resolved";
    let (thread_for_status, thread_for_delete, deleted) = (thread.clone(), thread, comment.clone());
    view! {
        <Stack space=2 attr:data-testid="comment">
            <Flex align="center" gap=2>
                {move || {
                    let user = user.get();
                    let initials = user.as_ref().map(|user| user.initials()).unwrap_or_default();
                    view! {
                        <Avatar
                            src=user.as_ref().and_then(|user| user.image.clone())
                            initials=initials
                            hue=hue
                            size=0
                            title=user.as_ref().map(|user| user.name.clone())
                        />
                    }
                }}
                <Flex flex=1 gap=2 align="center" style="min-width: 0;">
                    <Box style="min-width: 0;">
                        <Text size=1 weight=FontWeight::Semibold ellipsis=true>
                            {move || user.get().map(|user| user.name).unwrap_or_else(|| "Loading…".into())}
                        </Text>
                    </Box>
                    <div style="flex: none; white-space: nowrap;">
                        <Text size=0 muted=true>{time_ago(&comment.created_at)}</Text>
                    </div>
                </Flex>
                {is_parent.then(|| view! {
                    <Button
                        mode=ButtonMode::Bleed
                        padding=Pad::all(1)
                        font_size=1
                        icon=if resolved { IconName::Restore } else { IconName::CheckmarkCircle }
                        title=if resolved { "Reopen thread" } else { "Mark as resolved" }
                        attr:data-testid=if resolved { "reopen-thread" } else { "resolve-thread" }
                        on_click=Callback::new(move |_| comments.set_status(&thread_for_status, if resolved { "open" } else { "resolved" }))
                    />
                })}
                {own.then(|| view! {
                    <Button
                        mode=ButtonMode::Bleed
                        tone=StateTone::Critical
                        padding=Pad::all(1)
                        font_size=1
                        icon=IconName::Trash
                        title="Delete comment"
                        on_click=Callback::new(move |_| comments.delete(&thread_for_delete, &deleted))
                    />
                })}
            </Flex>
            <div style="padding-left: 2rem; white-space: pre-wrap; word-break: break-word;">
                <Text size=1>{comment.text.clone()}</Text>
            </div>
        </Stack>
    }
}

#[component]
fn Composer(
    #[prop(into)] placeholder: String,
    #[prop(into)] button: String,
    #[prop(into)] on_post: Callback<String>,
    #[prop(optional)] autofocus: bool,
) -> impl IntoView {
    let text = RwSignal::new(String::new());
    let node = NodeRef::<leptos::html::Textarea>::new();
    if autofocus {
        Effect::new(move |_| {
            if let Some(node) = node.get() {
                let _ = node.focus();
            }
        });
    }
    let post = move || {
        let value = text.get_untracked();
        if !value.trim().is_empty() {
            on_post.run(value);
            text.set(String::new());
        }
    };
    view! {
        <Stack space=2>
            <div
                on:keydown=move |event: web_sys::KeyboardEvent| {
                    if event.key() == "Enter" && (event.meta_key() || event.ctrl_key()) {
                        event.prevent_default();
                        post();
                    }
                }
            >
                <TextArea
                    value=Signal::derive(move || text.get())
                    on_input=Callback::new(move |value| text.set(value))
                    placeholder=placeholder
                    rows=2
                    font_size=1
                    node_ref=node
                    attr:data-testid="comment-input"
                />
            </div>
            <Flex justify="flex-end">
                <Button
                    tone=StateTone::Primary
                    font_size=1
                    padding=Pad::xy(3, 2)
                    text=button
                    attr:data-testid="post-comment"
                    disabled=Signal::derive(move || text.with(|text| text.trim().is_empty()))
                    on_click=Callback::new(move |_| post())
                />
            </Flex>
        </Stack>
    }
}

/// The comments inspector of a document pane: the threads of the document, open or resolved,
/// and a composer for a new thread on the field whose comment button was clicked.
#[component]
pub fn CommentsInspector(comments: Comments, #[prop(into)] on_close: Callback<()>) -> impl IntoView {
    let tab = RwSignal::new("open");
    let field = comments.field;
    let composer = move || {
        field.get().map(|path| {
            let title = comments.field_title(&path);
            let post_path = path.clone();
            view! {
                <Card border=true radius=2 padding=Pad::all(3) attr:data-testid="new-thread">
                    <Stack space=3>
                        <Flex align="center" gap=2>
                            <Box flex=1>
                                <Text size=1 weight=FontWeight::Medium>{format!("New comment on {title}")}</Text>
                            </Box>
                            <Button mode=ButtonMode::Bleed padding=Pad::all(1) font_size=1 icon=IconName::Close title="Cancel"
                                on_click=Callback::new(move |_| field.set(None)) />
                        </Flex>
                        <Composer
                            placeholder="Add a comment…"
                            button="Comment"
                            autofocus=true
                            on_post=Callback::new(move |text: String| {
                                comments.post(post_path.clone(), text, None);
                                field.set(None);
                                tab.set("open");
                            })
                        />
                    </Stack>
                </Card>
            }
        })
    };
    let list = move || {
        if let Some(Err(err)) = comments.loaded.get() {
            return view! { <Box padding=Pad::all(3)><Text size=1 muted=true>{format!("Comments are unavailable: {err}")}</Text></Box> }.into_any();
        }
        if comments.loaded.get().is_none() {
            return view! { <Flex justify="center" padding=Pad::all(4)><Spinner muted=true /></Flex> }.into_any();
        }
        let status = tab.get();
        let threads: Vec<Thread> = comments.threads().into_iter().filter(|thread| thread.status == status).collect();
        if threads.is_empty() {
            let empty = if status == "open" {
                "No open comments yet. Use the comment button next to a field to start a thread."
            } else {
                "No resolved comments."
            };
            return view! { <Box padding=Pad::all(3)><Text size=1 muted=true>{empty}</Text></Box> }.into_any();
        }
        threads
            .into_iter()
            .map(|thread| {
                let title = comments.field_title(&thread.field);
                let reveal = thread.field.clone();
                let reply_thread = thread.clone();
                let resolved = thread.status == "resolved";
                let items = thread
                    .comments
                    .iter()
                    .cloned()
                    .map(|comment| view! { <CommentItem comment=comment thread=thread.clone() comments=comments /> })
                    .collect_view();
                view! {
                    <Card border=true radius=2 padding=Pad::all(3) attr:data-testid="comment-thread" attr:data-thread-field=thread.field.clone()>
                        <Stack space=3>
                            <button
                                type="button"
                                title="Go to field"
                                style="border: 0; background: none; padding: 0; cursor: pointer; text-align: left; font: inherit; color: inherit;"
                                on:click=move |_| reveal_field(&reveal)
                            >
                                <Text size=1 muted=true weight=FontWeight::Medium>{title}</Text>
                            </button>
                            {items}
                            {(!resolved).then(|| view! {
                                <Composer
                                    placeholder="Reply…"
                                    button="Reply"
                                    on_post=Callback::new(move |text: String| {
                                        comments.post(reply_thread.field.clone(), text, Some(reply_thread.clone()))
                                    })
                                />
                            })}
                        </Stack>
                    </Card>
                }
            })
            .collect_view()
            .into_any()
    };
    let tab_button = move |value: &'static str, label: &'static str| {
        view! {
            <Button
                mode=ButtonMode::Bleed
                font_size=1
                padding=Pad::xy(2, 1)
                text=label
                selected=Signal::derive(move || tab.get() == value)
                attr:data-testid=format!("comments-tab-{value}")
                on_click=Callback::new(move |_| tab.set(value))
            />
        }
    };
    view! {
        <Flex direction="column" height="fill" attr:data-testid="comments-inspector">
            <Card border_bottom=true padding=Pad::xy(3, 2) style="flex: none;">
                <Flex align="center" gap=2>
                    <Box flex=1 padding=Pad::xy(1, 0)>
                        <Text size=1 weight=FontWeight::Semibold>"Comments"</Text>
                    </Box>
                    {tab_button("open", "Open")}
                    {tab_button("resolved", "Resolved")}
                    <Button mode=ButtonMode::Bleed icon=IconName::Close title="Close comments" on_click=Callback::new(move |_| on_close.run(())) />
                </Flex>
            </Card>
            <Box flex=1 overflow="auto" style="min-height: 0;">
                <Stack space=2 padding=Pad::all(2)>
                    {composer}
                    {list}
                </Stack>
            </Box>
        </Flex>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn comment(
        id: &str,
        thread: &str,
        parent: Option<&str>,
        created: &str,
        status: &str,
        version: Option<&str>,
    ) -> Comment {
        Comment {
            id: id.into(),
            created_at: created.into(),
            author_id: "u".into(),
            text: id.into(),
            thread_id: thread.into(),
            parent_id: parent.map(Into::into),
            status: status.into(),
            field: "title".into(),
            version: version.map(Into::into),
            edited_at: None,
        }
    }

    #[test]
    fn groups_threads_by_version() {
        let list = vec![
            comment("a", "t1", None, "2026-01-01", "resolved", None),
            comment("b", "t1", Some("a"), "2026-01-02", "open", None),
            comment("c", "t2", None, "2026-01-03", "open", None),
            comment("d", "t3", None, "2026-01-04", "open", Some("rabc")),
        ];
        let drafts = threads(&list, None);
        assert_eq!(drafts.iter().map(|thread| thread.id.as_str()).collect::<Vec<_>>(), ["t2", "t1"]);
        assert_eq!(drafts[1].status, "resolved");
        assert_eq!(drafts[1].comments.iter().map(|comment| comment.id.as_str()).collect::<Vec<_>>(), ["a", "b"]);
        assert_eq!(threads(&list, Some("rabc")).len(), 1);
    }

    #[test]
    fn reads_and_writes_messages() {
        let value = message("Hello\nworld ");
        assert_eq!(value.as_array().map(Vec::len), Some(2));
        assert_eq!(message_text(&value), "Hello\nworld");
        let mention = json!([{"_type": "block", "children": [{"_type": "span", "text": "Hi "}, {"_type": "mention", "userId": "p1"}]}]);
        assert_eq!(message_text(&mention), "Hi @p1");
    }
}
