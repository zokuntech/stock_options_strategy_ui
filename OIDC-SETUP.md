# GitHub OIDC Setup for AWS Deployment

This guide will help you set up GitHub OIDC (OpenID Connect) authentication with AWS, which is more secure than using long-lived access keys.

## 🚀 **Step-by-Step Setup**

### **Step 1: Initial AWS Setup (One-time)**

You'll need AWS access keys **only for the initial OIDC setup**. After this, GitHub will use OIDC tokens.

1. **Add temporary AWS secrets to GitHub**:
   - Go to your GitHub repository: `https://github.com/zokuntech/stock_options_strategy_ui`
   - Click **Settings** → **Secrets and variables** → **Actions**
   - Add these secrets:
     ```
     AWS_ACCESS_KEY_ID: [your AWS access key]
     AWS_SECRET_ACCESS_KEY: [your AWS secret key]
     ```

### **Step 2: Run Initial Deployment**

Commit and push the OIDC setup files:

```bash
git add .
git commit -m "feat: add GitHub OIDC setup for secure AWS authentication"
git push origin main
```

This will:
1. ✅ Build your frontend
2. ✅ Create GitHub OIDC provider in AWS
3. ✅ Create IAM role for GitHub Actions
4. ✅ Deploy your infrastructure using OIDC

### **Step 3: Create GitHub Environments**

After the first deployment, create GitHub environments:

1. Go to **Settings** → **Environments** in your GitHub repo
2. Create two environments:
   - **development** (auto-deploy on push to main)
   - **production** (requires manual approval)

### **Step 4: Remove AWS Secrets (Security)**

After the OIDC setup is complete:
1. Delete the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` secrets
2. Future deployments will use OIDC tokens automatically

## 🔐 **What Gets Created**

### **AWS Resources:**
- **OIDC Identity Provider**: Trusts GitHub's token service
- **IAM Role**: `stock-screener-github-actions-role`
- **IAM Policy**: Permissions for S3, CloudFront, ACM, Route53

### **GitHub Integration:**
- **Secure Authentication**: No long-lived keys stored
- **Scoped Access**: Only your repository can assume the role
- **Automatic Tokens**: GitHub provides temporary tokens per workflow run

## 🛡️ **Security Benefits**

1. ✅ **No Long-lived Keys**: Tokens expire automatically
2. ✅ **Repository Scoped**: Only your specific repo can access AWS
3. ✅ **Audit Trail**: All access is logged and traceable
4. ✅ **Principle of Least Privilege**: Minimal required permissions

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"Trust relationship invalid"**
   - Check that the repository name in the trust policy matches exactly
   - Verify the OIDC provider thumbprints are current

2. **"Access denied"**
   - Ensure the IAM policy has all required permissions
   - Check that the role is properly attached to the policy

3. **"Environment not found"**
   - Create the `development` and `production` environments in GitHub Settings

### **Manual Terraform Commands:**

If you need to run Terraform manually:

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan -var-file=environments/dev.tfvars

# Apply the changes
terraform apply -var-file=environments/dev.tfvars
```

## 📋 **Next Steps**

1. ✅ Push the OIDC setup code
2. ✅ Monitor GitHub Actions for successful deployment
3. ✅ Create GitHub environments
4. ✅ Remove AWS secrets from GitHub
5. ✅ Test a new deployment to verify OIDC works

## 🌐 **Environment Variables**

You can add these to GitHub repository variables:
- `VITE_API_BASE_URL`: Your backend API URL
- `VITE_APP_NAME`: Your application name

Your stock screener UI will be deployed with enterprise-grade security! 🚀 