#!/bin/bash
set -e

# Load environment variables
source .env

# Check if Azure CLI is installed
if ! command -v az &> /dev/null
then
    echo "Azure CLI could not be found. Please install it first."
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null
then
    echo "kubectl could not be found. Please install it first."
    exit 1
fi

# Login to Azure
az login

# Set subscription
az account set --subscription $AZURE_SUBSCRIPTION_ID

# Create resource group if it doesn't exist
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create AKS cluster if it doesn't exist
if ! az aks show --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME &> /dev/null; then
    echo "Creating AKS cluster..."
    az aks create \
        --resource-group $RESOURCE_GROUP \
        --name $CLUSTER_NAME \
        --node-count 3 \
        --enable-addons monitoring \
        --generate-ssh-keys
fi

# Get AKS credentials
az aks get-credentials --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME

# Apply Kubernetes configurations
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl apply -f kubernetes/blockchain-deployment.yaml

# Create ConfigMap and Secrets
kubectl create configmap supply-chain-config \
    --from-literal=blockchain-provider=$BLOCKCHAIN_PROVIDER \
    --from-literal=kafka-brokers=$KAFKA_BROKERS \
    --from-literal=api-url=$API_URL

kubectl create secret generic supply-chain-secrets \
    --from-literal=database-url=$DATABASE_URL \
    --from-literal=redis-url=$REDIS_URL

# Wait for deployments to be ready
kubectl rollout status deployment/supply-chain-backend
kubectl rollout status deployment/supply-chain-frontend
kubectl rollout status deployment/supply-chain-blockchain

echo "Deployment to Azure AKS completed successfully!"
