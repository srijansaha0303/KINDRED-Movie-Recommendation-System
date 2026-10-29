import csv
import re

path = r"C:\Users\srija\.Neo4jDesktop2\Data\dbmss\dbms-a63d97d1-91c2-4dfd-9388-318cfa25097f\import\tag.csv"

timestamp_pattern = re.compile(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$')

good_rows = []
bad_count = 0

with open(path, "r", encoding="utf-8", errors="replace", newline="") as f:
    reader = csv.reader(f)
    header = next(reader)
    for row in reader:
        if len(row) != 4:
            bad_count += 1
            continue

        user_id, movie_id, tag, timestamp = row

        user_id = user_id.replace('"', "").strip()
        movie_id = movie_id.replace('"', "").strip()
        tag = tag.replace('"', "").strip()
        timestamp = timestamp.replace('"', "").strip()

        if not user_id.isdigit() or not movie_id.isdigit():
            bad_count += 1
            continue
        if not timestamp_pattern.match(timestamp):
            bad_count += 1
            continue

        good_rows.append((user_id, movie_id, tag, timestamp))

print(f"Parsed {len(good_rows)} good rows, skipped {bad_count} unparseable rows")

with open(path, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(["userId", "movieId", "tag", "timestamp"])
    writer.writerows(good_rows)

print("File rewritten successfully")