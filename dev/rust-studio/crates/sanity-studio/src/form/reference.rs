//! The reference input: the referenced document's preview, and a search over the allowed types
//! to pick a different one.

use std::sync::Arc;

use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_mutator::{PatchOp, Segment};
use sanity_ui::prelude::*;
use serde_json::{Value, json};

use super::Target;
use crate::list::preview_content;
use crate::previews::{DocPreview, PreviewState, existing_ids, preview, search};
use crate::router::{Route, link_click, use_router};
use crate::schema::{self, Resolved};

/// Points the reference at `chosen`. A document that has never been published is referenced
/// weakly and strengthened when it is published, like `_strengthenOnPublish` in the JS studio.
fn choose(target: &Target, resolved: &Resolved, chosen: DocPreview) {
    let target = target.clone();
    let weak = resolved.option("weak").and_then(Value::as_bool).unwrap_or(false);
    spawn_local(async move {
        let published = existing_ids(std::slice::from_ref(&chosen.id)).await.is_ok_and(|ids| ids.contains(&chosen.id));
        let mut fields = vec![("_ref", json!(chosen.id))];
        if weak || !published {
            fields.push(("_weak", json!(true)));
        }
        if !published {
            let mut strengthen = json!({"type": chosen.type_name});
            if weak {
                strengthen["weak"] = json!(true);
            }
            fields.push(("_strengthenOnPublish", strengthen));
        }
        // Inside arrays the item carries `_key` and `_type`, so only its reference fields change.
        if matches!(target.value_untracked(), Some(Value::Object(_))) {
            let mut ops: Vec<PatchOp> = ["_weak", "_strengthenOnPublish"]
                .into_iter()
                .filter(|key| !fields.iter().any(|(field, _)| field == key))
                .map(|key| PatchOp::unset(target.child(Segment::attr(key)).path))
                .collect();
            ops.extend(
                fields.into_iter().map(|(key, value)| PatchOp::set(target.child(Segment::attr(key)).path, value)),
            );
            target.patch(ops);
        } else {
            let mut value = json!({"_type": "reference"});
            for (key, field) in fields {
                value[key] = field;
            }
            target.set(value);
        }
    });
}

#[component]
fn ReferenceSearch(target: Target, resolved: Arc<Resolved>, on_done: Callback<()>, autofocus: bool) -> impl IntoView {
    let text = RwSignal::new(String::new());
    let results = RwSignal::new(None::<Result<Vec<DocPreview>, String>>);
    let open = RwSignal::new(false);
    let generation = StoredValue::new(0u64);
    let types = resolved.to.clone();
    let read_only = target.read_only;
    let placeholder = {
        let schema = schema::current();
        let titles: Vec<String> = types.iter().map(|name| schema.type_title(name)).collect();
        format!("Search {}", titles.join(", "))
    };
    let run = move |query: String| {
        let types = types.clone();
        let current = generation.get_value() + 1;
        generation.set_value(current);
        spawn_local(async move {
            if !query.is_empty() {
                sanity_client::sleep(150).await;
            }
            if generation.get_value() != current {
                return;
            }
            let found = search(&types, &query, 20).await.map_err(|error| error.to_string());
            if generation.get_value() == current {
                results.set(Some(found));
            }
        });
    };
    let on_input = {
        let run = run.clone();
        Callback::new(move |value: String| {
            text.set(value.clone());
            open.set(true);
            run(value);
        })
    };
    let on_focus = Callback::new(move |_: ()| {
        if !open.get_untracked() {
            open.set(true);
            run(text.get_untracked());
        }
    });
    let pick = StoredValue::new(move |chosen: DocPreview| {
        choose(&target, &resolved, chosen);
        open.set(false);
        on_done.run(());
    });
    let body = move || {
        match results.get() {
            None => view! { <Box padding=Pad::all(3)><Spinner muted=true /></Box> }.into_any(),
            Some(Err(error)) => view! {
                <Box padding=Pad::all(3)>
                    <Text size=1 muted=true>{format!("Search failed: {error}")}</Text>
                </Box>
            }
            .into_any(),
            Some(Ok(found)) if found.is_empty() => view! {
                <Box padding=Pad::all(3)>
                    <Text size=1 muted=true>"No matching documents"</Text>
                </Box>
            }
            .into_any(),
            Some(Ok(found)) => found
                .into_iter()
                .map(|doc| {
                    let chosen = doc.clone();
                    view! {
                        <Card as_="button" radius=2 padding=Pad::all(2) on_click=Callback::new(move |_| pick.read_value()(chosen.clone()))>
                            {preview_content(doc)}
                        </Card>
                    }
                })
                .collect_view()
                .into_any(),
        }
    };
    // The popover renders its content once, so the results update inside it.
    let content = move || view! { <Stack space=1 padding=Pad::all(1)>{body}</Stack> };
    view! {
        <Popover open=open block=true match_width=true max_height=320 content=content>
            <div on:focusin=move |_| on_focus.run(())>
                <TextInput
                    value=text
                    on_input=on_input
                    icon=IconName::Search
                    placeholder=placeholder
                    read_only=read_only
                    autofocus=autofocus
                />
            </div>
        </Popover>
    }
}

#[component]
pub fn ReferenceInput(target: Target, resolved: Arc<Resolved>) -> impl IntoView {
    let router = use_router();
    let replacing = RwSignal::new(false);
    let reference = {
        let target = target.clone();
        Memo::new(move |_| {
            target.value().and_then(|value| value.get("_ref").and_then(Value::as_str).map(str::to_owned))
        })
    };
    let read_only = target.read_only;
    let target = StoredValue::new(target);
    let resolved = StoredValue::new(resolved);
    let menu_open = RwSignal::new(false);
    move || match (reference.get(), replacing.get()) {
        (Some(id), false) => {
            let state = preview(&id);
            let card = {
                let id = id.clone();
                move || match state.get() {
                    PreviewState::Loading => view! {
                        <Flex align="center" gap=2 padding=Pad::all(2)>
                            <Skeleton width="33px" height="33px" radius=1 />
                            <Skeleton width="40%" height="0.8125rem" />
                        </Flex>
                    }
                    .into_any(),
                    PreviewState::Missing => {
                        let text = format!("Document not found or not accessible: {id}");
                        view! {
                            <Flex align="center" gap=2 padding=Pad::all(2)>
                                <Text size=1 muted=true><Icon icon=IconName::WarningOutline /></Text>
                                <Text size=1 muted=true ellipsis=true>{text}</Text>
                            </Flex>
                        }
                        .into_any()
                    }
                    PreviewState::Ready(doc) => {
                        let route = Route::document(&doc.type_name, &doc.id);
                        view! {
                            <Card as_="a" href=route.href() radius=2 padding=Pad::all(2) on_click=Callback::new(link_click(router, route))>
                                {preview_content(doc)}
                            </Card>
                        }
                        .into_any()
                    }
                }
            };
            view! {
                <Card border=true radius=2 padding=Pad::all(1)>
                    <Flex align="center" gap=1>
                        <Box flex=1>{card}</Box>
                        <Popover
                            open=menu_open
                            placement=Placement::BottomEnd
                            content=move || {
                                view! {
                                    <Menu>
                                        <MenuItem
                                            text="Replace"
                                            icon=IconName::Sync
                                            disabled=read_only
                                            on_click=Callback::new(move |_| {
                                                menu_open.set(false);
                                                replacing.set(true);
                                            })
                                        />
                                        <MenuItem
                                            text="Remove"
                                            icon=IconName::Trash
                                            tone=StateTone::Critical
                                            disabled=read_only
                                            on_click=Callback::new(move |_| {
                                                menu_open.set(false);
                                                target.read_value().unset();
                                            })
                                        />
                                    </Menu>
                                }
                            }
                        >
                            <Button
                                mode=ButtonMode::Bleed
                                icon=IconName::EllipsisHorizontal
                                title="Show more"
                                on_click=Callback::new(move |_| menu_open.update(|open| *open = !*open))
                            />
                        </Popover>
                    </Flex>
                </Card>
            }
            .into_any()
        }
        (current, _) => {
            let replacing_existing = current.is_some();
            view! {
                <Flex gap=1 align="center">
                    <Box flex=1>
                        <ReferenceSearch
                            target=target.get_value()
                            resolved=resolved.get_value()
                            on_done=Callback::new(move |_| replacing.set(false))
                            autofocus=replacing_existing
                        />
                    </Box>
                    {replacing_existing
                        .then(|| {
                            view! { <Button mode=ButtonMode::Bleed text="Cancel" on_click=Callback::new(move |_| replacing.set(false)) /> }
                        })}
                </Flex>
            }
            .into_any()
        }
    }
}
