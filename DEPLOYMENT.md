# Stock Screener Deployment Guide

This guide covers the complete deployment process for the Stock Screener application using GitHub Actions, Terraform, and AWS.

## 🏗️ **Architecture Overview**

- **Frontend**: React + Vite app hosted on AWS S3 + CloudFront
- **Infrastructure**: Managed with Terraform
- **CI/CD**: GitHub Actions for automated deployments
- **Environments**: Development and Production with separate configurations

## 📋 **Prerequisites**

### Required Tools
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [Terraform](https://www.terraform.io/downloads.html) >= 1.5.0
- [Node.js](https://nodejs.org/) >= 18
- GitHub repository with necessary secrets configured

### AWS Requirements
- AWS account with sufficient permissions
- IAM user/role with permissions for:
  - S3 (bucket creation, object management)
  - CloudFront (distribution management)
  - ACM (certificate management)
  - Route53 (DNS management, if using custom domain)

## 🔐 **Setup Instructions**

### 1. AWS Credentials Setup

Create an IAM user with programmatic access and attach the following managed policies:
- `AmazonS3FullAccess`
- `CloudFrontFullAccess`
- `AWSCertificateManagerFullAccess`
- `Route53FullAccess` (if using custom domain)

Or create a custom policy with minimal required permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "cloudfront:*",
        "acm:*",
        "route53:*",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2. Terraform State Bucket

Create an S3 bucket for Terraform state storage:

```bash
aws s3 mb s3://your-terraform-state-bucket-name
```

Enable versioning:
```bash
aws s3api put-bucket-versioning \
  --bucket your-terraform-state-bucket-name \
  --versioning-configuration Status=Enabled
```

### 3. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `TERRAFORM_STATE_BUCKET` | S3 bucket for Terraform state | `your-terraform-state-bucket-name` |

**To add secrets:**
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret listed above

### 4. Environment Configuration

Update the environment-specific files:

**For Development (`terraform/environments/dev.tfvars`):**
```hcl
aws_region              = "us-west-2"
project_name            = "stock-screener"
environment             = "dev"
domain_name             = ""  # Uses CloudFront default domain
cloudfront_price_class  = "PriceClass_100"
backend_api_url         = "https://your-dev-api.com"
```

**For Production (`terraform/environments/prod.tfvars`):**
```hcl
aws_region              = "us-west-2"
project_name            = "stock-screener"
environment             = "prod"
domain_name             = "your-domain.com"  # Your actual domain
cloudfront_price_class  = "PriceClass_All"
backend_api_url         = "https://your-api-domain.com"
```

## 🚀 **Deployment Methods**

### Method 1: Automated GitHub Actions (Recommended)

**Triggers:**
- **Development**: Automatically deploys on push to `main` branch
- **Production**: Requires manual approval after development deployment

**Process:**
1. Push changes to `main` branch
2. GitHub Actions will:
   - Build and test the frontend
   - Deploy to development automatically
   - Wait for manual approval for production
   - Deploy to production (if approved)

### Method 2: Manual Deployment

Use the provided deployment script:

```bash
# Deploy to development
./scripts/deploy.sh dev

# Deploy to production
./scripts/deploy.sh prod
```

### Method 3: Manual Terraform Commands

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=stock-screener/dev/terraform.tfstate" \
  -backend-config="region=us-west-2"

# Plan deployment
terraform plan -var-file="environments/dev.tfvars"

# Apply changes
terraform apply -var-file="environments/dev.tfvars"

# Build and upload frontend
cd ../ui
npm run build
aws s3 sync dist/ s3://$(terraform -chdir=../terraform output -raw website_bucket_name)/

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $(terraform -chdir=../terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

## 🔄 **Deployment Workflow**

### Automated Pipeline Steps

1. **Build & Test**
   - Install Node.js dependencies
   - Run linting and type checking
   - Build production bundle
   - Upload artifacts

2. **Infrastructure Deployment**
   - Initialize Terraform with remote state
   - Plan infrastructure changes
   - Apply changes (S3, CloudFront, ACM, Route53)

3. **Frontend Deployment**
   - Download build artifacts
   - Sync files to S3 with appropriate cache headers
   - Invalidate CloudFront cache
   - Comment deployment URL on commit

4. **Environment Promotion**
   - Development: Automatic deployment
   - Production: Manual approval required

## 🌐 **DNS & Domain Setup (Optional)**

### If Using Custom Domain

1. **Purchase domain** through Route53 or external registrar
2. **Create hosted zone** in Route53 (if not using Route53 registrar)
3. **Update nameservers** to point to Route53 (if using external registrar)
4. **Update terraform variables** with your domain name
5. **Deploy** - Terraform will automatically:
   - Request ACM certificate
   - Validate via DNS
   - Configure CloudFront with SSL
   - Create Route53 A record

### If Using CloudFront Default Domain

Leave `domain_name = ""` in your tfvars files. You'll get a CloudFront domain like:
`https://d1234567890123.cloudfront.net`

## 📊 **Monitoring & Maintenance**

### CloudFront Cache Management
- **Static assets** (JS, CSS, images): 1 year cache
- **HTML files**: No cache (immediate updates)
- **Invalidations**: Automatic on deployment

### Cost Optimization
- **Development**: Uses `PriceClass_100` (cheapest)
- **Production**: Uses `PriceClass_All` (global distribution)

### Security Features
- **HTTPS only**: All traffic redirected to HTTPS
- **Origin Access Control**: S3 bucket only accessible via CloudFront
- **Modern TLS**: Minimum TLS 1.2

## 🔧 **Troubleshooting**

### Common Issues

**1. Terraform State Lock**
```bash
# If deployment gets stuck
terraform force-unlock LOCK_ID
```

**2. CloudFront Cache Issues**
```bash
# Manual cache invalidation
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

**3. Certificate Validation Timeout**
- Check DNS records are correctly configured
- ACM certificate validation can take up to 30 minutes

**4. Build Failures**
```bash
# Clear npm cache and reinstall
cd ui
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📝 **Environment Variables**

### Frontend Environment Variables

Create `.env.production` in the `ui/` directory:

```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_APP_NAME=Stock Screener
VITE_ENVIRONMENT=production
```

### GitHub Actions Environment Variables

Configured in the workflow file:
- `VITE_API_BASE_URL`: Automatically set based on environment
- `VITE_ENVIRONMENT`: Set to 'production' or 'development'

## 🚨 **Rollback Procedures**

### Quick Rollback
```bash
# Revert to previous S3 version
aws s3api list-object-versions --bucket BUCKET_NAME
aws s3api restore-object --bucket BUCKET_NAME --key index.html --version-id VERSION_ID

# Invalidate cache
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"
```

### Full Infrastructure Rollback
```bash
# Revert Terraform to previous state
terraform plan -var-file="environments/prod.tfvars" -target=RESOURCE
terraform apply -var-file="environments/prod.tfvars" -target=RESOURCE
```

## 📞 **Support**

For deployment issues:
1. Check GitHub Actions logs
2. Verify AWS credentials and permissions
3. Confirm Terraform state bucket access
4. Check CloudFront and S3 configurations in AWS Console

---

**�� Happy Deploying!** 