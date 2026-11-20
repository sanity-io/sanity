//! The document pane: a header with the document's title and actions, the form, and a footer
//! with the publish status, validation and the publish button.

use std::sync::Arc;

use leptos::ev;
use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_mutator::{Path, path};
use sanity_ui::prelude::*;
use serde_json::Value;
use wasm_bindgen::JsCast;

use crate::comments::{Comments, CommentsInspector};
use crate::form::{Fields, Target, document_markers, references_to_publish};
use crate::history::{HistoryInspector, Revision, RevisionBanner};
use crate::presence::{PaneFocus, PresenceAvatars, edited_id, presence};
use crate::previews::{existing_ids, local_preview};
use crate::releases::{Perspective, ReleaseDot, perspective_title, releases, with_perspective};
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
    DiscardVersion,
    Unpublish,
    Delete,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Inspector {
    History,
    Comments,
}

impl Confirm {
    fn header(self) -> &'static str {
        match self {
            Confirm::Discard => "Discard changes?",
            Confirm::DiscardVersion => "Discard version?",
            Confirm::Unpublish => "Unpublish document?",
            Confirm::Delete => "Delete document?",
        }
    }

    fn description(self) -> &'static str {
        match self {
            Confirm::Discard => "The draft goes away and the document goes back to its published version.",
            Confirm::DiscardVersion => {
                "The document leaves the release. Its draft and published versions stay as they are."
            }
            Confirm::Unpublish => "The published version is removed; the content stays as a draft.",
            Confirm::Delete => "The document and its draft are deleted. This can't be undone from the Rust studio.",
        }
    }

    fn button(self) -> &'static str {
        match self {
            Confirm::Discard => "Discard",
            Confirm::DiscardVersion => "Discard version",
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
    let perspective = Memo::new(move |_| releases().perspective.get());
    let release = Memo::new(move |_| perspective.with(|perspective| perspective.release().map(str::to_owned)));
    let versions = {
        let id = id.clone();
        Memo::new(move |_| store().versions(&id))
    };
    let in_release = Memo::new(move |_| {
        release.with(|release| {
            release.as_ref().is_some_and(|release| versions.with(|versions| versions.contains(release)))
        })
    });
    // The release whose version the form edits: none while the document isn't in it yet.
    let edit_release = Memo::new(move |_| if in_release.get() { release.get() } else { None });
    let state = {
        let id = id.clone();
        let draft = draft.clone();
        Memo::new(move |_| {
            let store = store();
            // An id with neither a draft nor a published document is a new document, which its
            // first edit creates, like in the JS studio.
            let pair = store.is_loaded(&draft) && store.is_loaded(&id);
            let versions = release.with(Option::is_none) || store.versions_ready(&id);
            if pair && versions { PaneState::Ready } else { PaneState::Loading }
        })
    };
    let viewing = RwSignal::new(None::<Revision>);
    let current = {
        let id = id.clone();
        Memo::new(move |_| {
            let store = store();
            store.shown(&id, &perspective.get()).or_else(|| store.initial_value(&id))
        })
    };
    let doc = Memo::new(move |_| match viewing.get() {
        Some(revision) => revision.doc,
        None => current.get(),
    });
    // A revision belongs to the perspective it was opened in.
    Effect::new(move |previous: Option<()>| {
        perspective.track();
        if previous.is_some() {
            viewing.set(None);
        }
    });
    let inspector = RwSignal::new(None::<Inspector>);
    let comments = Comments::provide(
        id.clone(),
        type_name.clone(),
        Signal::derive(move || release.get()),
        current,
        Callback::new(move |_| inspector.set(Some(Inspector::Comments))),
    );
    let focus = PaneFocus(RwSignal::new((Path::new(), None::<Value>)));
    provide_context(focus);
    {
        let id = id.clone();
        let edited = Memo::new(move |_| doc.with(|doc| edited_id(doc, &id)));
        Effect::new(move |_| {
            let (path, selection) = focus.0.get();
            presence().set_location(&edited.get(), path, selection);
        });
    }
    {
        let id = id.clone();
        on_cleanup(move || presence().leave(&id));
    }
    let present = {
        let id = id.clone();
        Memo::new(move |_| presence().in_document(&id))
    };
    let on_focus_in = move |event: ev::FocusEvent| {
        let Some(element) = event.target().and_then(|target| target.dyn_into::<web_sys::Element>().ok()) else {
            return;
        };
        // The editor reports its selection itself.
        if element.closest("[data-testid=\"pt-editable\"]").ok().flatten().is_some() {
            return;
        }
        let path = element
            .closest("[data-path]")
            .ok()
            .flatten()
            .and_then(|field| field.get_attribute("data-path"))
            .and_then(|path| path::parse(&path).ok())
            .unwrap_or_default();
        focus.0.set((path, None));
    };
    let on_focus_out = move |event: ev::FocusEvent| {
        let inside = |node: Option<web_sys::Node>| {
            let container = event.current_target().and_then(|target| target.dyn_into::<web_sys::Node>().ok());
            container.is_some_and(|container| container.contains(node.as_ref()))
        };
        let next = event.related_target().and_then(|target| target.dyn_into::<web_sys::Node>().ok());
        if next.is_none() || !inside(next) {
            focus.0.set((Path::new(), None));
        }
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
    // Shows the replica restored from the last visit until the listener confirms it.
    let stale = {
        let id = id.clone();
        Memo::new(move |_| store().is_stale(&id))
    };
    // Published documents, revisions, and releases the document isn't in yet are read-only, like
    // in the JS studio, and so is a document that may have changed since the last visit.
    let read_only = Signal::derive(move || {
        pane.busy.get().is_some()
            || stale.get()
            || viewing.with(Option::is_some)
            || perspective.with(|perspective| *perspective == Perspective::Published)
            || (release.with(Option::is_some) && !in_release.get())
    });
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
        if !pane.has_draft.get_untracked() || errors.get_untracked() > 0 || release.with_untracked(Option::is_some) {
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
            Confirm::DiscardVersion => {
                let Some(release) = release.get_untracked() else { return };
                pane.run(
                    "Discarding…",
                    move |id| async move { store().discard_version(&id, &release).await },
                    move |ok| {
                        if ok {
                            toasts.success("Version discarded");
                        }
                    },
                )
            }
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
                            let target = Target::root(&id, &type_name, edit_release.get().as_deref(), doc, read_only);
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
        (None, _) if stale.get() => view! {
            <Flex align="center" gap=2>
                <Spinner size=1 />
                <Text size=1 muted=true>"Checking for changes…"</Text>
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
        if let Some(release) = edit_release.get() {
            let title = perspective_title(&Perspective::Release(release.clone()));
            let edited = edited(store().local(&crate::util::version_id(&release, &pane.published())));
            return format!(
                "In release {title}{}",
                edited.map(|edited| format!(", edited {edited}")).unwrap_or_default()
            );
        }
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
                <MenuItem text="History" icon=IconName::Clock on_click=Callback::new(move |_| { close(); inspector.set(Some(Inspector::History)); }) />
                <MenuItem text="Comments" icon=IconName::Comment on_click=Callback::new(move |_| { close(); comments.open_inspector(None); }) />
                <MenuDivider />
                <Show when=move || edit_release.with(Option::is_some)>
                    <MenuItem
                        text="Discard version"
                        icon=IconName::Revert
                        tone=StateTone::Critical
                        on_click=Callback::new(move |_| { close(); confirm.set(Some(Confirm::DiscardVersion)); })
                    />
                </Show>
                <MenuItem
                    text="Discard changes"
                    icon=IconName::Revert
                    disabled=Signal::derive(move || !(pane.has_draft.get() && pane.has_published.get()) || release.with(Option::is_some))
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
        move || {
            releases().perspective.track();
            with_perspective(&route.js_studio_href())
        }
    };
    let close_route = Route::list(&type_name);
    let errors_open = RwSignal::new(false);
    let publish_label = move || match pane.busy.get() {
        Some("Publishing…") => "Publishing…",
        _ if pane.has_draft.get() => "Publish",
        _ if pane.has_published.get() => "Published",
        _ => "Publish",
    };

    let chips = move || {
        let mut chips: Vec<(Perspective, String, StateTone, bool)> = vec![
            (Perspective::Published, "Published".to_owned(), StateTone::Positive, pane.has_published.get()),
            (Perspective::Drafts, "Draft".to_owned(), StateTone::Caution, pane.has_draft.get()),
        ];
        for name in versions.get() {
            let tone = releases().get(&name).map_or(StateTone::Neutral, |release| release.tone());
            let perspective = Perspective::Release(name);
            chips.push((perspective.clone(), perspective_title(&perspective), tone, true));
        }
        chips
            .into_iter()
            .map(|(target, label, tone, exists)| {
                let selected = {
                    let target = target.clone();
                    Signal::derive(move || perspective.with(|perspective| *perspective == target))
                };
                let test_id = format!("version-chip-{}", target.param().unwrap_or("drafts"));
                let style = format!(
                    "border-radius: 999px; width: auto; flex: none;{}",
                    if exists { "" } else { " opacity: 0.5;" }
                );
                view! {
                    <Card
                        as_="button"
                        border=true
                        padding=Pad::xy(2, 1)
                        selected=selected
                        style=style
                        attr:data-testid=test_id
                        on_click=Callback::new(move |_| releases().set_perspective(target.clone()))
                    >
                        <Flex align="center" gap=2>
                            <ReleaseDot tone=Signal::stored(tone) />
                            <Text size=1 weight=FontWeight::Medium>{label}</Text>
                        </Flex>
                    </Card>
                }
            })
            .collect_view()
    };
    let banner = {
        let (id, type_name) = (id.clone(), type_name.clone());
        move || {
            if state.get() != PaneState::Ready || viewing.with(Option::is_some) {
                return None;
            }
            match perspective.get() {
                Perspective::Published => Some(
                    view! {
                        <Card tone=CardTone::Positive padding=Pad::xy(3, 2) border_bottom=true style="flex: none;" attr:data-testid="published-banner">
                            <Flex align="center" gap=3>
                                <Box flex=1><Text size=1>"You are viewing the published version, which is read-only."</Text></Box>
                                <Button mode=ButtonMode::Ghost font_size=1 padding=Pad::xy(2, 1) text="Edit draft"
                                    on_click=Callback::new(move |_| releases().set_perspective(Perspective::Drafts)) />
                            </Flex>
                        </Card>
                    }
                    .into_any(),
                ),
                Perspective::Release(name) if !in_release.get() => {
                    let title = perspective_title(&Perspective::Release(name.clone()));
                    let (id, type_name) = (id.clone(), type_name.clone());
                    Some(
                        view! {
                            <Card tone=CardTone::Caution padding=Pad::xy(3, 2) border_bottom=true style="flex: none;" attr:data-testid="not-in-release-banner">
                                <Flex align="center" gap=3>
                                    <Box flex=1><Text size=1>{format!("This document isn't in the release {title}.")}</Text></Box>
                                    <Button tone=StateTone::Primary font_size=1 padding=Pad::xy(3, 2) icon=IconName::Add text="Add to release"
                                        attr:data-testid="add-to-release"
                                        on_click=Callback::new(move |_| store().add_to_release(&id, &type_name, &name)) />
                                </Flex>
                            </Card>
                        }
                        .into_any(),
                    )
                }
                _ => None,
            }
        }
    };
    let on_restore = Callback::new(move |revision: Value| {
        store().restore(&pane.published(), edit_release.get_untracked().as_deref(), &revision);
        viewing.set(None);
        toasts.success("Revision restored");
    });
    let toggle = move |which: Inspector| {
        if inspector.get_untracked() == Some(which) {
            inspector.set(None);
        } else if which == Inspector::Comments {
            comments.open_inspector(None);
        } else {
            inspector.set(Some(which));
        }
    };
    let inspector_view = {
        let (id, type_name) = (id.clone(), type_name.clone());
        move || {
            inspector.get().map(|which| {
                let close = Callback::new(move |_| inspector.set(None));
                let body = match which {
                    Inspector::History => view! {
                        <HistoryInspector
                            published=id.clone()
                            type_name=type_name.clone()
                            release=Signal::derive(move || edit_release.get())
                            current=current
                            viewing=viewing
                            read_only=Signal::derive(move || read_only.get() && viewing.with(Option::is_none))
                            on_close=close
                        />
                    }
                    .into_any(),
                    Inspector::Comments => view! { <CommentsInspector comments=comments on_close=close /> }.into_any(),
                };
                view! {
                    <Card border_left=true height="fill" style="flex: none; width: 360px; max-width: 45%; min-height: 0;">
                        {body}
                    </Card>
                }
            })
        }
    };

    view! {
        <Flex height="fill">
        <Flex direction="column" height="fill" flex=1 style="min-width: 0;">
            <Card border_bottom=true padding=Pad::xy(3, 2) style="flex: none;">
                <Flex align="center" gap=2>
                    <Box flex=1 style="min-width: 0;" padding=Pad::xy(1, 0)>
                        <Text weight=FontWeight::Semibold ellipsis=true>{title}</Text>
                    </Box>
                    <PresenceAvatars present=present size=1 />
                    {sync_status}
                    <Button
                        mode=ButtonMode::Bleed
                        icon=IconName::Clock
                        title="History"
                        attr:data-testid="history-button"
                        selected=Signal::derive(move || inspector.get() == Some(Inspector::History))
                        on_click=Callback::new(move |_| toggle(Inspector::History))
                    />
                    <Button
                        mode=ButtonMode::Bleed
                        icon=IconName::Comment
                        title="Comments"
                        attr:data-testid="comments-button"
                        selected=Signal::derive(move || inspector.get() == Some(Inspector::Comments))
                        on_click=Callback::new(move |_| toggle(Inspector::Comments))
                    />
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
            <Card border_bottom=true padding=Pad::xy(3, 2) style="flex: none;">
                <Flex align="center" gap=2 wrap=true attr:data-testid="version-chips">{chips}</Flex>
            </Card>
            <RevisionBanner viewing=viewing on_restore=on_restore />
            {banner}
            <Box flex=1 overflow="auto" style="min-height: 0;">
                <div
                    style="max-width: 640px; margin: 0 auto; padding: 1.25rem 1.25rem 6rem;"
                    data-stale=move || stale.get().then_some("")
                    on:focusin=on_focus_in
                    on:focusout=on_focus_out
                >
                    {form}
                </div>
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
                    <Show when=move || release.with(Option::is_none) && perspective.with(|perspective| *perspective != Perspective::Published)>
                        <Button
                            tone=StateTone::Positive
                            icon=IconName::Publish
                            text=Signal::derive(move || publish_label().to_owned())
                            title="Publish (Ctrl+Alt+P)"
                            disabled=Signal::derive(move || !pane.has_draft.get() || errors.get() > 0 || pane.busy.get().is_some())
                            loading=Signal::derive(move || pane.busy.get() == Some("Publishing…"))
                            on_click=Callback::new(move |_| publish())
                        />
                    </Show>
                </Flex>
            </Card>
        </Flex>
        {inspector_view}
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
