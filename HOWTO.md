# Project HOWTO

Requires Docker. The `npm` shortcuts require Node.js 20, but install application dependencies only inside Docker.

## To run in container for evaluation

```bash
docker compose build
docker compose up -d
```

## To launch local development with hot reload

Run attached with live logs:

```bash
npm run dev
```

UI: <http://localhost:3001>  
API: <http://localhost:3000>

Press `Ctrl+C`, then run `npm run dev:down` to clean up before switching workflows.

Or run in the background:

```bash
npm run dev:up
npm run dev:logs
```

Stop and remove development containers with:

```bash
npm run dev:down
```

## To run tests

```bash
npm run test:docker
```

Stop with:

```bash
docker compose down
```

## To run a CI test & build

```bash
npm run ci
```
