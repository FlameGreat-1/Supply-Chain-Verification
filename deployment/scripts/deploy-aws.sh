#!/bin/bash
set -e

# Load environment variables
source .env

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null
then
    echo "AWS CLI could not be found. Please install it first."
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null
then
    echo "kubectl could not be found. Please install it first."
    exit 1
fi

# Set AWS region
aws configure set region $AWS_REGION

# Create EKS cluster if it doesn't exist
if ! aws eks describe-cluster --name $CLUSTER_NAME &> /dev/null; then
    echo "Creating EKS cluster..."
    aws eks create-cluster \
        --name $CLUSTER_NAME \
        --role-arn $EKS_ROLE_ARN \
        --resources-vpc-config subnetIds=$SUBNET_IDS,securityGroupIds=$SECURITY_GROUP_IDS
    
    # Wait for cluster to be active
    aws eks wait cluster-active --name $CLUSTER_NAME
fi

# Update kubeconfig
aws eks get-token --cluster-name $CLUSTER_NAME | kubectl apply -f -

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

echo "Deployment to AWS EKS completed successfully!"
