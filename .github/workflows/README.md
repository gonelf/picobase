# GitHub Actions Workflows

## Setup Instructions

### 1. Add NPM Token to GitHub Secrets

To enable automatic publishing to npm, you need to add your npm authentication token to GitHub Secrets:

1. **Generate an npm token:**
   ```bash
   npm login
   npm token create --type=automation
   ```
   Copy the generated token (starts with `npm_...`)

2. **Add to GitHub Secrets:**
   - Go to: `https://github.com/gonelf/picobase/settings/secrets/actions`
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

### 2. How Auto-Publishing Works

The `publish-client.yml` workflow automatically publishes `@picobase_app/client` to npm when:

✅ You push to `main` branch
✅ Files in `packages/client/` changed
✅ Version in `package.json` differs from published version on npm

**Process:**
1. Detects version change
2. Runs tests
3. Builds the package
4. Publishes to npm
5. Creates a git tag (e.g., `client-v0.2.0`)
6. Creates a GitHub Release

### 3. Development Workflow

**Local development:**
```bash
# Make changes to packages/client/

# Check if version needs updating
npm run client:check-version

# Bump version (choose one)
cd packages/client
npm version patch  # 0.1.0 → 0.1.1 (bug fixes)
npm version minor  # 0.1.0 → 0.2.0 (new features)
npm version major  # 0.1.0 → 1.0.0 (breaking changes)

# Commit and push
git add .
git commit -m "feat: add new feature"
git push origin main

# GitHub Actions will auto-publish! 🚀
```

**Manual publishing (if needed):**
```bash
npm run client:release:minor
```

### 4. Monitoring

- **Workflow runs:** https://github.com/gonelf/picobase/actions
- **npm package:** https://www.npmjs.com/package/@picobase_app/client
- **Releases:** https://github.com/gonelf/picobase/releases

### 5. Troubleshooting

**Workflow fails with "401 Unauthorized":**
- Check that `NPM_TOKEN` secret is set correctly
- Verify your npm token hasn't expired

**Workflow skips publishing:**
- Version in `package.json` matches published version
- Update version number and push again

**Tests fail:**
- Fix tests before version bump
- Or temporarily disable tests in workflow (not recommended)
