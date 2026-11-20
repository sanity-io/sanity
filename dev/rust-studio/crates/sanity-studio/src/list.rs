//! The document list pane: every document of a type in a virtualized list. Once the replica has
//! warmed the type, the list is sorted and searched in memory; until then it fetches the ids of
//! the pages that scroll into view, kept current by a listener. Either way, a row shows its
//! document only once the replica (or the open document) holds all of its group.

use std::collections::HashSet;
use std::rc::Rc;
use std::sync::Arc;

use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_client::{ListenEvent, ListenOptions, sleep};
use sanity_ui::prelude::*;
use serde_json::{Map, Value, json};

use crate::previews::{DocPreview, image_url, local_preview};
use crate::releases::{Perspective, perspective, releases};
use crate::replica::replica;
use crate::router::{Route, link_click, use_router};
use crate::schema;
use crate::store::store;
use crate::use_app;
use crate::util::{group_digits, now_ms, published_id, release_of, storage_get, storage_set};

const PAGE: usize = 100;
pub const ROW_HEIGHT: f64 = 49.0;
/// Pages refetched when the list changes; further pages are dropped and load again on scroll.
const LIVE_PAGES: usize = 5;
/// How often a failed page query is retried, a second apart and then doubling.
const PAGE_RETRIES: u32 = 3;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Ordering {
    UpdatedAt,
    CreatedAt,
    Title,
}

impl Ordering {
    pub const ALL: [Ordering; 3] = [Ordering::UpdatedAt, Ordering::CreatedAt, Ordering::Title];

    pub fn title(self) -> &'static str {
        match self {
            Ordering::UpdatedAt => "Last edited",
            Ordering::CreatedAt => "Created",
            Ordering::Title => "Title",
        }
    }

    fn key(self) -> &'static str {
        match self {
            Ordering::UpdatedAt => "updated",
            Ordering::CreatedAt => "created",
            Ordering::Title => "title",
        }
    }

    fn parse(key: &str) -> Option<Ordering> {
        Ordering::ALL.into_iter().find(|ordering| ordering.key() == key)
    }

    fn groq(self, title_field: Option<&str>) -> String {
        match (self, title_field) {
            (Ordering::UpdatedAt, _) => "_updatedAt desc".into(),
            (Ordering::CreatedAt, _) => "_createdAt desc".into(),
            (Ordering::Title, Some(field)) => format!("lower({field}) asc, _id asc"),
            (Ordering::Title, None) => "_id asc".into(),
        }
    }
}

/// The parts of the list query that depend on the type only.
struct ListQuery {
    type_name: String,
    title_field: Option<String>,
}

impl ListQuery {
    fn groq(&self, ordering: Ordering, search: &str, page: usize) -> (String, Map<String, Value>) {
        let mut params = Map::from_iter([("type".to_owned(), json!(self.type_name))]);
        let mut filter = "_type == $type".to_owned();
        let search = search.trim();
        if !search.is_empty() {
            let field = self.title_field.as_deref().unwrap_or("_id");
            filter.push_str(&format!(" && {field} match $q"));
            params.insert("q".into(), json!(format!("{search}*")));
        }
        let start = page * PAGE;
        let groq = format!(
            r#"{{"total": count(*[{filter}]), "rows": *[{filter}] | order({}) [{start}...{}]._id}}"#,
            ordering.groq(self.title_field.as_deref()),
            start + PAGE,
        );
        (groq, params)
    }
}

/// The published ids of the rows, `None` for rows whose page has not loaded.
type Rows = Arc<Vec<Option<Arc<str>>>>;

#[derive(Clone, Debug, PartialEq)]
enum ListMode {
    Error(String),
    Empty { searching: bool },
    Loading,
    Ready,
}

#[derive(Clone, Copy)]
struct ListState {
    rows: RwSignal<Rows>,
    total: RwSignal<Option<usize>>,
    error: RwSignal<Option<String>>,
    ordering: RwSignal<Ordering>,
    search: RwSignal<String>,
    generation: StoredValue<u64>,
    /// Pages requested in the current generation.
    pages: StoredValue<HashSet<usize>>,
    scroll_reset: RwSignal<u64>,
    perf: crate::Perf,
}

impl ListState {
    fn load(self, query: Arc<ListQuery>, page: usize, first: bool) {
        let generation = self.generation.get_value();
        let ordering = self.ordering.get_untracked();
        let search = self.search.get_untracked();
        let perspective = releases().perspective.get_untracked();
        let started = now_ms();
        // A pane closed while its page was loading has disposed of its state.
        let current = move || self.generation.try_get_value() == Some(generation);
        spawn_local(async move {
            let (groq, params) = query.groq(ordering, &search, page);
            let mut attempt = 0;
            let result = loop {
                let result = store().client().query_in(&perspective.query(), &groq, &params, "document-list").await;
                if !current() {
                    return;
                }
                match result {
                    Err(_) if attempt < PAGE_RETRIES => {
                        sleep(1000 << attempt).await;
                        if !current() {
                            return;
                        }
                        attempt += 1;
                    }
                    result => break result,
                }
            };
            let value = match result {
                Ok(value) => value,
                Err(err) => {
                    // The page loads again when the list scrolls, and the rows shown stay.
                    self.pages.update_value(|pages| {
                        pages.remove(&page);
                    });
                    if self.total.get_untracked().is_some() {
                        store().error("Could not load documents", err.to_string());
                    } else {
                        self.error.set(Some(err.to_string()));
                    }
                    return;
                }
            };
            let total = value.get("total").and_then(Value::as_u64).unwrap_or(0) as usize;
            let page_rows: Vec<Arc<str>> = value
                .get("rows")
                .and_then(Value::as_array)
                .map(|rows| rows.iter().filter_map(Value::as_str).map(|id| Arc::from(published_id(id))).collect())
                .unwrap_or_default();
            if page == 0 {
                replica().prefetch(&page_rows);
            }
            if first {
                self.perf.list.set(Some(now_ms() - started));
            }
            self.error.set(None);
            self.total.set(Some(total));
            self.rows.update(|rows| {
                let rows = Arc::make_mut(rows);
                rows.resize(total, None);
                for (offset, row) in page_rows.into_iter().enumerate() {
                    if let Some(slot) = rows.get_mut(page * PAGE + offset) {
                        *slot = Some(row);
                    }
                }
            });
        });
    }

    fn reset(self, query: Arc<ListQuery>, remote: bool) {
        self.generation.update_value(|generation| *generation += 1);
        self.pages.set_value(HashSet::from([0]));
        self.error.set(None);
        self.total.set(None);
        self.rows.set(Arc::new(Vec::new()));
        self.scroll_reset.update(|reset| *reset += 1);
        if remote {
            self.load(query, 0, true);
        }
    }

    fn ensure(self, query: &Arc<ListQuery>, (start, end): (usize, usize)) {
        if end == 0 {
            return;
        }
        for page in start / PAGE..=(end - 1) / PAGE {
            let mut requested = false;
            self.pages.update_value(|pages| requested = pages.insert(page));
            if requested {
                self.load(query.clone(), page, false);
            }
        }
    }

    /// Refetches the pages in view after a change, so moved, added and removed documents land
    /// where the query puts them.
    fn refresh(self, query: Arc<ListQuery>) {
        let pages: Vec<usize> = self.pages.with_value(|pages| pages.iter().copied().collect());
        let (live, dropped): (Vec<usize>, Vec<usize>) = pages.into_iter().partition(|page| *page < LIVE_PAGES);
        if !dropped.is_empty() {
            self.pages.update_value(|pages| pages.retain(|page| *page < LIVE_PAGES));
            self.rows.update(|rows| {
                let rows = Arc::make_mut(rows);
                for page in dropped {
                    for slot in rows.iter_mut().skip(page * PAGE).take(PAGE) {
                        *slot = None;
                    }
                }
            });
        }
        for page in live {
            self.load(query.clone(), page, false);
        }
    }
}

#[component]
pub fn DocumentListPane(#[prop(into)] type_name: String) -> impl IntoView {
    let router = use_router();
    let schema = schema::current();
    let title = schema.type_title(&type_name);
    let preview = schema.preview(&type_name);
    let query = Arc::new(ListQuery { type_name: type_name.clone(), title_field: preview.title.clone() });
    replica().prioritize(&type_name);
    let order_key = format!("rust-studio:order:{type_name}");
    let state = ListState {
        rows: RwSignal::new(Arc::new(Vec::new())),
        total: RwSignal::new(None),
        error: RwSignal::new(None),
        ordering: RwSignal::new(
            storage_get(&order_key).and_then(|key| Ordering::parse(&key)).unwrap_or(Ordering::UpdatedAt),
        ),
        search: RwSignal::new(String::new()),
        generation: StoredValue::new(0),
        pages: StoredValue::new(HashSet::new()),
        scroll_reset: RwSignal::new(0),
        perf: use_app().perf,
    };
    let search_input = RwSignal::new(String::new());
    let sort_open = RwSignal::new(false);
    let sorted_in = StoredValue::new(0.0);
    let local = {
        let type_name = type_name.clone();
        Memo::new(move |_| {
            let started = now_ms();
            let rows = state
                .search
                .with(|search| replica().list(&type_name, &releases().perspective.get(), state.ordering.get(), search));
            sorted_in.set_value(now_ms() - started);
            rows
        })
    };
    let warmed = Memo::new(move |_| local.with(Option::is_some));
    Effect::new(move |_| {
        if local.with(Option::is_some) {
            state.perf.list.set(Some(sorted_in.get_value()));
        }
        state.perf.list_cached.set(warmed.get());
    });
    let rows = Signal::derive(move || local.get().unwrap_or_else(|| state.rows.get()));
    let total = Memo::new(move |_| match local.with(|rows| rows.as_ref().map(|rows| rows.len())) {
        Some(len) => Some(len),
        None => state.total.get(),
    });
    // Rebuilding the list would lose its scroll position, so only a change of mode re-renders.
    let mode = Memo::new(move |_| match (total.get(), state.error.get()) {
        (Some(0), _) => ListMode::Empty { searching: !state.search.with(|search| search.trim().is_empty()) },
        (Some(_), _) => ListMode::Ready,
        (None, Some(error)) => ListMode::Error(error),
        (None, None) => ListMode::Loading,
    });

    {
        let query = query.clone();
        Effect::new(move |previous: Option<(Ordering, String, Perspective, bool)>| {
            let inputs = (state.ordering.get(), state.search.get(), releases().perspective.get(), warmed.get());
            // The type finishing its warm-up keeps the scroll position; it only stops the pages.
            let changed = previous
                .as_ref()
                .is_none_or(|previous| previous.0 != inputs.0 || previous.1 != inputs.1 || previous.2 != inputs.2);
            if changed || !inputs.3 && previous.is_some_and(|previous| previous.3) {
                state.reset(query.clone(), !inputs.3);
            }
            inputs
        });
    }
    Effect::new(move |_| {
        let text = search_input.get();
        set_timeout(
            move || {
                let current = search_input.try_get_untracked();
                if current.as_ref() == Some(&text)
                    && state.search.try_get_untracked().is_some_and(|search| search != text)
                {
                    state.search.set(text);
                }
            },
            std::time::Duration::from_millis(200),
        );
    });

    // The listener only says that something changed; one refresh covers a burst of events.
    let pending = Rc::new(std::cell::Cell::new(false));
    let listener = {
        let query = query.clone();
        let params = Map::from_iter([("type".to_owned(), json!(type_name))]);
        let options =
            ListenOptions { include_result: false, include_all_versions: true, tag: "document-list.listener".into() };
        store().client().listen("*[_type == $type]", params, options, move |event| {
            let changed = match &event {
                ListenEvent::Mutation(mutation) => match release_of(&mutation.document_id) {
                    Some(release) => releases().perspective.get_untracked().release() == Some(release),
                    None => true,
                },
                ListenEvent::Welcome { reconnected } => *reconnected,
                _ => false,
            };
            if !changed || warmed.get_untracked() || pending.replace(true) {
                return;
            }
            let pending = pending.clone();
            let query = query.clone();
            spawn_local(async move {
                sleep(300).await;
                pending.set(false);
                state.refresh(query);
            });
        })
    };
    let listener = StoredValue::new_local(listener);
    on_cleanup(move || listener.dispose());

    let on_range = {
        let query = query.clone();
        Callback::new(move |range: (usize, usize)| {
            if !warmed.get_untracked() {
                state.ensure(&query, range);
            }
        })
    };

    let create = {
        let type_name = type_name.clone();
        move |_| {
            let id = store().create(&type_name, None);
            router.navigate(&Route::document(&type_name, &id));
        }
    };

    let row_type = type_name.clone();
    let render = Callback::new(move |(_, row): (usize, Option<Arc<str>>)| {
        view! { <ListRow id=row type_name=row_type.clone() /> }.into_any()
    });
    let set_ordering = move |ordering: Ordering| {
        storage_set(&order_key, ordering.key());
        sort_open.set(false);
        state.ordering.set(ordering);
    };
    let set_ordering = StoredValue::new(set_ordering);
    let create_title = format!("Create new {title}");
    let retry_query = query.clone();

    view! {
        <Flex direction="column" height="fill">
            <Box padding=Pad::all(2) style="flex: none;">
                <Flex align="center" gap=1>
                    <Box flex=1 padding=Pad::all(2)>
                        <Text size=1 weight=FontWeight::Semibold ellipsis=true>
                            {title.clone()}
                        </Text>
                    </Box>
                    <Popover
                        open=sort_open
                        placement=Placement::BottomEnd
                        min_width=200
                        content=move || {
                            view! {
                                <Menu>
                                    {Ordering::ALL
                                        .into_iter()
                                        .map(|ordering| {
                                            view! {
                                                <MenuItem
                                                    text=format!("Sort by {}", ordering.title())
                                                    icon=IconName::Sort
                                                    selected=Signal::derive(move || state.ordering.get() == ordering)
                                                    on_click=Callback::new(move |_| set_ordering.with_value(|set| set(ordering)))
                                                />
                                            }
                                        })
                                        .collect_view()}
                                </Menu>
                            }
                        }
                    >
                        <Button
                            mode=ButtonMode::Bleed
                            icon=IconName::Sort
                            title="Sort"
                            selected=Signal::derive(move || sort_open.get())
                            on_click=Callback::new(move |_| sort_open.update(|open| *open = !*open))
                        />
                    </Popover>
                    <Button mode=ButtonMode::Bleed icon=IconName::Compose title=create_title on_click=Callback::new(create) />
                </Flex>
                <Box padding=Pad::xy(0, 1)>
                    <TextInput
                        value=search_input
                        on_input=Callback::new(move |text: String| search_input.set(text))
                        placeholder="Search list"
                        icon=IconName::Search
                        font_size=1
                    />
                </Box>
            </Box>
            <Box flex=1 overflow="hidden" style="min-height: 0;">
                {move || match mode.get() {
                    ListMode::Error(error) => {
                        let query = retry_query.clone();
                        view! {
                            <Box padding=Pad::all(4)>
                                <Card tone=CardTone::Critical radius=2 padding=Pad::all(3)>
                                    <Stack space=3>
                                        <Text size=1>{error}</Text>
                                        <Flex>
                                            <Button
                                                mode=ButtonMode::Ghost
                                                icon=IconName::Sync
                                                text="Retry"
                                                on_click=Callback::new(move |_| state.reset(query.clone(), true))
                                            />
                                        </Flex>
                                    </Stack>
                                </Card>
                            </Box>
                        }
                        .into_any()
                    }
                    ListMode::Empty { searching } => view! {
                        <Box padding=Pad::all(4)>
                            <Text size=1 muted=true align="center">
                                {if searching { "No matching documents" } else { "No documents of this type" }}
                            </Text>
                        </Box>
                    }
                    .into_any(),
                    ListMode::Loading => view! {
                        <Box padding=Pad::xy(2, 0)>
                            {(0..12).map(|_| view! { <ListRow id=None type_name=String::new() /> }).collect_view()}
                        </Box>
                    }
                    .into_any(),
                    ListMode::Ready => view! {
                        <VirtualList
                            items=rows
                            row_height=ROW_HEIGHT
                            key=row_key
                            render=render
                            on_range=on_range
                            scroll_to_top=state.scroll_reset
                        />
                    }
                    .into_any(),
                }}
            </Box>
            <Show when=move || total.get().is_some()>
                <Box padding=Pad::all(2) style="flex: none; border-top: 1px solid var(--card-border-color);">
                    <Text size=0 muted=true align="center">
                        {move || {
                            let total = total.get().unwrap_or(0);
                            let source = if warmed.get() { "in memory" } else { "paged from the API" };
                            format!("{} documents · {source}", group_digits(total))
                        }}
                    </Text>
                </Box>
            </Show>
        </Flex>
    }
}

pub fn media_box(media: Option<String>, size: u32) -> impl IntoView {
    let style = format!(
        "width: {size}px; height: {size}px; flex: none; border-radius: 0.1875rem; overflow: hidden; display: flex; align-items: center; justify-content: center; background-color: var(--card-muted-bg-color);"
    );
    let image = media.and_then(|media| image_url(&media, size * 2));
    view! {
        <span style=style>
            {match image {
                Some(src) => view! { <img src=src alt="" width=size height=size style="display: block; object-fit: cover;" /> }.into_any(),
                None => view! { <Text size=1 muted=true><Icon icon=IconName::Document /></Text> }.into_any(),
            }}
        </span>
    }
}

pub fn status_dot(draft: bool) -> impl IntoView {
    let (color, title) = if draft {
        ("var(--card-badge-caution-dot-color)", "Has unpublished changes")
    } else {
        ("var(--card-badge-positive-dot-color)", "Published")
    };
    view! {
        <span title=title style=format!("width: 9px; height: 9px; border-radius: 9999px; flex: none; background-color: {color};") />
    }
}

fn row_key(row: &Option<Arc<str>>) -> Option<Arc<str>> {
    row.clone()
}

/// Media, title, subtitle (or when it was edited) and the publish status of a document.
pub fn preview_content(preview: DocPreview) -> impl IntoView {
    let subtitle = preview
        .subtitle
        .clone()
        .unwrap_or_else(|| preview.updated_at.as_deref().map(crate::util::time_ago).unwrap_or_default());
    view! {
        <Flex align="center" gap=2>
            {media_box(preview.media.clone(), 33)}
            <Stack space=2 flex=1>
                <Text size=1 weight=FontWeight::Medium ellipsis=true>
                    {preview.title.clone().unwrap_or_else(|| "Untitled".into())}
                </Text>
                <Text size=1 muted=true ellipsis=true>
                    {subtitle}
                </Text>
            </Stack>
            {status_dot(preview.draft)}
        </Flex>
    }
}

fn skeleton_content() -> impl IntoView {
    view! {
        <Flex align="center" gap=2>
            <Skeleton width="33px" height="33px" radius=1 />
            <Stack space=2 flex=1>
                <Skeleton width="60%" height="0.8125rem" />
                <Skeleton width="35%" height="0.8125rem" />
            </Stack>
        </Flex>
    }
}

/// The row of a page that has not loaded, whose document is not known yet.
fn row_skeleton() -> AnyView {
    view! {
        <Box padding=Pad::all(2) style=format!("height: {ROW_HEIGHT}px;")>
            {skeleton_content()}
        </Box>
    }
    .into_any()
}

/// A row shows its document once the open document pane or the replica holds every document of
/// its group, and a skeleton until then, which asks the replica to fetch the group. The skeleton
/// links to the document too, which opens with the loading state of a document not held yet.
/// A group restored from the last visit shows dimmed, pulsing, until a fetch or the type's
/// revalidation confirms it.
#[component]
fn ListRow(id: Option<Arc<str>>, type_name: String) -> impl IntoView {
    let Some(id) = id else { return row_skeleton() };
    let router = use_router();
    let route = Route::document(&type_name, &id);
    let selected = Signal::derive({
        let id = id.clone();
        move || router.route.with(|route| route.document_id.as_deref() == Some(id.as_ref()))
    });
    let preview = Memo::new({
        let id = id.clone();
        move |_| local_preview(&id).or_else(|| replica().preview(&type_name, &id, &perspective()))
    });
    let wanted = StoredValue::new(false);
    Effect::new({
        let id = id.clone();
        move |_| {
            let missing = preview.with(|preview| preview.as_ref().is_none_or(|preview| preview.stale));
            if missing != wanted.get_value() {
                wanted.set_value(missing);
                match missing {
                    true => replica().want(id.clone()),
                    false => replica().unwant(&id),
                }
            }
        }
    });
    on_cleanup({
        let id = id.clone();
        move || {
            if wanted.try_get_value() == Some(true) {
                replica().unwant(&id);
            }
        }
    });
    view! {
        <Box padding=Pad::xy(2, 0)>
            <Card
                as_="a"
                href=route.href()
                radius=2
                padding=Pad::all(2)
                selected=selected
                on_click=Callback::new(link_click(router, route.clone()))
            >
                {move || match preview.get() {
                    Some(preview) if preview.stale => {
                        view! { <div data-stale="">{preview_content(preview)}</div> }.into_any()
                    }
                    Some(preview) => preview_content(preview).into_any(),
                    None => skeleton_content().into_any(),
                }}
            </Card>
        </Box>
    }
    .into_any()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_paged_queries() {
        let query = ListQuery { type_name: "author".into(), title_field: Some("name".into()) };
        let (groq, params) = query.groq(Ordering::Title, "", 2);
        assert_eq!(
            groq,
            r#"{"total": count(*[_type == $type]), "rows": *[_type == $type] | order(lower(name) asc, _id asc) [200...300]._id}"#
        );
        assert_eq!(params.get("type"), Some(&json!("author")));
        let (groq, params) = query.groq(Ordering::UpdatedAt, " ada ", 0);
        assert!(groq.starts_with(r#"{"total": count(*[_type == $type && name match $q])"#));
        assert_eq!(params.get("q"), Some(&json!("ada*")));
    }
}
