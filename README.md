# DevNotes

A personal knowledge management system for developers. FastAPI + async SQLAlchemy backend, React + TypeScript (Vite) frontend.

## CI/CD & Kubernetes

### How the CI pipeline works

`.github/workflows/ci.yml` triggers on every push to `main`. The `build-and-push` job:

1. Checks out the repo
2. Logs in to DockerHub
3. Builds the backend image (`./backend`) and pushes it as `al3ks9/devnotes-backend:latest` and `al3ks9/devnotes-backend:<commit-sha>`
4. Builds the frontend image (`./frontend`) and pushes it as `al3ks9/devnotes-frontend:latest` and `al3ks9/devnotes-frontend:<commit-sha>`

Both builds use GitHub Actions cache (`type=gha`) to speed up repeat builds.

### Required GitHub Secrets

Add these under **Settings -> Secrets and variables -> Actions -> New repository secret**:

| Secret | Purpose |
|---|---|
| `DOCKERHUB_USERNAME` | DockerHub account used to push images |
| `DOCKERHUB_TOKEN` | DockerHub access token (Account Settings -> Security -> New Access Token) |
| `POSTGRES_DB` | Database name |
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password |

### Running locally with k3d

A local Kubernetes cluster (via [k3d](https://k3d.io/)) mirrors the production layout. Manifests live in `k8s/`.

```bash
./k8s/setup-cluster.sh
```

This creates a `devnotes` k3d cluster, applies all manifests, and waits for the backend and frontend deployments to roll out. Add `127.0.0.1 devnotes.local` to `/etc/hosts`, then open http://devnotes.local.

To tear it down:

```bash
k3d cluster delete devnotes
```

### Updating the Postgres secret values

`k8s/secrets.yaml` ships with demo placeholder values. To set real ones:

```bash
echo -n 'your-real-password' | base64
```

Paste the resulting string into the relevant key in `k8s/secrets.yaml` (and update `DATABASE_URL` to match), then re-apply:

```bash
kubectl apply -f k8s/secrets.yaml
kubectl rollout restart statefulset/postgres deployment/backend -n devnotes
```

### Pulling the latest images after a CI run

k3d does not auto-pull new image tags for `:latest`. After a CI run finishes, force a re-pull and rollout:

```bash
kubectl rollout restart deployment/backend deployment/frontend -n devnotes
```
