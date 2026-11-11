//! The command menu (Cmd/Ctrl+K): jump to a document type or search documents of every type by
//! title, recently edited ones first.

use crate::list::preview_content;
use crate::previews::{DocPreview, search};
use crate::router::Route;
use crate::schema;
use crate::use_app;
use leptos::portal::Portal;
use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_ui::prelude::*;
use sanity_ui::theme::LAYER_DIALOG;

#[derive(Clone, Debug, PartialEq)]
enum Item {
    Type { name: String, title: String },
    Document(DocPreview),
}

impl Item {
    fn route(&self) -> Route {
        match self {
            Item::Type { name, .. } => Route::list(name),
            Item::Document(doc) => Route::document(&doc.type_name, &doc.id),
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
enum Documents {
    Loading,
    Failed(String),
    Ready(Vec<DocPreview>),
}

#[component]
pub fn CommandMenu() -> impl IntoView {
    let app = use_app();
    let text = RwSignal::new(String::new());
    let documents = RwSignal::new(Documents::Loading);
    let active = RwSignal::new(0usize);
    let generation = StoredValue::new(0u64);

    let types = Memo::new(move |_| {
        app.schema_version.track();
        let query = text.get().trim().to_lowercase();
        schema::current()
            .document_types()
            .iter()
            .map(|def| (def.name.clone(), schema::title_of(def)))
            .filter(|(name, title)| {
                !query.is_empty() && (title.to_lowercase().contains(&query) || name.to_lowercase().contains(&query))
            })
            .take(5)
            .collect::<Vec<_>>()
    });
    let items = Memo::new(move |_| {
        let mut items: Vec<Item> = types.get().into_iter().map(|(name, title)| Item::Type { name, title }).collect();
        if let Documents::Ready(docs) = documents.get() {
            items.extend(docs.into_iter().map(Item::Document));
        }
        items
    });

    let run = move |query: String| {
        let current = generation.get_value() + 1;
        generation.set_value(current);
        spawn_local(async move {
            if !query.trim().is_empty() {
                sanity_client::sleep(150).await;
            }
            if generation.get_value() != current {
                return;
            }
            let all: Vec<String> = schema::current().document_types().iter().map(|def| def.name.clone()).collect();
            let result = search(&all, &query, 20).await;
            if generation.get_value() == current {
                active.set(0);
                documents.set(match result {
                    Ok(docs) => Documents::Ready(docs),
                    Err(error) => Documents::Failed(error.to_string()),
                });
            }
        });
    };
    run(String::new());

    let close = move || app.command_open.set(false);
    let open_item = move |item: Item| {
        close();
        app.router.navigate(&item.route());
    };
    let on_keydown = Callback::new(move |event: web_sys::KeyboardEvent| {
        let count = items.with_untracked(Vec::len);
        match event.key().as_str() {
            "ArrowDown" if count > 0 => {
                event.prevent_default();
                active.update(|index| *index = (*index + 1) % count);
            }
            "ArrowUp" if count > 0 => {
                event.prevent_default();
                active.update(|index| *index = (*index + count - 1) % count);
            }
            "Enter" => {
                event.prevent_default();
                if let Some(item) = items.with_untracked(|items| items.get(active.get_untracked()).cloned()) {
                    open_item(item);
                }
            }
            "Escape" => {
                event.prevent_default();
                close();
            }
            _ => {}
        }
    });
    Effect::new(move |_| {
        let index = active.get();
        if let Some(element) = document().query_selector(&format!("[data-command-item=\"{index}\"]")).ok().flatten() {
            let options = web_sys::ScrollIntoViewOptions::new();
            options.set_block(web_sys::ScrollLogicalPosition::Nearest);
            element.scroll_into_view_with_scroll_into_view_options(&options);
        }
    });

    let results = move || {
        let items = items.get();
        let docs_state = documents.get();
        let searching = !text.with(|text| text.trim().is_empty());
        let mut rows: Vec<AnyView> = Vec::new();
        let mut doc_header_done = false;
        for (index, item) in items.into_iter().enumerate() {
            if index == 0 && matches!(item, Item::Type { .. }) {
                rows.push(
                    view! { <Box padding=Pad::xy(2, 2)><Label size=1 muted=true>"Document types"</Label></Box> }
                        .into_any(),
                );
            }
            if matches!(item, Item::Document(_)) && !doc_header_done {
                doc_header_done = true;
                let label = if searching { "Documents" } else { "Recently edited" };
                rows.push(
                    view! { <Box padding=Pad::xy(2, 2)><Label size=1 muted=true>{label}</Label></Box> }.into_any(),
                );
            }
            let selected = Signal::derive(move || active.get() == index);
            let content = match item.clone() {
                Item::Type { title, .. } => view! {
                    <Flex align="center" gap=2 padding=Pad::all(1)>
                        <Text size=1><Icon icon=IconName::Folder /></Text>
                        <Text size=1 weight=FontWeight::Medium>{title}</Text>
                    </Flex>
                }
                .into_any(),
                Item::Document(doc) => preview_content(doc).into_any(),
            };
            let route = item.route();
            rows.push(
                view! {
                    <div data-command-item=index.to_string() on:mousemove=move |_| if active.get_untracked() != index { active.set(index) }>
                        <Card
                            as_="a"
                            href=route.href()
                            radius=2
                            padding=Pad::all(2)
                            selected=selected
                            on_click=Callback::new(move |event: web_sys::MouseEvent| {
                                event.prevent_default();
                                open_item(item.clone());
                            })
                        >
                            {content}
                        </Card>
                    </div>
                }
                .into_any(),
            );
        }
        match docs_state {
            Documents::Loading => rows.push(view! { <Flex justify="center" padding=Pad::all(4)><Spinner muted=true /></Flex> }.into_any()),
            Documents::Failed(error) => {
                rows.push(view! { <Box padding=Pad::all(3)><Text size=1 muted=true>{format!("Search failed: {error}")}</Text></Box> }.into_any())
            }
            Documents::Ready(docs) if docs.is_empty() => rows.push(
                view! { <Box padding=Pad::all(3)><Text size=1 muted=true align="center">"No matching documents"</Text></Box> }.into_any(),
            ),
            Documents::Ready(_) => {}
        }
        rows
    };

    view! {
        <Portal>
            <div
                style=format!(
                    "position: fixed; inset: 0; z-index: {LAYER_DIALOG}; display: flex; justify-content: center; align-items: flex-start; padding: 12vh 1rem 1rem; background-color: var(--card-backdrop-color, rgba(0, 0, 0, 0.3));",
                )
                on:mousedown=move |event| {
                    if event.target() == event.current_target() {
                        close();
                    }
                }
            >
                <Card radius=3 shadow=4 style="width: 100%; max-width: 640px; max-height: 70vh; display: flex; flex-direction: column; overflow: hidden;">
                    <Box padding=Pad::all(2) style="flex: none;">
                        <TextInput
                            value=text
                            on_input=Callback::new(move |value: String| {
                                text.set(value.clone());
                                active.set(0);
                                documents.set(Documents::Loading);
                                run(value);
                            })
                            on_keydown=on_keydown
                            placeholder="Search documents and types"
                            icon=IconName::Search
                            border=false
                            autofocus=true
                        />
                    </Box>
                    <Card border_top=true flex=1 overflow="auto" padding=Pad::all(1) style="min-height: 0;">
                        <Stack space=1>{results}</Stack>
                    </Card>
                    <Card border_top=true padding=Pad::xy(3, 2) tone=CardTone::Transparent style="flex: none;">
                        <Flex gap=3 align="center">
                            <Text size=0 muted=true>"↑↓ to navigate"</Text>
                            <Text size=0 muted=true>"↵ to open"</Text>
                            <Text size=0 muted=true>"esc to close"</Text>
                        </Flex>
                    </Card>
                </Card>
            </div>
        </Portal>
    }
}
