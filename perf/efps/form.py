import re
import csv
import sys

def strip_ansi_escape_sequences(text):
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    return ansi_escape.sub('', text)

def parse_benchmark_results(log_content):
    results = []
    version_pattern = re.compile(r"Testing with sanity@([\d\.]+)")
    table_pattern = re.compile(r"│\s*([^│]+)\s*│\s*([^│]+)\s*│\s*([^│]+)\s*│\s*([^│]+)\s*│")

    current_version = None
    for line in log_content.split('\n'):
        # Strip ANSI escape sequences
        line = strip_ansi_escape_sequences(line)

        version_match = version_pattern.search(line)
        if version_match:
            current_version = version_match.group(1)

        table_match = table_pattern.search(line)
        if table_match and current_version:
            benchmark, p50, p75, p90 = [cell.strip() for cell in table_match.groups()]
            if benchmark != "benchmark" and not benchmark.startswith("synthetic"):
                # Clean up the benchmark name
                benchmark = re.sub(r'\([^)]*\)', '', benchmark).strip()
                results.append({
                    "version": current_version,
                    "benchmark": benchmark,
                    "eFPS p50": p50,
                    "eFPS p75": p75,
                    "eFPS p90": p90
                })

    return results

def write_csv(results, output_file):
    fieldnames = ["version", "benchmark", "eFPS p50", "eFPS p75", "eFPS p90"]
    with open(output_file, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for row in results:
            writer.writerow(row)

def main():
    log_content = sys.stdin.read()
    results = parse_benchmark_results(log_content)
    write_csv(results, 'benchmark_results.csv')
    print(f"CSV file 'benchmark_results.csv' has been created.")

if __name__ == "__main__":
    main()
