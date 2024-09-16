#!/bin/bash

PACKAGE_NAME="sanity"
OUTPUT_FILE="sanity_test_results.log"

# Function to run tests with a specific version
run_tests_with_version() {
    local version=$1
    echo "Testing with $PACKAGE_NAME@$version"

    # Install the specific version
    pnpm add "$PACKAGE_NAME@$version" --save-exact

    # Run the tests
    pnpm t

    # Capture the exit status
    local exit_status=$?

    # Print the result
    if [ $exit_status -eq 0 ]; then
        echo "Tests passed with $PACKAGE_NAME@$version"
    else
        echo "Tests failed with $PACKAGE_NAME@$version"
    fi

    echo "----------------------------------------"
}

# Start of script execution
{
    echo "Starting Sanity version tests at $(date)"
    echo "----------------------------------------"

    # List of versions to test
    VERSIONS=(
        "3.37.2"
        "3.38.0"
        "3.39.0"
        "3.39.1"
        "3.40.0"
        "3.41.0"
        "3.41.1"
        "3.41.2"
        "3.42.0"
        "3.42.1"
        "3.43.0"
        "3.44.0"
        "3.45.0"
        "3.46.0"
        "3.46.1"
        "3.47.0"
        "3.47.1"
        "3.48.0"
        "3.48.1"
        "3.49.0"
    )

    # Loop through each version and run tests
    for version in "${VERSIONS[@]}"; do
        run_tests_with_version "$version"
    done

    # Restore to the latest version after all tests
    pnpm add "$PACKAGE_NAME@latest"

    echo "All tests completed at $(date)"

} 2>&1 | tee "$OUTPUT_FILE"

echo "Test results have been saved to $OUTPUT_FILE"
