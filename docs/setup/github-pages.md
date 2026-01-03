# GitHub Pages Setup Guide

## Overview

This guide explains how to enable GitHub Pages for Storybook deployment.

## Prerequisites

- Repository admin access
- Storybook configured (`npm run build-storybook` works)
- Workflow file `.github/workflows/storybook-deploy.yml` exists

## Setup Steps

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section (left sidebar)
4. Under **Build and deployment**:
   - Source: Select **GitHub Actions**
   - (Do NOT select "Deploy from a branch")

### 2. Verify Workflow Permissions

Settings > Actions > General > Workflow permissions:

- ✅ **Read and write permissions** (required for deployment)
- ✅ **Allow GitHub Actions to create and approve pull requests**

### 3. Trigger Deployment

**Option A: Push to master**

```bash
git push origin master
```

The workflow `.github/workflows/storybook-deploy.yml` will automatically run.

**Option B: Manual trigger**

1. Go to **Actions** tab
2. Select **Deploy Storybook to GitHub Pages**
3. Click **Run workflow**
4. Select branch: `master`
5. Click **Run workflow** button

### 4. Verify Deployment

1. Go to **Actions** tab
2. Find the workflow run
3. Wait for both jobs to complete:
   - ✅ build
   - ✅ deploy
4. Click on **deploy** job
5. Find **Deploy to GitHub Pages** step
6. Copy the URL: `https://<username>.github.io/<repo-name>/`

### 5. Access Storybook

Open browser and navigate to:

```
https://<your-github-username>.github.io/<repo-name>/
```

Example:

```
https://example-user.github.io/domestic-account-booking/
```

## Troubleshooting

### Issue: "pages build and deployment" failing

**Symptom:**

```
Error: No uploaded artifact was found!
```

**Solution:**

1. Check that `npm run build-storybook` succeeds locally
2. Verify `storybook-static/` directory is created
3. Check workflow logs for build errors

### Issue: 404 Not Found after deployment

**Symptom:**
Page loads but shows 404 error.

**Solution:**

1. Verify deployment URL matches GitHub Pages URL
2. Check that `storybook-static/index.html` exists
3. Wait 5-10 minutes for CDN propagation

### Issue: Permission denied

**Symptom:**

```
Error: Resource not accessible by integration
```

**Solution:**

1. Go to Settings > Actions > General
2. Under Workflow permissions:
   - Select **Read and write permissions**
3. Save and re-run workflow

### Issue: Build succeeds but deploy skips

**Symptom:**

```
deploy: skipped
```

**Solution:**

1. Verify `permissions` in workflow file:
   ```yaml
   permissions:
     contents: read
     pages: write
     id-token: write
   ```
2. Ensure no branch protection rules block deployments

## Configuration

### Custom Domain (Optional)

1. Add a file `storybook-static/CNAME` with your domain:

   ```
   storybook.example.com
   ```

2. Update `.github/workflows/storybook-deploy.yml`:

   ```yaml
   - name: Add CNAME
     run: echo "storybook.example.com" > storybook-static/CNAME
   ```

3. Configure DNS:
   - Type: CNAME
   - Name: storybook
   - Value: `<username>.github.io`

### Base Path (for subpath deployment)

If deploying to `https://user.github.io/repo-name/`:

**Update `.storybook/main.ts`:**

```typescript
const config: StorybookConfig = {
  viteFinal: async (config) => {
    config.base = process.env.STORYBOOK_BASE_PATH || "/";
    return config;
  },
};
```

**Update workflow:**

```yaml
- name: Build Storybook
  run: npm run build-storybook
  env:
    STORYBOOK_BASE_PATH: /${{ github.event.repository.name }}/
```

## Monitoring

### Deployment Status

Check deployment status:

1. Actions tab > Workflows > Deploy Storybook to GitHub Pages
2. Recent workflow runs show status

### Automatic Deployments

Deployments trigger automatically on:

- Push to `master` branch
- Manual workflow dispatch

## Disabling

To disable GitHub Pages:

1. Go to Settings > Pages
2. Under Build and deployment:
   - Source: Select **None**
3. Save

## References

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Storybook Deployment Guide](https://storybook.js.org/docs/sharing/publish-storybook)
- [GitHub Actions Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)
