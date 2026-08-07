# CodingCON backend

This directory contains the production TypeScript backend for CodingCON. It provides the Express API, Socket.IO gateway, RabbitMQ integration, MongoDB models, and the dedicated Docker-based judge worker.

For repository-wide installation, deployment, API, security, and maintenance documentation, see the root `README.md`.

## Commands

```bash
npm install
npm run dev        # API development server
npm run worker:dev # judge worker in development
npm test           # Jest suite
npm run build      # TypeScript production build
npm start          # compiled API server
npm run worker     # compiled judge worker
```

## Deployment responsibilities

- `backend_api` runs the Express API and Socket.IO gateway.
- `judge_worker` consumes RabbitMQ judge jobs and is the only service that receives Docker-socket access.
- MongoDB persists application data; RabbitMQ carries judge and socket events; Redis is included in the Compose stack for platform services.

The Docker image runs the compiled Node.js backend. The legacy Python tree under `app/` is not part of the current production startup path.

Set `JWT_SECRET` in the deployment environment before starting Docker Compose. Do not add secrets or production credentials to this repository.
