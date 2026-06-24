#!/bin/bash
set -e

echo "Creating k3d cluster..."
k3d cluster create devnotes \
  --port "80:80@loadbalancer" \
  --port "443:443@loadbalancer" \
  --agents 1

echo "Waiting for cluster to be ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=60s

echo "Setting default namespace to devnotes for this context..."
kubectl config set-context --current --namespace=devnotes

echo "Waiting for Traefik CRDs to be installed..."
until kubectl get crd middlewares.traefik.io >/dev/null 2>&1; do sleep 2; done
kubectl wait --for=condition=Established crd/middlewares.traefik.io --timeout=60s

echo "Applying manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

echo "Waiting for deployments to be ready..."
kubectl rollout status deployment/backend --timeout=120s
kubectl rollout status deployment/frontend --timeout=120s

echo ""
echo "Done! Add this to /etc/hosts if not already there:"
echo "   127.0.0.1 devnotes.local"
echo ""
echo "Then open http://devnotes.local in your browser."
