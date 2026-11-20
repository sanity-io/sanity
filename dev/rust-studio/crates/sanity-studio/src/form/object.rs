//! Objects: the fields of a document or nested object, grouped into fieldsets, plus the image,
//! file and geopoint inputs that wrap their own fields.

use std::sync::Arc;

use leptos::prelude::*;
use sanity_ui::prelude::*;
use serde_json::Value;

use sanity_client::AssetKind;

use super::asset::AssetInput;
use super::inputs::{SyncedInput, number_from};
use super::{Target, render_field};
use crate::schema::{FieldsetDef, Kind, Resolved, TypeDef};

fn option_bool(options: &Option<Value>, key: &str) -> bool {
    options.as_ref().and_then(|options| options.get(key)).and_then(Value::as_bool).unwrap_or(false)
}

#[component]
fn Fieldset(
    title: String,
    description: Option<String>,
    collapsible: bool,
    collapsed: bool,
    columns: Option<usize>,
    children: ChildrenFn,
) -> impl IntoView {
    let open = RwSignal::new(!collapsed);
    let children = StoredValue::new(children);
    let body = move || {
        let content = children.read_value()();
        match columns {
            Some(columns) => view! { <Grid columns=columns gap=4>{content}</Grid> }.into_any(),
            None => view! { <Stack space=5>{content}</Stack> }.into_any(),
        }
    };
    view! {
        <Stack space=3>
            {if collapsible {
                view! {
                    <button
                        type="button"
                        style="all: unset; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;"
                        on:click=move |_| open.update(|open| *open = !*open)
                    >
                        <Text size=1 muted=true>
                            {move || view! { <Icon icon=if open.get() { IconName::ChevronDown } else { IconName::ChevronRight } /> }}
                        </Text>
                        <Text size=1 weight=FontWeight::Semibold>
                            {title.clone()}
                        </Text>
                    </button>
                }
                .into_any()
            } else {
                view! {
                    <Text size=1 weight=FontWeight::Semibold>
                        {title.clone()}
                    </Text>
                }
                .into_any()
            }}
            {description.map(|description| view! { <Text size=1 muted=true>{description}</Text> })}
            <Show when=move || open.get()>
                <Box padding=Pad { top: 1, right: 0, bottom: 1, left: 3 } style="border-left: 1px solid var(--card-border-color);">
                    {body()}
                </Box>
            </Show>
        </Stack>
    }
}

/// The fields of an object in schema order; fields that share a fieldset render together, at
/// the position of the first of them.
#[component]
pub fn Fields(
    target: Target,
    object_type: String,
    fields: Arc<Vec<TypeDef>>,
    fieldsets: Arc<Vec<FieldsetDef>>,
    level: usize,
) -> impl IntoView {
    let mut rendered_fieldsets: Vec<String> = Vec::new();
    let mut views: Vec<AnyView> = Vec::new();
    for field in fields.iter() {
        match field.fieldset.as_deref().and_then(|name| fieldsets.iter().find(|fieldset| fieldset.name == name)) {
            Some(fieldset) => {
                if rendered_fieldsets.contains(&fieldset.name) {
                    continue;
                }
                rendered_fieldsets.push(fieldset.name.clone());
                let members: Vec<TypeDef> = fields
                    .iter()
                    .filter(|field| field.fieldset.as_deref() == Some(fieldset.name.as_str()))
                    .cloned()
                    .collect();
                if members.iter().all(crate::schema::is_hidden) {
                    continue;
                }
                let target = target.clone();
                let object_type = object_type.clone();
                let columns = fieldset
                    .options
                    .as_ref()
                    .and_then(|options| options.get("columns"))
                    .and_then(Value::as_u64)
                    .map(|columns| columns as usize);
                views.push(
                    view! {
                        <Fieldset
                            title=fieldset.title.clone().unwrap_or_else(|| crate::util::start_case(&fieldset.name))
                            description=None
                            collapsible=option_bool(&fieldset.options, "collapsible") || option_bool(&fieldset.options, "collapsed")
                            collapsed=option_bool(&fieldset.options, "collapsed")
                            columns=columns
                        >
                            {members.iter().map(|field| render_field(&target, &object_type, field, level)).collect_view()}
                        </Fieldset>
                    }
                    .into_any(),
                );
            }
            None => views.push(render_field(&target, &object_type, field, level)),
        }
    }
    view! { <Stack space=5>{views}</Stack> }
}

fn number_text(value: Option<&Value>) -> String {
    value.and_then(Value::as_f64).map(|number| number.to_string()).unwrap_or_default()
}

fn geopoint_input(target: Target) -> impl IntoView {
    let lat = target.object_field("geopoint", "lat");
    let lng = target.object_field("geopoint", "lng");
    view! {
        <Grid columns=2 gap=3>
            <Stack space=2>
                <Text size=1 muted=true>"Latitude"</Text>
                <SyncedInput target=lat to_text=number_text from_text=number_from input_type="number" />
            </Stack>
            <Stack space=2>
                <Text size=1 muted=true>"Longitude"</Text>
                <SyncedInput target=lng to_text=number_text from_text=number_from input_type="number" />
            </Stack>
        </Grid>
    }
}

#[component]
pub fn ObjectInput(target: Target, resolved: Arc<Resolved>, level: usize) -> impl IntoView {
    let object_type = resolved.type_name.clone();
    let fields: Arc<Vec<TypeDef>> = Arc::new(
        resolved
            .fields
            .iter()
            .filter(|field| !(matches!(resolved.kind, Kind::Image | Kind::File) && field.name == "asset"))
            .cloned()
            .collect(),
    );
    let asset_kind = match resolved.kind {
        Kind::Image => Some(AssetKind::Image),
        Kind::File => Some(AssetKind::File),
        Kind::Geopoint => return geopoint_input(target).into_any(),
        _ => None,
    };
    let header = asset_kind.map(|kind| {
        view! {
            <AssetInput target=target.clone() kind=kind type_name=resolved.type_name.clone() options=resolved.options.clone() />
        }
    });
    let has_fields = !fields.is_empty();
    let collapsible = option_bool(&resolved.options, "collapsible") || option_bool(&resolved.options, "collapsed");
    let open = RwSignal::new(!option_bool(&resolved.options, "collapsed"));
    let fieldsets = resolved.fieldsets.clone();
    let body = StoredValue::new(move || {
        let (target, object_type, fields, fieldsets) =
            (target.clone(), object_type.clone(), fields.clone(), fieldsets.clone());
        has_fields.then(move || {
            view! {
                <Box padding=Pad { top: 1, right: 0, bottom: 1, left: 3 } style="border-left: 1px solid var(--card-border-color);">
                    <Fields target=target object_type=object_type fields=fields fieldsets=fieldsets level=level />
                </Box>
            }
        })
    });
    view! {
        <Stack space=4>
            {header}
            {collapsible
                .then(|| {
                    view! {
                        <button
                            type="button"
                            style="all: unset; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;"
                            on:click=move |_| open.update(|open| *open = !*open)
                        >
                            <Text size=1 muted=true>
                                {move || view! { <Icon icon=if open.get() { IconName::ChevronDown } else { IconName::ChevronRight } /> }}
                            </Text>
                            <Text size=1 muted=true>
                                {move || if open.get() { "Hide fields" } else { "Show fields" }}
                            </Text>
                        </button>
                    }
                })}
            <Show when=move || open.get()>{body.read_value()()}</Show>
        </Stack>
    }
    .into_any()
}
