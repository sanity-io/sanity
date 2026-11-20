//! The structure tool: the type list, the document list of the selected type and the open
//! document, side by side like the JS studio's panes.

use leptos::prelude::*;
use sanity_ui::prelude::*;

use crate::document::DocumentPane;
use crate::list::DocumentListPane;
use crate::router::{Route, link_click};
use crate::schema;
use crate::use_app;

#[component]
fn TypeListPane() -> impl IntoView {
    let app = use_app();
    let router = app.router;
    let filter = RwSignal::new(String::new());
    let types = move || {
        app.schema_version.track();
        let query = filter.get().to_lowercase();
        schema::current()
            .document_types()
            .iter()
            .map(|def| (def.name.clone(), schema::title_of(def)))
            .filter(|(name, title)| {
                query.is_empty() || title.to_lowercase().contains(&query) || name.to_lowercase().contains(&query)
            })
            .collect::<Vec<_>>()
    };
    view! {
        <Flex direction="column" height="fill">
            <Box padding=Pad::all(2) style="flex: none;">
                <Box padding=Pad::all(2)>
                    <Text size=1 weight=FontWeight::Semibold>
                        "Content"
                    </Text>
                </Box>
                <Box padding=Pad::xy(0, 1)>
                    <TextInput
                        value=filter
                        on_input=Callback::new(move |text: String| filter.set(text))
                        placeholder="Filter types"
                        icon=IconName::Search
                        font_size=1
                    />
                </Box>
            </Box>
            <Box flex=1 overflow="auto" padding=Pad::xy(2, 0) style="min-height: 0;">
                <Stack space=1 padding=Pad { top: 0, right: 0, bottom: 2, left: 0 }>
                    <For each=types key=|(name, _)| name.clone() let((name, title))>
                        {
                            let route = Route::list(&name);
                            let selected = {
                                let name = name.clone();
                                Signal::derive(move || router.route.with(|route| route.type_name.as_deref() == Some(name.as_str())))
                            };
                            view! {
                                <Card
                                    as_="a"
                                    href=route.href()
                                    radius=2
                                    padding=Pad::all(2)
                                    selected=selected
                                    on_click=Callback::new(link_click(router, route))
                                >
                                    <Flex align="center" gap=2>
                                        <Text size=1>
                                            <Icon icon=IconName::Document />
                                        </Text>
                                        <Box flex=1>
                                            <Text size=1 weight=FontWeight::Medium ellipsis=true>
                                                {title}
                                            </Text>
                                        </Box>
                                        <Text size=1 muted=true>
                                            <Icon icon=IconName::ChevronRight />
                                        </Text>
                                    </Flex>
                                </Card>
                            }
                        }
                    </For>
                </Stack>
            </Box>
        </Flex>
    }
}

#[component]
pub fn Structure() -> impl IntoView {
    let app = use_app();
    let route = app.router.route;
    let type_name = Memo::new(move |_| route.with(|route| route.type_name.clone()));
    let document = Memo::new(move |_| route.with(|route| route.type_name.clone().zip(route.document_id.clone())));

    view! {
        <Flex height="fill" style="min-width: 0;">
            <Card border_right=true style="width: 18rem; flex: none; min-width: 0;">
                <TypeListPane />
            </Card>
            {move || {
                app.schema_version.track();
                type_name
                    .get()
                    .filter(|name| schema::current().get(name).is_some())
                    .map(|name| {
                        view! {
                            <Card border_right=true style="width: 22rem; flex: none; min-width: 0;">
                                <DocumentListPane type_name=name />
                            </Card>
                        }
                    })
            }}
            <Box flex=1 style="min-width: 0;">
                {move || match document.get() {
                    Some((type_name, id)) => view! { <DocumentPane type_name=type_name id=id /> }.into_any(),
                    None => view! {
                        <Flex align="center" justify="center" height="fill" padding=Pad::all(4)>
                            <Stack space=3>
                                <Text align="center" muted=true>
                                    <Icon icon=IconName::Document />
                                </Text>
                                <Text size=1 muted=true align="center">
                                    {move || if type_name.get().is_some() { "Select a document to edit it" } else { "Select a document type" }}
                                </Text>
                            </Stack>
                        </Flex>
                    }
                    .into_any(),
                }}
            </Box>
        </Flex>
    }
}
