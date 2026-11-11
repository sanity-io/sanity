//! Port of `@sanity/ui`'s `build/merge.ts` and `build/resolveColorTokens.ts`: turn the sparse
//! token tree (with `*` wildcards) into a dense one with a node per tone, mode and state.

use serde_json::{Map, Value, json};

use super::{BUTTON_MODES, CARD_TONES, INPUT_MODES, INPUT_STATES, STATE_TONES, STATES};

pub const DEFAULT_COLOR_TOKENS: &str = include_str!("default_color_tokens.json");

/// Deep merge of records, later records winning; non-record values replace.
pub fn merge(records: &[Option<&Value>]) -> Value {
    let mut acc = Map::new();
    for record in records.iter().flatten() {
        if let Value::Object(source) = record {
            merge_into(&mut acc, source);
        }
    }
    Value::Object(acc)
}

fn merge_into(acc: &mut Map<String, Value>, source: &Map<String, Value>) {
    for (key, next) in source {
        match (acc.get_mut(key), next) {
            (Some(Value::Object(prev)), Value::Object(next)) => merge_into(prev, next),
            _ => {
                acc.insert(key.clone(), next.clone());
            }
        }
    }
}

pub fn get<'a>(value: &'a Value, path: &[&str]) -> Option<&'a Value> {
    path.iter().try_fold(value, |node, key| node.get(*key))
}

fn hue_of(value: Option<&Value>) -> Option<Value> {
    value.and_then(|v| v.get("_hue")).filter(|v| truthy(v)).cloned()
}

fn truthy(value: &Value) -> bool {
    match value {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::String(s) => !s.is_empty(),
        _ => true,
    }
}

fn or_hue(first: Option<Value>, second: Option<Value>) -> Value {
    first.or(second).unwrap_or(Value::Null)
}

fn with_avatar_and_badge(tokens: &Value, spec: Value, hue: Value) -> Value {
    let mut out = match spec {
        Value::Object(map) => map,
        _ => Map::new(),
    };
    out.insert("_hue".into(), hue.clone());

    let mut avatar = Map::new();
    for avatar_hue in sanity_color::HUES {
        let name = avatar_hue.name();
        let base = json!({"_hue": name});
        let spec_avatar = out.get("avatar");
        avatar.insert(
            name.into(),
            merge(&[Some(&base), spec_avatar.and_then(|a| a.get("*")), spec_avatar.and_then(|a| a.get(name))]),
        );
    }

    let mut badge = Map::new();
    for tone in STATE_TONES {
        let tone = tone.name();
        let mut entry = Map::new();
        entry.insert("_hue".into(), or_hue(hue_of(get(tokens, &["base", tone])), Some(hue.clone()).filter(truthy)));
        let spec_badge = out.get("badge");
        for source in [spec_badge.and_then(|b| b.get("*")), spec_badge.and_then(|b| b.get(tone))].into_iter().flatten()
        {
            if let Value::Object(source) = source {
                for (key, value) in source {
                    entry.insert(key.clone(), value.clone());
                }
            }
        }
        badge.insert(tone.into(), Value::Object(entry));
    }

    out.insert("avatar".into(), Value::Object(avatar));
    out.insert("badge".into(), Value::Object(badge));
    Value::Object(out)
}

/// `resolveColorTokens(inputTokens)`.
pub fn resolve_color_tokens(input: Option<&Value>) -> Value {
    let defaults: Value = serde_json::from_str(DEFAULT_COLOR_TOKENS).expect("default color tokens are valid JSON");
    let tokens = merge(&[Some(&defaults), input]);

    let mut base = Map::new();
    for tone in CARD_TONES {
        let tone = tone.name();
        let spec = merge(&[get(&tokens, &["base", "*"]), get(&tokens, &["base", tone])]);
        let hue =
            hue_of(Some(&spec)).or_else(|| hue_of(get(&tokens, &["base", tone]))).unwrap_or_else(|| json!("gray"));
        base.insert(tone.into(), with_avatar_and_badge(&tokens, spec, hue));
    }

    let mut button = Map::new();
    for mode in BUTTON_MODES {
        let mode = mode.name();
        let mut tones = Map::new();
        for tone in STATE_TONES {
            let tone = tone.name();
            let mut states = Map::new();
            for state in STATES {
                let state = state.name();
                let spec = merge(&[
                    get(&tokens, &["button", mode, "*", "*"]),
                    get(&tokens, &["button", mode, tone, "*"]),
                    get(&tokens, &["button", mode, "*", state]),
                    get(&tokens, &["button", mode, tone, state]),
                ]);
                let hue = or_hue(hue_of(Some(&spec)), hue_of(get(&tokens, &["base", tone])));
                states.insert(state.into(), with_avatar_and_badge(&tokens, spec, hue));
            }
            tones.insert(tone.into(), Value::Object(states));
        }
        button.insert(mode.into(), Value::Object(tones));
    }

    let mut input_tokens = Map::new();
    for mode in INPUT_MODES {
        let mode = mode.name();
        let mut states = Map::new();
        for state in INPUT_STATES {
            let state = state.name();
            let mut spec = match merge(&[
                get(&tokens, &["input", "*", "*"]),
                get(&tokens, &["input", mode, "*"]),
                get(&tokens, &["input", "*", state]),
                get(&tokens, &["input", mode, state]),
            ]) {
                Value::Object(map) => map,
                _ => Map::new(),
            };
            let hue = or_hue(hue_of(Some(&Value::Object(spec.clone()))), hue_of(get(&tokens, &["input", mode])));
            spec.insert("_hue".into(), hue);
            states.insert(state.into(), Value::Object(spec));
        }
        input_tokens.insert(mode.into(), Value::Object(states));
    }

    let mut selectable = Map::new();
    for tone in STATE_TONES {
        let tone = tone.name();
        let mut states = Map::new();
        states.insert(
            "_hue".into(),
            or_hue(hue_of(get(&tokens, &["selectable", tone])), hue_of(get(&tokens, &["base", tone]))),
        );
        for state in STATES {
            let state = state.name();
            let spec = merge(&[
                get(&tokens, &["selectable", "*", "*"]),
                get(&tokens, &["selectable", tone, "*"]),
                get(&tokens, &["selectable", "*", state]),
                get(&tokens, &["selectable", tone, state]),
            ]);
            let hue = or_hue(hue_of(Some(&spec)), hue_of(get(&tokens, &["base", tone])));
            states.insert(state.into(), with_avatar_and_badge(&tokens, spec, hue));
        }
        selectable.insert(tone.into(), Value::Object(states));
    }

    // Not `json!`, which serializes each map into a copy while the original is still alive.
    let syntax = tokens.get("syntax").cloned().unwrap_or(Value::Null);
    compact(Value::Object(Map::from_iter([
        ("base".into(), Value::Object(base)),
        ("button".into(), Value::Object(button)),
        ("input".into(), Value::Object(input_tokens)),
        ("selectable".into(), Value::Object(selectable)),
        ("syntax".into(), syntax),
    ])))
}

/// Moves every map into one of its exact size, dropping the spare capacity left by growing it.
fn compact(value: Value) -> Value {
    match value {
        Value::Object(map) => Value::Object(map.into_iter().map(|(key, value)| (key, compact(value))).collect()),
        Value::Array(list) => Value::Array(list.into_iter().map(compact).collect()),
        other => other,
    }
}
