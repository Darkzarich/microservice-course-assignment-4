# Assignment #4 - Database Index

This is "Microservices and High-Load" course 4th homework assignment.

Microservices and High-Load course 4th homework assignment. The goal is to generate realistic random data, use PostgreSQL to store that data and test how creating an index affects search queries with `LIKE` operator.

_No files were provided by the course, everything is done as the assignment._

## Requirements

- Node.js v20.x
- pnpm v10.x
- [k6](https://grafana.com/docs/k6/latest/set-up/)
- Docker
- Docker Compose

## Structure

- `database-init.template.sql` - PostgreSQL image init script template that `data-generator.js` script will read and replace `$VALUES` placeholder with generated users data
- `database-init.sql` - Initially is not there and will be created by `data-generator.js` script
- `data-generator.js` - Node.js script that generates 1 000 000 random users and writes it to `database-init.sql` file replacing `$VALUES` placeholder
- `server` - Node.js Express application that has a single endpoint `/search` that accepts `firstName` and `lastName` query parameters and returns users that match those parameters. It connects to PostgreSQL database.
- `load-testing` - k6 load testing script and prepared data

## Steps

### 0. Install Node.js data generator script dependencies

```bash
pnpm install
```

### 1. Generate `database-init.sql` file with random users data.

To do that, run:

```bash
node data-generator.js
```

### 2. Running docker compose spec:

```bash
docker compose up -d

# check everything is running
docker compose ps
```

### 3.`EXPLAIN` query:

To check query performance related data enter the database container and run `EXPLAIN` with `SELECT` query

```bash
docker compose exec -it db psql -U postgres -d assignment-4
```

```sql
EXPLAIN (ANALYZE) SELECT * FROM users WHERE first_name LIKE '%Kate%' AND last_name LIKE '%Li%' ORDER BY id;
```

Result:

![psql-no-index](/screenshots/psql-no-index.jpg)

The result shows that:

- PostgreSQL returned 14 rows
- It took ~45-49ms to execute the query
- `Parallel Seq Scan` means that PostgreSQL is **scanning the entire table sequentially**. It's not using any indexes right now.

### 4. Creating and using an index that actually improves the query performance:

Since the backend application uses query with `LIKE` operator:

```sql
SELECT * FROM users WHERE first_name LIKE '%Kate%' AND last_name LIKE '%Li%' ORDER BY id;
```

We need an index that can work with composite data such as GIN (Generalized Inverted Index). Since we always use both `first_name` and `last_name` for search queries we will create composite index. Similarity of words can be checked using `pg_trgm` extension that provides `gin_trgm_ops` operator for GIN index:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX users_name_trgm_idx ON users USING gin (
  first_name gin_trgm_ops,
  last_name gin_trgm_ops
);
```

Result with the same query:

![psql-gin-index-worse](/screenshots/psql-gin-index-worse.jpg)

The result shows that:

- PostgreSQL still returned 14 rows
- It took ~165ms to execute the query (**which is worse than the previous result**)
- `Bitmap Index Scan` means that PostgreSQL filtered the rows using the newly created index

As to why the result is worse: too low selectivity for the current query. Since we form trigrams (`gin_trgm_ops`), the more trigrams can be formed the better filtering power.

According to the documentation, **no extractable trigrams for `LIKE` lead to much worse performance**. Just adding one letter changes the situation dramatically:

![psql-gin-index-better](/screenshots/psql-gin-index-better.jpg)

- PostgreSQL returned 8 rows (the query is now more precise)
- It took ~0.7ms to execute the query
- `Bitmap Index Scan`

### 5. Load testing the application

As the assignment requires, we need to load test the application before and after the index creation. For load testing I'm using [k6](https://k6.io/) tool.

```bash
k6 run load-testing/script.js
```

Below are the results of the load testing for 100 VUs (virtual users) running for 30 seconds with random but predictable and predefined data for the search query:

#### Before index creation

![k6-100vu-before-index](/screenshots/k6-100vu-before-index.jpg)

#### After index creation

![k6-100vu-after-index](/screenshots/k6-100vu-after-index.jpg)

Results show that creating an index improved the query performance insanely:

- RPS: `~20.81/s` ----> `~956.60/s`
- Latency: `p(90)=4.76s`, `p(95)=4.78s` ----> `p(90)=6.96ms`, `p(95)=9.76ms`

### 6. Detailed load testing results

This step I'm going to visualize the results of the load testing vs different VUs count (1, 10, 100, 1000) before and after the index creation.

Running k6 we can override the VUs count with `--vus` flag:

```bash
for i in {1,10,100,1000}; do k6 run --vus $i load-testing/script.js; done
```

Aggregated results in Google Sheets:

![performance-graph](/screenshots/performance-graph.jpg)

#### Key points:

Before index creation:

- Throughput plateaus before index is at ~20 RPS because the database is saturated
- Each query does a full table scan of 1M records. Database locks the table during scans. As we increase VUs count latency grows because of the locking - VUs queue up waiting for table access.

After index creation:

- Throughput scales with concurrency (up to a point)
- Each query does a bitmap index scan of 1M records. Each query finds results in milliseconds
