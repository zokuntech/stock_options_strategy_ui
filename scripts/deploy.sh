#!/bin/bash

# Deploy script for Stock Options Strategy UI
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Deploying Stock Options Strategy UI to $ENVIRONMENT environment..."

# Check if environment file exists
if [ ! -f "$PROJECT_ROOT/terraform/environments/$ENVIRONMENT.tfvars" ]; then
    echo "❌ Environment file not found: terraform/environments/$ENVIRONMENT.tfvars"
    exit 1
fi

# Check if required tools are installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Build the frontend
echo "📦 Building frontend..."
cd "$PROJECT_ROOT/ui"
npm ci
npm run build

# Deploy infrastructure
echo "🏗️ Deploying infrastructure..."
cd "$PROJECT_ROOT/terraform"

# Initialize Terraform
terraform init

# Plan the deployment
echo "📋 Planning deployment..."
terraform plan -var-file="environments/$ENVIRONMENT.tfvars"

# Ask for confirmation
read -p "Do you want to apply these changes? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Apply the changes
echo "🚀 Applying changes..."
terraform apply -var-file="environments/$ENVIRONMENT.tfvars" -auto-approve

# Get outputs
BUCKET_NAME=$(terraform output -raw website_bucket_name)
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)
WEBSITE_URL=$(terraform output -raw website_url)

# Upload files to S3
echo "📤 Uploading files to S3..."
aws s3 sync "$PROJECT_ROOT/ui/dist/" "s3://$BUCKET_NAME/" \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --exclude "*.json"

# Upload HTML files with shorter cache
aws s3 sync "$PROJECT_ROOT/ui/dist/" "s3://$BUCKET_NAME/" \
    --delete \
    --cache-control "public, max-age=0, must-revalidate" \
    --include "*.html" \
    --include "*.json"

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*"

echo "✅ Deployment complete!"
echo "🌐 Website URL: $WEBSITE_URL"
echo ""
echo "Note: CloudFront cache invalidation may take a few minutes to complete." 