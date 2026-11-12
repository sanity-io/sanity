//! Checks the diff-match-patch port against vectors from `@sanity/diff-match-patch`, written by
//! `node scripts/dmp-vectors.mjs`: the stringified patch for a pair of texts, the result of
//! applying it to a text that changed concurrently (or to an unrelated one) and where an offset
//! moves across a diff.

use sanity_mutator::dmp;
use serde_json::Value;

fn vectors() -> Value {
    serde_json::from_str(include_str!("dmp-vectors.json")).expect("valid vectors")
}

fn text(value: &Value) -> Vec<u16> {
    dmp::utf16(value.as_str().expect("string"))
}

fn check_apply(patch: &str, target: &Value, result: &Value, applied: &Value, label: &str) {
    let patches = dmp::parse(patch).unwrap_or_else(|e| panic!("{label}: parse failed: {e}"));
    let (out, flags) = dmp::apply(&patches, &text(target));
    assert_eq!(dmp::to_string(&out), result.as_str().unwrap(), "{label}: applied text");
    let expected: Vec<bool> = applied.as_array().unwrap().iter().map(|v| v.as_bool().unwrap()).collect();
    assert_eq!(flags, expected, "{label}: applied flags");
}

#[test]
fn patches_match_js() {
    let vectors = vectors();
    let cases = vectors["cases"].as_array().unwrap();
    assert!(cases.len() > 100);
    for (i, case) in cases.iter().enumerate() {
        let label = format!("case {i}");
        let base = case["base"].as_str().unwrap();
        let mine = case["mine"].as_str().unwrap();
        let expected = case["patch"].as_str().filter(|p| !p.is_empty());
        let made = dmp::make_patch_string(base, mine);
        assert_eq!(made.as_deref(), expected, "{label}: patch for {base:?} -> {mine:?}");

        if let Some(patch) = expected {
            assert_eq!(dmp::apply_patch_string(patch, base).unwrap(), mine, "{label}: round trip");
            check_apply(patch, &case["theirs"], &case["result"], &case["applied"], &label);
        }

        let loc = case["loc"].as_u64().unwrap() as usize;
        assert_eq!(
            dmp::map_offset(&text(&case["base"]), &text(&case["theirs"]), loc),
            case["mapped"].as_u64().unwrap() as usize,
            "{label}: mapped offset"
        );
    }
}

#[test]
fn unrelated_patches_match_js() {
    let vectors = vectors();
    for (i, case) in vectors["unrelated"].as_array().unwrap().iter().enumerate() {
        check_apply(
            case["patch"].as_str().unwrap(),
            &case["text"],
            &case["result"],
            &case["applied"],
            &format!("unrelated {i}"),
        );
    }
}

#[test]
fn concurrent_edits_to_one_string_both_survive() {
    let base = "The quick brown fox jumps over the lazy dog";
    let mine = "The quick brown fox leaps over the lazy dog";
    let theirs = "The very quick brown fox jumps over the lazy dog!";
    let patch = dmp::make_patch_string(base, mine).unwrap();
    assert_eq!(dmp::apply_patch_string(&patch, theirs).unwrap(), "The very quick brown fox leaps over the lazy dog!");
}

#[test]
fn reserved_escapes_and_multibyte_text_round_trip() {
    let base = "100%23 ok #tag ?q=a&b 😀 æøå";
    let mine = "100%23 okay #tags ?q=a&b=c 😀👍🏽 æøåÆ";
    let patch = dmp::make_patch_string(base, mine).unwrap();
    assert!(patch.starts_with("@@ -"));
    assert_eq!(dmp::apply_patch_string(&patch, base).unwrap(), mine);
}
