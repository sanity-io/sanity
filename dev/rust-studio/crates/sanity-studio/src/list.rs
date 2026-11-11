//! The document list pane: every document of a type in a virtualized list that fetches the
//! pages that scroll into view, kept current by a listener and seeded from a cached first page.

use std::collections::HashSet;
use std::rc::Rc;
use std::sync::Arc;

use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_client::{ListenEvent, ListenOptions, sleep};
use sanity_ui::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};

use crate::previews::{DocPreview, image_url, local_preview};
use crate::router::{Route, link_click, use_router};
use crate::schema;
use crate::store::store;
use crate::use_app;
use crate::util::{now_ms, storage_get, storage_set};

const PAGE: usize = 100;
pub const ROW_HEIGHT: f64 = 49.0;
/// Pages refetched when the list changes; further pages are dropped and load again on scroll.
const LIVE_PAGES: usize = 5;

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
    projection: String,
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
            r#"{{"total": count(*[{filter}]), "rows": *[{filter}] | order({}) [{start}...{}] {}}}"#,
            ordering.groq(self.title_field.as_deref()),
            start + PAGE,
            self.projection
        );
        (groq, params)
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
struct CachedPage {
    total: usize,
    rows: Vec<DocPreview>,
}

fn cache_key(type_name: &str, ordering: Ordering) -> String {
    format!("rust-studio:list:v1:{type_name}:{}", ordering.key())
}

type Rows = Arc<Vec<Option<DocPreview>>>;

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
        let started = now_ms();
        spawn_local(async move {
            let (groq, params) = query.groq(ordering, &search, page);
            let result = store().client().query_in("drafts", &groq, &params, "document-list").await;
            // A pane closed while its page was loading has disposed of its state.
            if self.generation.try_get_value() != Some(generation) {
                return;
            }
            let value = match result {
                Ok(value) => value,
                Err(err) => {
                    self.pages.update_value(|pages| {
                        pages.remove(&page);
                    });
                    // Only surface an error when nothing is on screen yet; a failed later page
                    // must not unmount the virtual list and wipe scroll position.
                    if self.total.get_untracked().is_none() {
                        self.error.set(Some(err.to_string()));
                    }
                    return;
                }
            };
            let total = value.get("total").and_then(Value::as_u64).unwrap_or(0) as usize;
            let page_rows: Vec<DocPreview> = value
                .get("rows")
                .and_then(Value::as_array)
                .map(|rows| rows.iter().filter_map(DocPreview::from_projection).collect())
                .unwrap_or_default();
            if page == 0 && search.trim().is_empty() {
                let cached = CachedPage { total, rows: page_rows.clone() };
                if let Ok(json) = serde_json::to_string(&cached) {
                    storage_set(&cache_key(&query.type_name, ordering), &json);
                }
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

    fn reset(self, query: Arc<ListQuery>) {
        self.generation.update_value(|generation| *generation += 1);
        self.pages.set_value(HashSet::from([0]));
        let ordering = self.ordering.get_untracked();
        let cached = self
            .search
            .with_untracked(|search| search.trim().is_empty())
            .then(|| storage_get(&cache_key(&query.type_name, ordering)))
            .flatten()
            .and_then(|json| serde_json::from_str::<CachedPage>(&json).ok());
        self.perf.list_cached.set(cached.is_some());
        match cached {
            Some(cached) => {
                let mut rows: Vec<Option<DocPreview>> = cached.rows.into_iter().map(Some).collect();
                rows.resize(cached.total, None);
                self.total.set(Some(cached.total));
                self.rows.set(Arc::new(rows));
            }
            None => {
                self.total.set(None);
                self.rows.set(Arc::new(Vec::new()));
            }
        }
        self.scroll_reset.update(|reset| *reset += 1);
        self.load(query, 0, true);
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
    let query = Arc::new(ListQuery {
        type_name: type_name.clone(),
        title_field: preview.title.clone(),
        projection: schema.preview_projection(std::slice::from_ref(&type_name)),
    });
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
    // Rebuilding the list would lose its scroll position, so only a change of mode re-renders.
    // An error after rows are on screen keeps Ready so the virtual list stays mounted.
    let mode = Memo::new(move |_| match (state.error.get(), state.total.get()) {
        (Some(error), None) => ListMode::Error(error),
        (_, Some(0)) => ListMode::Empty { searching: !state.search.with(|search| search.trim().is_empty()) },
        (None, None) => ListMode::Loading,
        (_, Some(_)) => ListMode::Ready,
    });

    {
        let query = query.clone();
        Effect::new(move |_| {
            state.ordering.track();
            state.search.track();
            state.reset(query.clone());
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
        let options = ListenOptions { include_result: false, tag: "document-list.listener".into() };
        store().client().listen("*[_type == $type]", params, options, move |event| {
            let changed = match &event {
                ListenEvent::Mutation(mutation) => !mutation.document_id.starts_with("versions."),
                ListenEvent::Welcome { reconnected } => *reconnected,
                _ => false,
            };
            if !changed || pending.replace(true) {
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
        Callback::new(move |range: (usize, usize)| state.ensure(&query, range))
    };

    let create = {
        let type_name = type_name.clone();
        move |_| {
            let id = store().create(&type_name, None);
            router.navigate(&Route::document(&type_name, &id));
        }
    };

    let row_type = type_name.clone();
    let render = Callback::new(move |(_, row): (usize, Option<DocPreview>)| {
        view! { <ListRow row=row type_name=row_type.clone() /> }.into_any()
    });
    let set_ordering = move |ordering: Ordering| {
        storage_set(&order_key, ordering.key());
        sort_open.set(false);
        state.ordering.set(ordering);
    };
    let set_ordering = StoredValue::new(set_ordering);
    let create_title = format!("Create new {title}");

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
                    ListMode::Error(error) => view! {
                        <Box padding=Pad::all(4)>
                            <Card tone=CardTone::Critical radius=2 padding=Pad::all(3)>
                                <Text size=1>{error}</Text>
                            </Card>
                        </Box>
                    }
                    .into_any(),
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
                            {(0..12).map(|_| view! { <ListRow row=None type_name=String::new() /> }).collect_view()}
                        </Box>
                    }
                    .into_any(),
                    ListMode::Ready => view! {
                        <VirtualList
                            items=state.rows
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
            <Show when=move || state.total.get().is_some_and(|total| total > PAGE)>
                <Box padding=Pad::all(2) style="flex: none; border-top: 1px solid var(--card-border-color);">
                    <Text size=0 muted=true align="center">
                        {move || {
                            let total = state.total.get().unwrap_or(0);
                            let loaded = state.rows.with(|rows| rows.iter().filter(|row| row.is_some()).count());
                            format!("{total} documents · {loaded} loaded")
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

/// Rows re-render when the document changes or its skeleton gets filled in.
fn row_key(row: &Option<DocPreview>) -> Option<(String, Option<String>, bool)> {
    row.as_ref().map(|row| (row.id.clone(), row.updated_at.clone(), row.draft))
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

#[component]
fn ListRow(row: Option<DocPreview>, type_name: String) -> impl IntoView {
    let Some(row) = row else {
        return view! {
            <Flex align="center" gap=2 padding=Pad::all(2) style=format!("height: {ROW_HEIGHT}px;")>
                <Skeleton width="33px" height="33px" radius=1 />
                <Stack space=2 flex=1>
                    <Skeleton width="60%" height="0.8125rem" />
                    <Skeleton width="35%" height="0.8125rem" />
                </Stack>
            </Flex>
        }
        .into_any();
    };
    let router = use_router();
    let route = Route::document(&type_name, &row.id);
    let id = row.id.clone();
    let selected = Signal::derive({
        let id = id.clone();
        move || router.route.with(|route| route.document_id.as_deref() == Some(id.as_str()))
    });
    let preview = Signal::derive(move || local_preview(&id).unwrap_or_else(|| row.clone()));
    view! {
        <Box padding=Pad::xy(2, 0)>
            <Card
                as_="a"
                href=route.href()
                radius=2
                padding=Pad::all(2)
                selected=selected
                on_click=Callback::new(link_click(router, route))
            >
                {move || preview_content(preview.get())}
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
        let query =
            ListQuery { type_name: "author".into(), title_field: Some("name".into()), projection: "{_id}".into() };
        let (groq, params) = query.groq(Ordering::Title, "", 2);
        assert_eq!(
            groq,
            r#"{"total": count(*[_type == $type]), "rows": *[_type == $type] | order(lower(name) asc, _id asc) [200...300] {_id}}"#
        );
        assert_eq!(params.get("type"), Some(&json!("author")));
        let (groq, params) = query.groq(Ordering::UpdatedAt, " ada ", 0);
        assert!(groq.starts_with(r#"{"total": count(*[_type == $type && name match $q])"#));
        assert_eq!(params.get("q"), Some(&json!("ada*")));
    }
}
