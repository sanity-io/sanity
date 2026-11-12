//! Document history, like the JS studio's history inspector: a timeline of the transactions
//! that touched the document, read from the history API, any revision of which the form can show
//! and restore, and the changes the edited document has against a base revision field by field
//! (the published document unless a revision is selected), each of which can be reverted.

use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_mutator::dmp::{self, Op};
use sanity_mutator::{PatchOp, Segment};
use sanity_ui::prelude::*;
use serde_json::Value;

use crate::presence::presence;
use crate::schema::{self, title_of};
use crate::store::store;
use crate::util::{draft_id, time_ago, version_id};

const TIMELINE_LIMIT: usize = 50;
/// Edits by the same author closer together than this make one entry, like the JS timeline's
/// edit sessions.
const SESSION_GAP_MS: f64 = 5.0 * 60.0 * 1000.0;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EventKind {
    Created,
    Edited,
    Published,
    Unpublished,
    Discarded,
    Deleted,
}

impl EventKind {
    fn label(self) -> &'static str {
        match self {
            EventKind::Created => "Created",
            EventKind::Edited => "Edited",
            EventKind::Published => "Published",
            EventKind::Unpublished => "Unpublished",
            EventKind::Discarded => "Discarded draft",
            EventKind::Deleted => "Deleted",
        }
    }

    fn icon(self) -> IconName {
        match self {
            EventKind::Created => IconName::Add,
            EventKind::Edited => IconName::Edit,
            EventKind::Published => IconName::Publish,
            EventKind::Unpublished => IconName::Unpublish,
            EventKind::Discarded => IconName::Revert,
            EventKind::Deleted => IconName::Trash,
        }
    }

    fn tone(self) -> &'static str {
        match self {
            EventKind::Published => "positive",
            EventKind::Unpublished | EventKind::Deleted => "critical",
            _ => "caution",
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct Event {
    /// The last transaction of the entry, whose result the entry shows.
    pub revision: String,
    pub timestamp: String,
    pub author: String,
    pub kind: EventKind,
    /// The document the entry's revision is read from.
    pub document_id: String,
}

/// A revision the form shows instead of the edited document.
#[derive(Clone, Debug, PartialEq)]
pub struct Revision {
    pub event: Event,
    pub doc: Option<Value>,
}

/// Reads the timeline from transactions, newest first. `edited` is the draft, or the version
/// in a release, and `published` the published document.
pub fn events(transactions: &[Value], edited: &str, published: &str) -> Vec<Event> {
    let mut events: Vec<Event> = Vec::new();
    for tx in transactions {
        let text = |key: &str| tx.get(key).and_then(Value::as_str).unwrap_or_default().to_owned();
        let mutations: Vec<(&str, &str)> = tx
            .get("mutations")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(|mutation| {
                let (kind, body) = mutation.as_object()?.iter().next()?;
                let id = body.get("id").or_else(|| body.get("_id")).and_then(Value::as_str)?;
                Some((kind.as_str(), id))
            })
            .collect();
        let has = |id: &str, kind: Option<&str>| {
            mutations.iter().any(|(mutation, target)| *target == id && kind.is_none_or(|kind| kind == *mutation))
        };
        let touches = |id: &str| has(id, None);
        let deletes = |id: &str| has(id, Some("delete"));
        let creates = |id: &str| has(id, Some("create"));
        let (kind, document_id) = match (touches(edited), touches(published)) {
            (true, true) if deletes(published) => (EventKind::Unpublished, edited),
            (true, true) => (EventKind::Published, published),
            (false, true) if deletes(published) => (EventKind::Deleted, published),
            (false, true) => (EventKind::Edited, published),
            (true, false) if deletes(edited) => (EventKind::Discarded, published),
            (true, false) if creates(edited) => (EventKind::Created, edited),
            (true, false) => (EventKind::Edited, edited),
            (false, false) => continue,
        };
        let event = Event {
            revision: text("id"),
            timestamp: text("timestamp"),
            author: text("author"),
            kind,
            document_id: document_id.to_owned(),
        };
        // Newest first: an older edit by the same author shortly before joins the newer entry,
        // which keeps the revision it ends on.
        if let Some(last) = events.last()
            && last.kind == EventKind::Edited
            && kind == EventKind::Edited
            && last.author == event.author
            && last.document_id == event.document_id
            && js_sys::Date::parse(&last.timestamp) - js_sys::Date::parse(&event.timestamp) < SESSION_GAP_MS
        {
            continue;
        }
        events.push(event);
    }
    events
}

/// A changed top-level field of the document.
#[derive(Clone, Debug, PartialEq)]
pub struct FieldChange {
    pub name: String,
    pub title: String,
    pub before: Option<Value>,
    pub after: Option<Value>,
}

/// The top-level fields that differ between `base` and `current`, in schema order, then any
/// other fields that differ.
pub fn changes(type_name: &str, base: Option<&Value>, current: Option<&Value>) -> Vec<FieldChange> {
    let schema = schema::current();
    let field =
        |doc: Option<&Value>, name: &str| doc.and_then(|doc| doc.get(name)).filter(|value| !value.is_null()).cloned();
    let mut names: Vec<(String, String)> = schema
        .get(type_name)
        .map(|def| def.fields.iter().map(|field| (field.name.clone(), title_of(field))).collect())
        .unwrap_or_default();
    for doc in [base, current].into_iter().flatten() {
        for key in doc.as_object().into_iter().flat_map(|map| map.keys()) {
            if !key.starts_with('_') && !names.iter().any(|(name, _)| name == key) {
                names.push((key.clone(), crate::util::start_case(key)));
            }
        }
    }
    names
        .into_iter()
        .filter_map(|(name, title)| {
            let (before, after) = (field(base, &name), field(current, &name));
            (before != after).then_some(FieldChange { name, title, before, after })
        })
        .collect()
}

/// The text a value reads as in a diff: strings as they are, Portable Text as its blocks' text.
fn text_of(value: &Value) -> Option<String> {
    match value {
        Value::String(text) => Some(text.clone()),
        Value::Number(number) => Some(number.to_string()),
        Value::Bool(flag) => Some(if *flag { "True" } else { "False" }.to_owned()),
        Value::Array(items) if items.iter().all(|item| item.get("_type").and_then(Value::as_str) == Some("block")) => {
            Some(
                items
                    .iter()
                    .map(|block| {
                        block
                            .get("children")
                            .and_then(Value::as_array)
                            .into_iter()
                            .flatten()
                            .filter_map(|child| child.get("text").and_then(Value::as_str))
                            .collect::<String>()
                    })
                    .collect::<Vec<_>>()
                    .join("\n"),
            )
        }
        _ => None,
    }
}

fn summary(value: &Value) -> String {
    match value {
        Value::Array(items) => format!("{} item{}", items.len(), if items.len() == 1 { "" } else { "s" }),
        Value::Object(map) => {
            if let Some(reference) = map.get("_ref").and_then(Value::as_str) {
                return format!("Reference to {reference}");
            }
            if let Some(asset) = value.pointer("/asset/_ref").and_then(Value::as_str) {
                return asset.split('-').take(2).collect::<Vec<_>>().join("-");
            }
            let text = serde_json::to_string(value).unwrap_or_default();
            if text.len() > 80 { format!("{}…", &text[..text.floor_char_boundary(80)]) } else { text }
        }
        other => text_of(other).unwrap_or_default(),
    }
}

/// An inline diff of two texts: removed text struck through on red, added text on green, like
/// the JS studio's string diff.
#[component]
fn TextDiff(before: String, after: String) -> impl IntoView {
    let diffs = dmp::cleanup_semantic(dmp::diff(&dmp::utf16(&before), &dmp::utf16(&after), false));
    let parts = diffs
        .into_iter()
        .map(|dmp::Diff(op, units)| {
            let text = dmp::to_string(&units);
            match op {
                Op::Equal => view! { <span>{text}</span> }.into_any(),
                Op::Delete => view! {
                    <del data-diff="removed" style="background-color: var(--card-badge-critical-bg-color); color: var(--card-badge-critical-fg-color); text-decoration: line-through;">{text}</del>
                }
                .into_any(),
                Op::Insert => view! {
                    <ins data-diff="added" style="background-color: var(--card-badge-positive-bg-color); color: var(--card-badge-positive-fg-color); text-decoration: none;">{text}</ins>
                }
                .into_any(),
            }
        })
        .collect_view();
    view! { <div style="white-space: pre-wrap; word-break: break-word;"><Text size=1>{parts}</Text></div> }
}

#[component]
fn ChangeRow(change: FieldChange, #[prop(into)] on_revert: Callback<()>, read_only: Signal<bool>) -> impl IntoView {
    let texts = (
        change.before.as_ref().map_or(Some(String::new()), text_of),
        change.after.as_ref().map_or(Some(String::new()), text_of),
    );
    let body = match texts {
        (Some(before), Some(after)) => view! { <TextDiff before=before after=after /> }.into_any(),
        _ => {
            let before = change.before.as_ref().map(summary).unwrap_or_else(|| "Empty".into());
            let after = change.after.as_ref().map(summary).unwrap_or_else(|| "Empty".into());
            view! {
                <Stack space=2>
                    <div data-diff="removed" style="text-decoration: line-through; color: var(--card-badge-critical-fg-color);">
                        <Text size=1>{before}</Text>
                    </div>
                    <div data-diff="added" style="color: var(--card-badge-positive-fg-color);">
                        <Text size=1>{after}</Text>
                    </div>
                </Stack>
            }
            .into_any()
        }
    };
    let test_id = format!("change-{}", change.name);
    view! {
        <Card border=true radius=2 padding=Pad::all(3) attr:data-testid=test_id>
            <Stack space=3>
                <Flex align="center" gap=2>
                    <Box flex=1>
                        <Text size=1 weight=FontWeight::Medium>{change.title}</Text>
                    </Box>
                    <Button
                        mode=ButtonMode::Bleed
                        tone=StateTone::Critical
                        font_size=1
                        padding=Pad::xy(2, 1)
                        icon=IconName::Revert
                        text="Revert"
                        disabled=read_only
                        on_click=Callback::new(move |_| on_revert.run(()))
                    />
                </Flex>
                {body}
            </Stack>
        </Card>
    }
}

/// The history inspector of a document pane.
#[component]
pub fn HistoryInspector(
    #[prop(into)] published: String,
    #[prop(into)] type_name: String,
    /// The release whose version the pane edits.
    #[prop(into)]
    release: Signal<Option<String>>,
    /// The document the pane edits, without a revision selected.
    current: Memo<Option<Value>>,
    viewing: RwSignal<Option<Revision>>,
    #[prop(into)] read_only: Signal<bool>,
    on_close: Callback<()>,
) -> impl IntoView {
    let events = RwSignal::new(None::<Result<Vec<Event>, String>>);
    let generation = StoredValue::new(0u64);
    let load = {
        let published = published.clone();
        move || {
            let published = published.clone();
            let edited = release
                .get_untracked()
                .map_or_else(|| draft_id(&published), |release| version_id(&release, &published));
            generation.update_value(|generation| *generation += 1);
            let current = generation.get_value();
            spawn_local(async move {
                let ids = [edited.clone(), published.clone()];
                let result = store().client().history_transactions(&ids, TIMELINE_LIMIT, "history.transactions").await;
                if generation.try_get_value() != Some(current) {
                    return;
                }
                events.set(Some(
                    result.map(|txs| self::events(&txs, &edited, &published)).map_err(|err| err.to_string()),
                ));
            });
        }
    };
    // The timeline follows the document: a change reloads it once the edits have settled.
    {
        let load = load.clone();
        let rev = Memo::new(move |_| current.with(|doc| doc.as_ref().and_then(|doc| doc.get("_rev")).cloned()));
        Effect::new(move |previous: Option<()>| {
            rev.track();
            release.track();
            if previous.is_none() {
                load();
                return;
            }
            let load = load.clone();
            set_timeout(load, std::time::Duration::from_millis(1500));
        });
    }

    let select = {
        let published = published.clone();
        move |event: Event| {
            if viewing.with_untracked(|viewing| viewing.as_ref().is_some_and(|viewing| viewing.event == event)) {
                viewing.set(None);
                return;
            }
            let published = published.clone();
            spawn_local(async move {
                let client = store().client();
                let result = client.history_document(&event.document_id, &event.revision, "history.revision").await;
                match result {
                    // A discarded draft reads as the published document it went back to.
                    Ok(doc) => viewing.set(Some(Revision { doc: doc.or_else(|| store().local(&published)), event })),
                    Err(err) => store().error("Could not load the revision", err.to_string()),
                }
            });
        }
    };

    let base = {
        let published = published.clone();
        Memo::new(move |_| match viewing.get() {
            Some(revision) => revision.doc,
            None => store().local(&published),
        })
    };
    let changes = {
        let type_name = type_name.clone();
        Memo::new(move |_| {
            base.with(|base| current.with(|current| changes(&type_name, base.as_ref(), current.as_ref())))
        })
    };
    let revert = {
        let (published, type_name) = (published.clone(), type_name.clone());
        move |change: FieldChange| {
            let path = vec![Segment::attr(&change.name)];
            let op = match change.before {
                Some(value) => PatchOp::set(path, value),
                None => PatchOp::unset(path),
            };
            store().edit(&published, &type_name, release.get_untracked().as_deref(), vec![op]);
        }
    };

    let timeline = move || {
        match events.get() {
        None => view! { <Flex justify="center" padding=Pad::all(4)><Spinner muted=true /></Flex> }.into_any(),
        Some(Err(err)) => view! { <Box padding=Pad::all(3)><Text size=1 muted=true>{err}</Text></Box> }.into_any(),
        Some(Ok(list)) if list.is_empty() => {
            view! { <Box padding=Pad::all(3)><Text size=1 muted=true>"No history yet"</Text></Box> }.into_any()
        }
        Some(Ok(list)) => list
            .into_iter()
            .map(|event| {
                let selected = {
                    let event = event.clone();
                    Signal::derive(move || viewing.with(|viewing| viewing.as_ref().is_some_and(|viewing| viewing.event == event)))
                };
                let author = event.author.clone();
                let user = Signal::derive(move || presence().user(&author));
                let hue = presence().hue(&event.author);
                let select = select.clone();
                let clicked = event.clone();
                let dot = format!(
                    "width: 1.5625rem; height: 1.5625rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex: none; background-color: var(--card-badge-{0}-bg-color); color: var(--card-badge-{0}-icon-color);",
                    event.kind.tone()
                );
                view! {
                    <Card
                        as_="button"
                        radius=2
                        padding=Pad::all(2)
                        selected=selected
                        attr:data-testid="timeline-item"
                        on_click=Callback::new(move |_| select(clicked.clone()))
                    >
                        <Flex align="center" gap=3>
                            <span style=dot><Text size=1><Icon icon=event.kind.icon() /></Text></span>
                            <Stack space=2 flex=1>
                                <Text size=1 weight=FontWeight::Medium>{event.kind.label()}</Text>
                                <Text size=1 muted=true>{time_ago(&event.timestamp)}</Text>
                            </Stack>
                            {move || {
                                user.get().map(|user| view! {
                                    <Avatar src=user.image.clone() initials=user.initials() hue=hue size=0 title=user.name.clone() />
                                })
                            }}
                        </Flex>
                    </Card>
                }
            })
            .collect_view()
            .into_any(),
    }
    };

    let review = move || {
        let list = changes.get();
        if list.is_empty() {
            return view! { <Box padding=Pad::all(3)><Text size=1 muted=true>"No changes"</Text></Box> }.into_any();
        }
        list.into_iter()
            .map(|change| {
                let revert = revert.clone();
                let reverted = change.clone();
                view! { <ChangeRow change=change read_only=read_only on_revert=Callback::new(move |_| revert(reverted.clone())) /> }
            })
            .collect_view()
            .into_any()
    };
    let review_title = move || match viewing.get() {
        Some(revision) => format!("Changes since {}", time_ago(&revision.event.timestamp)),
        None => "Changes since published".to_owned(),
    };

    view! {
        <Flex direction="column" height="fill" attr:data-testid="history-inspector">
            <Card border_bottom=true padding=Pad::xy(3, 2) style="flex: none;">
                <Flex align="center" gap=2>
                    <Box flex=1 padding=Pad::xy(1, 0)>
                        <Text size=1 weight=FontWeight::Semibold>"History"</Text>
                    </Box>
                    <Button mode=ButtonMode::Bleed icon=IconName::Close title="Close history" on_click=Callback::new(move |_| on_close.run(())) />
                </Flex>
            </Card>
            <Box flex=1 overflow="auto" style="min-height: 0;">
                <Stack space=1 padding=Pad::all(2)>{timeline}</Stack>
                <Card border_top=true padding=Pad::all(3)>
                    <Stack space=3>
                        <Text size=1 weight=FontWeight::Semibold>{review_title}</Text>
                        <Stack space=2 style="" >{review}</Stack>
                    </Stack>
                </Card>
            </Box>
        </Flex>
    }
}

/// The banner over a form that shows a revision, with the button that restores it.
#[component]
pub fn RevisionBanner(viewing: RwSignal<Option<Revision>>, #[prop(into)] on_restore: Callback<Value>) -> impl IntoView {
    move || {
        viewing.get().map(|revision| {
            let author = revision.event.author.clone();
            let who = move || presence().user(&author).map(|user| format!(" by {}", user.name)).unwrap_or_default();
            let doc = revision.doc.clone();
            view! {
                <Card tone=CardTone::Caution padding=Pad::xy(3, 2) border_bottom=true style="flex: none;" attr:data-testid="revision-banner">
                    <Flex align="center" gap=3>
                        <Text size=1><Icon icon=IconName::Clock /></Text>
                        <Box flex=1>
                            <Text size=1>
                                {format!("{} {}", revision.event.kind.label(), time_ago(&revision.event.timestamp))}
                                {who}
                            </Text>
                        </Box>
                        <Button mode=ButtonMode::Bleed text="Back to current" on_click=Callback::new(move |_| viewing.set(None)) />
                        <Button
                            tone=StateTone::Caution
                            icon=IconName::Restore
                            text="Restore"
                            attr:data-testid="restore-revision"
                            disabled=doc.is_none()
                            on_click=Callback::new(move |_| {
                                if let Some(doc) = doc.clone() {
                                    on_restore.run(doc);
                                }
                            })
                        />
                    </Flex>
                </Card>
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use serde_json::json;

    use super::*;

    #[test]
    fn diffs_portable_text_as_its_text() {
        let pt = json!([
            {"_type": "block", "children": [{"_type": "span", "text": "Hello "}, {"_type": "span", "text": "world"}]},
            {"_type": "block", "children": [{"_type": "span", "text": "Again"}]}
        ]);
        assert_eq!(text_of(&pt).as_deref(), Some("Hello world\nAgain"));
        assert_eq!(text_of(&json!([{"_type": "image"}])), None);
        assert_eq!(summary(&json!([{"_type": "image"}, {"_type": "image"}])), "2 items");
        assert_eq!(summary(&json!({"_type": "reference", "_ref": "abc"})), "Reference to abc");
    }

    #[test]
    fn lists_changed_fields() {
        schema::set_current(Arc::new(schema::Schema::from_manifest(&json!([
            {"name": "book", "type": "document", "fields": [
                {"name": "title", "type": "string"},
                {"name": "year", "type": "number"}
            ]}
        ]))));
        let base = json!({"_id": "a", "_rev": "1", "title": "Dune", "year": 1965});
        let current = json!({"_id": "drafts.a", "_rev": "2", "title": "Dune Messiah", "year": 1965, "extra": true});
        let list = changes("book", Some(&base), Some(&current));
        assert_eq!(list.iter().map(|change| change.name.as_str()).collect::<Vec<_>>(), ["title", "extra"]);
        assert_eq!(list[0].before, Some(json!("Dune")));
        assert_eq!(list[1].title, "Extra");
        assert_eq!(list[1].before, None);
    }
}
