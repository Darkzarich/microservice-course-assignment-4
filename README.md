# Assignment #4 - Database Index

This is "Microservices and High-Load" course 4th homework assignment.

Microservices and High-Load course 4th homework assignment. The goal is to generate realistic random data, use PostgreSQL to store that data and test how creating an index affects search queries with `LIKE` operator.

_No files were provided by the course, everything is done as the assignment._

## Requirements

- Node.js v20.x
- pnpm v10.x
- Docker
- Docker Compose

## Structure

- `database-init.template.sql` - PostgreSQL image init script template that `data-generator.js` script will read and replace `$VALUES` placeholder with generated users data
- `database-init.sql` - Initially is not there and will be created by `data-generator.js` script
- `data-generator.js` - Node.js script that generates 1 000 000 random users and writes it to `database-init.sql` file replacing `$VALUES` placeholder

## Steps

0. Install Node.js data generator script dependencies

```bash
pnpm install
```

1. First we need to generate `database-init.sql` file with random users data. To do that, run:

```bash
node data-generator.js
```

2.
