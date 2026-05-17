# Running the Database Locally

The local database is a PostgreSQL instance managed by Docker Compose.

## Setup

Make sure Docker is running, then start the database:

```bash
docker compose -f docker-compose.local-db.yml up -d
```

To stop it:

```bash
docker compose -f docker-compose.local-db.yml down
```

## Connection details

| Field    | Value          |
|----------|----------------|
| Host     | localhost      |
| Port     | 5432           |
| Database | codeflow-local |
| User     | localuser      |
| Password | localpass      |

Connection string:
```
postgresql://localuser:localpass@localhost:5432/codeflow-local
```

Set this as `DATABASE_URL` in your `.env` file.

## Note on `compose.yaml`

There is a separate `compose.yaml` in the project root. This is **not** used for local development — it defines the full production-style stack, including the Next.js app and a database container configured for deployment. Do not use it to spin up a local database.
