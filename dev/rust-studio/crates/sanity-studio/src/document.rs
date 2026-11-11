//! The document pane: a header with the document's title and actions, the form, and a footer
//! with the publish status, validation and the publish button.

use std::sync::Arc;

use leptos::ev;
use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_ui::prelude::*;
use serde_json::Value;

use crate::form::{Fields, Target, document_markers, references_to_publish};
use crate::previews::{existing_ids, local_preview};
use crate::router::Route;
use crate::schema::{self, Marker};
use crate::store::{PairGuard, SyncState, store};
use crate::use_app;
use crate::util::{draft_id, time_ago};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum PaneState {
    Loading,
    Ready,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Confirm {
    Discard,
    Unpublish,
    Delete,
}

impl Confirm {
    fn header(self) -> &'static str {
        match self {
            Confirm::Discard => "Discard changes?",
            Confirm::Unpublish => "Unpublish document?",
            Confirm::Delete => "Delete document?",
        }
    }

    fn description(self) -> &'static str {
        match self {
            Confirm::Discard => "The draft goes away and the document goes back to its published version.",
            Confirm::Unpublish => "The published version is removed; the content stays as a draft.",
            Confirm::Delete => "The document and its draft are deleted. This can't be undone from the Rust studio.",
        }
    }

    fn button(self) -> &'static str {
        match self {
            Confirm::Discard => "Discard",
            Confirm::Unpublish => "Unpublish",
            Confirm::Delete => "Delete",
        }
    }
}

#[derive(Clone, Copy)]
struct Pane {
    published: StoredValue<Arc<str>>,
    type_name: StoredValue<Arc<str>>,
    has_draft: Memo<bool>,
    has_published: Memo<bool>,
    busy: RwSignal<Option<&'static str>>,
}

impl Pane {
    fn published(&self) -> String {
        self.published.with_value(|id| id.to_string())
    }

    fn type_name(&self) -> String {
        self.type_name.with_value(|name| name.to_string())
    }

    /// Runs a document action, showing `label` while it is in flight.
    fn run<F>(&self, label: &'static str, action: impl FnOnce(String) -> F + 'static, done: impl FnOnce(bool) + 'static)
    where
        F: Future<Output = bool> + 'static,
    {
        if self.busy.get_untracked().is_some() {
            return;
        }
        self.busy.set(Some(label));
        let busy = self.busy;
        let id = self.published();
        spawn_local(async move {
            let ok = action(id).await;
            busy.set(None);
            done(ok);
        });
    }
}

#[component]
pub fn DocumentPane(#[prop(into)] type_name: String, #[prop(into)] id: String) -> impl IntoView {
    let app = use_app();
    let router = app.router;
    let toasts = use_toast();
    let guard = StoredValue::new_local(Some(store().open(&id)));
    on_cleanup(move || guard.update_value(|guard: &mut Option<PairGuard>| drop(guard.take())));

    let draft = draft_id(&id);
    let state = {
        let id = id.clone();
        let draft = draft.clone();
        Memo::new(move |_| {
            let store = store();
            // An id with neither a draft nor a published document is a new document, which its
            // first edit creates, like in the JS studio.
            if store.is_loaded(&draft) && store.is_loaded(&id) { PaneState::Ready } else { PaneState::Loading }
        })
    };
    let doc = {
        let id = id.clone();
        let draft = draft.clone();
        Memo::new(move |_| {
            let store = store();
            store.local(&draft).or_else(|| store.local(&id)).or_else(|| store.initial_value(&id))
        })
    };
    let has_draft = {
        let draft = draft.clone();
        Memo::new(move |_| store().local(&draft).is_some())
    };
    let has_published = {
        let id = id.clone();
        Memo::new(move |_| store().local(&id).is_some())
    };
    let pane = Pane {
        published: StoredValue::new(Arc::from(id.as_str())),
        type_name: StoredValue::new(Arc::from(type_name.as_str())),
        has_draft,
        has_published,
        busy: RwSignal::new(None),
    };
    let references = {
        let type_name = type_name.clone();
        Memo::new(move |_| {
            app.schema_version.track();
            doc.with(|doc| doc.as_ref().map(|doc| references_to_publish(&type_name, doc)).unwrap_or_default())
        })
    };
    let unpublished_references = RwSignal::new(Vec::<Marker>::new());
    Effect::new(move |_| {
        let checked = references.get();
        if checked.is_empty() {
            unpublished_references.set(Vec::new());
            return;
        }
        spawn_local(async move {
            let mut ids: Vec<String> = checked.iter().map(|(_, id)| id.clone()).collect();
            ids.sort();
            ids.dedup();
            let Ok(existing) = existing_ids(&ids).await else { return };
            // The references changed while this was checked, or the pane closed.
            if references.try_get_untracked().as_ref() != Some(&checked) {
                return;
            }
            let mut markers: Vec<Marker> = checked
                .iter()
                .filter(|(_, id)| !existing.contains(id))
                .map(|(title, _)| Marker {
                    level: "error".to_owned(),
                    message: format!("{title}: Referenced document must be published"),
                })
                .collect();
            markers.dedup();
            unpublished_references.try_set(markers);
        });
    });
    let markers = {
        let type_name = type_name.clone();
        Memo::new(move |_| {
            app.schema_version.track();
            let mut markers = doc.with(|doc| document_markers(&type_name, doc.as_ref()));
            markers.extend(unpublished_references.get());
            markers
        })
    };
    let errors =
        Memo::new(move |_| markers.with(|markers| markers.iter().filter(|marker| marker.level == "error").count()));

    let publish = move || {
        if !pane.has_draft.get_untracked() || errors.get_untracked() > 0 {
            return;
        }
        pane.run(
            "Publishing…",
            |id| async move { store().publish(&id).await },
            move |ok| {
                if ok {
                    toasts.success("Published");
                }
            },
        );
    };
    let keydown = window_event_listener(ev::keydown, move |event| {
        if (event.ctrl_key() || event.meta_key()) && event.alt_key() && event.code() == "KeyP" {
            event.prevent_default();
            publish();
        }
    });
    on_cleanup(move || keydown.remove());

    let confirm = RwSignal::new(None::<Confirm>);
    let inspect = RwSignal::new(false);
    let confirmed = move |action: Confirm| {
        confirm.set(None);
        let type_name = pane.type_name();
        match action {
            Confirm::Discard => pane.run(
                "Discarding…",
                |id| async move { store().discard(&id).await },
                move |ok| {
                    if ok {
                        toasts.success("Changes discarded");
                        if !pane.has_published.get_untracked() {
                            router.navigate(&Route::list(&type_name));
                        }
                    }
                },
            ),
            Confirm::Unpublish => pane.run(
                "Unpublishing…",
                |id| async move { store().unpublish(&id).await },
                move |ok| {
                    if ok {
                        toasts.success("Unpublished");
                    }
                },
            ),
            Confirm::Delete => pane.run(
                "Deleting…",
                |id| async move { store().delete(&id).await },
                move |ok| {
                    if ok {
                        toasts.success("Document deleted");
                        router.navigate(&Route::list(&type_name));
                    }
                },
            ),
        }
    };
    let duplicate = move || {
        let type_name = pane.type_name();
        if let Some(copy) = store().duplicate(&pane.published(), &type_name) {
            router.navigate(&Route::document(&type_name, &copy));
        }
    };

    let title = {
        let id = id.clone();
        let type_name = type_name.clone();
        move || {
            local_preview(&id)
                .and_then(|preview| preview.title)
                .unwrap_or_else(|| format!("Untitled {}", schema::current().type_title(&type_name)))
        }
    };

    let form = {
        let id = id.clone();
        let type_name = type_name.clone();
        move || {
            app.schema_version.track();
            match state.get() {
                PaneState::Loading => view! {
                    <Stack space=5>
                        {(0..4)
                            .map(|_| {
                                view! {
                                    <Stack space=3>
                                        <Skeleton width="30%" height="0.8125rem" />
                                        <Skeleton width="100%" height="2.0625rem" />
                                    </Stack>
                                }
                            })
                            .collect_view()}
                    </Stack>
                }
                .into_any(),
                PaneState::Ready => {
                    let schema = schema::current();
                    match schema.get(&type_name) {
                        Some(def) => {
                            let target =
                                Target::root(&id, &type_name, doc, Signal::derive(move || pane.busy.get().is_some()));
                            view! {
                                <Fields
                                    target=target
                                    object_type=type_name.clone()
                                    fields=Arc::new(def.fields.clone())
                                    fieldsets=Arc::new(def.fieldsets.clone())
                                    level=0
                                />
                            }
                            .into_any()
                        }
                        None => {
                            view! { <Text size=1 muted=true>{format!("Unknown document type {type_name:?}")}</Text> }
                                .into_any()
                        }
                    }
                }
            }
        }
    };

    let sync = store().sync.clone();
    let sync_status = move || match (pane.busy.get(), sync.get()) {
        (Some(label), _) => view! {
            <Flex align="center" gap=2>
                <Spinner size=1 />
                <Text size=1 muted=true>{label}</Text>
            </Flex>
        }
        .into_any(),
        (None, SyncState::Saving) => view! {
            <Flex align="center" gap=2>
                <Spinner size=1 />
                <Text size=1 muted=true>"Saving…"</Text>
            </Flex>
        }
        .into_any(),
        (None, SyncState::Error) => view! { <Badge tone=StateTone::Critical>"Not saved"</Badge> }.into_any(),
        (None, SyncState::Saved) => ().into_any(),
    };

    let status = move || {
        let edited =
            |doc: Option<Value>| doc.and_then(|doc| doc.get("_updatedAt").and_then(Value::as_str).map(time_ago));
        let draft_doc = || store().local(&draft_id(&pane.published()));
        let published_doc = || store().local(&pane.published());
        match (pane.has_draft.get(), pane.has_published.get()) {
            (true, true) => format!("Edited {}", edited(draft_doc()).unwrap_or_else(|| "just now".into())),
            (true, false) => "Not published".to_owned(),
            (false, true) => format!("Published {}", edited(published_doc()).unwrap_or_default()),
            (false, false) => String::new(),
        }
    };

    let menu_open = RwSignal::new(false);
    let menu = move || {
        let close = move || menu_open.set(false);
        view! {
            <Menu>
                <MenuItem text="Duplicate" icon=IconName::Copy on_click=Callback::new(move |_| { close(); duplicate(); }) />
                <MenuItem text="Inspect JSON" icon=IconName::Json on_click=Callback::new(move |_| { close(); inspect.set(true); }) />
                <MenuDivider />
                <MenuItem
                    text="Discard changes"
                    icon=IconName::Revert
                    disabled=Signal::derive(move || !(pane.has_draft.get() && pane.has_published.get()))
                    on_click=Callback::new(move |_| { close(); confirm.set(Some(Confirm::Discard)); })
                />
                <MenuItem
                    text="Unpublish"
                    icon=IconName::Unpublish
                    disabled=Signal::derive(move || !pane.has_published.get())
                    on_click=Callback::new(move |_| { close(); confirm.set(Some(Confirm::Unpublish)); })
                />
                <MenuItem
                    text="Delete"
                    icon=IconName::Trash
                    tone=StateTone::Critical
                    on_click=Callback::new(move |_| { close(); confirm.set(Some(Confirm::Delete)); })
                />
            </Menu>
        }
    };

    let js_href = {
        let route = Route::document(&type_name, &id);
        move || route.js_studio_href()
    };
    let close_route = Route::list(&type_name);
    let errors_open = RwSignal::new(false);
    let publish_label = move || match pane.busy.get() {
        Some("Publishing…") => "Publishing…",
        _ if pane.has_draft.get() => "Publish",
        _ if pane.has_published.get() => "Published",
        _ => "Publish",
    };

    view! {
        <Flex direction="column" height="fill">
            <Card border_bottom=true padding=Pad::xy(3, 2) style="flex: none;">
                <Flex align="center" gap=2>
                    <Box flex=1 style="min-width: 0;" padding=Pad::xy(1, 0)>
                        <Text weight=FontWeight::Semibold ellipsis=true>{title}</Text>
                    </Box>
                    {sync_status}
                    <Button
                        mode=ButtonMode::Bleed
                        icon=IconName::Launch
                        title="Open in the JS studio"
                        href=Signal::derive(js_href)
                        target="_blank"
                    />
                    <Popover open=menu_open placement=Placement::BottomEnd min_width=200 content=menu>
                        <Button
                            mode=ButtonMode::Bleed
                            icon=IconName::EllipsisHorizontal
                            title="Document actions"
                            on_click=Callback::new(move |_| menu_open.update(|open| *open = !*open))
                        />
                    </Popover>
                    <Button
                        mode=ButtonMode::Bleed
                        icon=IconName::Close
                        title="Close"
                        on_click=Callback::new(move |_| router.navigate(&close_route))
                    />
                </Flex>
            </Card>
            <Box flex=1 overflow="auto" style="min-height: 0;">
                <Box padding=Pad::all(4) style="max-width: 640px; margin: 0 auto; padding-bottom: 6rem;">
                    {form}
                </Box>
            </Box>
            <Card border_top=true padding=Pad::xy(3, 2) style="flex: none;">
                <Flex align="center" gap=2>
                    <Flex flex=1 align="center" gap=2 style="min-width: 0;">
                        {move || {
                            let draft = pane.has_draft.get();
                            (draft || pane.has_published.get()).then(|| crate::list::status_dot(draft))
                        }}
                        <Text size=1 muted=true ellipsis=true>{status}</Text>
                    </Flex>
                    <Show when=move || { errors.get() > 0 }>
                        <Popover
                            open=errors_open
                            placement=Placement::BottomEnd
                            min_width=280
                            content=move || {
                                view! {
                                    <Stack space=3 padding=Pad::all(3)>
                                        {move || {
                                            markers
                                                .get()
                                                .into_iter()
                                                .map(|marker| view! { <Text size=1>{marker.message}</Text> })
                                                .collect_view()
                                        }}
                                    </Stack>
                                }
                            }
                        >
                            <Button
                                mode=ButtonMode::Bleed
                                tone=StateTone::Critical
                                icon=IconName::ErrorOutline
                                text=Signal::derive(move || {
                                    let count = errors.get();
                                    if count == 1 { "1 error".to_owned() } else { format!("{count} errors") }
                                })
                                on_click=Callback::new(move |_| errors_open.update(|open| *open = !*open))
                            />
                        </Popover>
                    </Show>
                    <Button
                        tone=StateTone::Positive
                        icon=IconName::Publish
                        text=Signal::derive(move || publish_label().to_owned())
                        title="Publish (Ctrl+Alt+P)"
                        disabled=Signal::derive(move || !pane.has_draft.get() || errors.get() > 0 || pane.busy.get().is_some())
                        loading=Signal::derive(move || pane.busy.get() == Some("Publishing…"))
                        on_click=Callback::new(move |_| publish())
                    />
                </Flex>
            </Card>
        </Flex>
        {move || {
            confirm
                .get()
                .map(|action| {
                    view! {
                        <Dialog
                            header=action.header()
                            on_close=Callback::new(move |_| confirm.set(None))
                            width=1
                            footer=move || {
                                view! {
                                    <Flex justify="flex-end" gap=2>
                                        <Button mode=ButtonMode::Bleed text="Cancel" on_click=Callback::new(move |_| confirm.set(None)) />
                                        <Button
                                            tone=StateTone::Critical
                                            text=action.button()
                                            on_click=Callback::new(move |_| confirmed(action))
                                        />
                                    </Flex>
                                }
                            }
                        >
                            <Text size=1>{action.description()}</Text>
                        </Dialog>
                    }
                })
        }}
        <Show when=move || inspect.get()>
            <Dialog header="Inspect JSON" on_close=Callback::new(move |_| inspect.set(false)) width=3>
                <Box style="max-height: 70vh; overflow: auto;">
                    <Code size=1>{move || doc.with(|doc| doc.as_ref().map(|doc| serde_json::to_string_pretty(doc).unwrap_or_default()))}</Code>
                </Box>
            </Dialog>
        </Show>
    }
}
