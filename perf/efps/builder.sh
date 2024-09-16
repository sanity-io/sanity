#!/bin/bash

set -e

# Configuration
SANITY_REPO="https://github.com/sanity-io/sanity.git"
TEMP_DIR="/Users/rune/tmp/sanity-benchmark"
TEST_PROJECT_DIR="/Users/rune/src/sanity/perf/efps"
OUTPUT_FILE="benchmark_results.txt"
COMMITS_FILE="commits.txt"

# Function to run benchmark for a specific commit
run_benchmark() {
    local commit=$1
    echo "Testing commit: $commit"

    # Clone or update the Sanity repo
    if [ ! -d "$TEMP_DIR" ]; then
        git clone "$SANITY_REPO" "$TEMP_DIR"
    fi

    # Navigate to the repo and checkout the specific commit
    cd "$TEMP_DIR"
    git fetch origin
    git checkout "$commit"

    # Build Sanity
    pnpm install
    pnpm build

    # Pack Sanity
    cd packages/sanity
    PACK_FILE=$(pnpm pack | tail -n 1)

    # Install the packed version in the test project
    cd "$TEST_PROJECT_DIR"
    pnpm add "$TEMP_DIR/packages/sanity/$PACK_FILE"

    # Run the test and capture output
    echo "Running test for commit $commit" >> "$OUTPUT_FILE"
    pnpm t >> "$OUTPUT_FILE"
    echo "-----------------------------------------" >> "$OUTPUT_FILE"

    # Clean up
    rm "$TEMP_DIR/packages/sanity/$PACK_FILE"
}

# Main execution
echo "Starting Sanity benchmark across commits" > "$OUTPUT_FILE"

# Check if commits file exists
if [ ! -f "$COMMITS_FILE" ]; then
    echo "Error: $COMMITS_FILE not found. Please create this file with one commit hash per line."
    exit 1
fi

# Read commits from file and run benchmark for each
while IFS= read -r commit || [[ -n "$commit" ]]; do
    # Trim whitespace
    commit=$(echo "$commit" | tr -d '[:space:]')
    # Skip empty lines
    if [ -n "$commit" ]; then
        run_benchmark "$commit"
    fi
done < "$COMMITS_FILE"

echo "Benchmarking complete. Results saved in $OUTPUT_FILE"
