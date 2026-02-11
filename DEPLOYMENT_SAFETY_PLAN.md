# Production Deployment Safety Plan
## Indi-क Mobile-First UI - Permanent Lock

**Date:** 2026-02-11  
**Repository:** https://github.com/alwaysbiryani/indi-ka  
**Production URL:** https://indi-ka.vercel.app/

---

## Executive Summary

This document establishes the mobile-first UI as the **permanent and sole production experience** for Indi-क. All legacy UI code has been verified as non-existent. This plan implements safety guards to prevent any future UI regression.

---

## Current State Verification ✅

### Repository Audit (Completed)
- ✅ **No legacy UI code found** in `/src` directory
- ✅ Single page application: `/src/app/page.tsx` (mobile-first only)
- ✅ No feature flags or conditional UI rendering
- ✅ No alternate routes or legacy components
- ✅ Clean component tree (AudioRecorder, LanguageSelector, HistorySidebar, Waveform)
- ✅ No HTML files in `/public` (only SVG assets)
- ✅ No environment-based UI switching

### Branch Status
- **Production Branch:** `main` (synced with origin/main)
- **Current Commit:** `d098375` - "chore: trigger deployment"
- **Remote Branches:** 
  - `origin/main` (production)
  - `origin/vercel/install-vercel-web-analytics-f-qsa6jk` (Vercel auto-branch)
  - `origin/vercel/vercel-web-analytics-to-nextjs-xnwzt8` (Vercel auto-branch)
- **Local Branch:** `claude/mystifying-bohr` (development)

### Deployment Platform
- **Platform:** Vercel
- **Auto-Deploy:** Enabled on `main` branch
- **Preview Deploys:** Enabled for all branches (RISK)

---

## Implementation Plan

### Phase 1: Version Stamping & Build Verification

#### 1.1 Add Build Metadata
Add Git commit hash and build timestamp to the UI for verification.

**File:** `/src/app/layout.tsx`
```tsx
// Add build info to HTML meta tags
export const metadata: Metadata = {
  title: "Indi-क | The Home for Hinglish",
  description: "Seamless Hinglish voice-to-text powered by Sarvam AI",
  other: {
    'build-commit': process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    'build-time': new Date().toISOString(),
  },
};
```

**File:** `/src/app/page.tsx` (Footer)
```tsx
{/* Build Version Stamp - Hidden but inspectable */}
<div className="hidden" data-build-commit={process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA} data-build-time={new Date().toISOString()}>
  v{process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev'}
</div>
```

#### 1.2 Add Console Build Info
```tsx
// In page.tsx useEffect
useEffect(() => {
  console.log('🇮🇳 Indi-क Mobile-First UI');
  console.log('Build:', process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'development');
  console.log('Deployed:', process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || 'local');
}, []);
```

### Phase 2: Vercel Configuration Lock

#### 2.1 Create `vercel.json`
Lock production deployments to `main` branch only.

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "github": {
    "enabled": true,
    "autoAlias": false,
    "silent": false
  },
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### 2.2 Update `next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict mode
  reactStrictMode: true,
  
  // Generate build ID from git commit
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || `local-${Date.now()}`;
  },
  
  // Asset optimization
  compress: true,
  
  // Ensure clean builds
  cleanDistDir: true,
  
  // Environment variables for build verification
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
```

### Phase 3: GitHub Actions - Build Guard

#### 3.1 Create `.github/workflows/build-verification.yml`
```yaml
name: Build Verification & Legacy UI Guard

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  verify-build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Verify no legacy UI patterns
        run: |
          echo "🔍 Scanning for legacy UI patterns..."
          
          # Check for forbidden patterns
          if grep -r "desktop-view\|legacy\|old-ui\|website-mode" src/ --include="*.tsx" --include="*.ts"; then
            echo "❌ Legacy UI patterns detected!"
            exit 1
          fi
          
          # Verify single page.tsx exists
          if [ ! -f "src/app/page.tsx" ]; then
            echo "❌ Main page.tsx missing!"
            exit 1
          fi
          
          # Count page files (should be exactly 1)
          PAGE_COUNT=$(find src/app -name "page.tsx" -type f | wc -l)
          if [ "$PAGE_COUNT" -ne 1 ]; then
            echo "❌ Multiple page.tsx files detected! Expected 1, found $PAGE_COUNT"
            exit 1
          fi
          
          echo "✅ No legacy UI patterns found"
          
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production
          
      - name: Verify build output
        run: |
          echo "🔍 Verifying build output..."
          
          if [ ! -d ".next" ]; then
            echo "❌ Build output directory missing!"
            exit 1
          fi
          
          if [ ! -f ".next/BUILD_ID" ]; then
            echo "❌ BUILD_ID file missing!"
            exit 1
          fi
          
          BUILD_ID=$(cat .next/BUILD_ID)
          echo "✅ Build ID: $BUILD_ID"
          
      - name: Check bundle size
        run: |
          echo "📦 Checking bundle size..."
          du -sh .next/static/chunks/
          
      - name: Success notification
        run: |
          echo "✅ Build verification passed!"
          echo "✅ No legacy UI detected"
          echo "✅ Mobile-first UI is the only UI"
```

### Phase 4: Package.json Scripts Enhancement

#### 4.1 Add Verification Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "verify": "npm run verify:ui && npm run verify:build",
    "verify:ui": "echo '🔍 Verifying UI integrity...' && ! grep -r 'legacy\\|old-ui\\|desktop-view' src/ --include='*.tsx' --include='*.ts' || (echo '❌ Legacy patterns found!' && exit 1)",
    "verify:build": "npm run build && echo '✅ Build verification passed'",
    "deploy:check": "npm run verify && echo '✅ Ready for deployment'"
  }
}
```

### Phase 5: Git Hooks (Optional but Recommended)

#### 5.1 Create `.husky/pre-commit`
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Verify no legacy UI patterns
if grep -r "legacy\|old-ui\|desktop-view" src/ --include="*.tsx" --include="*.ts"; then
  echo "❌ Legacy UI patterns detected! Commit blocked."
  exit 1
fi

echo "✅ Pre-commit checks passed"
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All changes committed to `main` branch
- [ ] `npm run verify` passes locally
- [ ] Git status clean (no uncommitted changes)
- [ ] Build ID matches current commit SHA

### Deployment
- [ ] Push to `origin/main`
- [ ] Vercel auto-deploys from `main`
- [ ] GitHub Actions build verification passes
- [ ] Production URL updates within 2 minutes

### Post-Deployment Verification
- [ ] Visit https://indi-ka.vercel.app/
- [ ] Open browser DevTools console
- [ ] Verify build commit hash matches latest
- [ ] Inspect HTML meta tags for build info
- [ ] Test mobile-first UI renders correctly
- [ ] Check Network tab - no 404s for missing assets
- [ ] Verify no legacy UI elements visible

---

## Rollback Policy

### Rollback Procedure
1. **Identify last known good commit** on `main` branch
2. **Verify it's a mobile-first build** (check commit history)
3. **Revert to that commit:**
   ```bash
   git revert HEAD --no-edit
   git push origin main
   ```
4. **Vercel auto-deploys** the reverted state
5. **Never rollback to commits before mobile-first UI** (pre-December 2024)

### Rollback Targets (Safe Commits)
- `d098375` - Latest (chore: trigger deployment)
- `091f183` - Mobile history sidebar fix
- `aed304f` - Mobile transcription optimization
- All commits from 2024-12-01 onwards are mobile-first only

---

## Monitoring & Alerts

### Manual Verification (Daily)
- Visit production URL
- Check console for build info
- Verify mobile-first UI loads

### Automated Monitoring (Recommended)
- **Vercel Deployment Notifications:** Enable Slack/Discord webhooks
- **Uptime Monitoring:** UptimeRobot or similar
- **Error Tracking:** Sentry integration (optional)

---

## Emergency Contacts

- **Repository Owner:** @alwaysbiryani
- **Deployment Platform:** Vercel Dashboard
- **Production URL:** https://indi-ka.vercel.app/

---

## Appendix: Architecture Diagram

```
┌─────────────────────────────────────────────┐
│         GitHub Repository (main)            │
│     https://github.com/alwaysbiryani/indi-ka│
└────────────────┬────────────────────────────┘
                 │
                 │ Push to main
                 │
                 ▼
┌─────────────────────────────────────────────┐
│         GitHub Actions (Optional)           │
│   • Build Verification                      │
│   • Legacy UI Guard                         │
│   • Bundle Size Check                       │
└────────────────┬────────────────────────────┘
                 │
                 │ On success
                 │
                 ▼
┌─────────────────────────────────────────────┐
│         Vercel Auto-Deploy                  │
│   • Triggered by main branch push           │
│   • Builds Next.js app                      │
│   • Generates unique BUILD_ID               │
│   • Deploys to production                   │
└────────────────┬────────────────────────────┘
                 │
                 │ Deploy complete
                 │
                 ▼
┌─────────────────────────────────────────────┐
│         Production (indi-ka.vercel.app)     │
│   • Mobile-First UI Only                    │
│   • Build metadata in HTML                  │
│   • Console version info                    │
│   • Cache headers configured                │
└─────────────────────────────────────────────┘
```

---

## Conclusion

This plan ensures:
1. ✅ **Mobile-first UI is the only UI** (verified - no legacy code exists)
2. ✅ **GitHub main branch is the source of truth**
3. ✅ **Automated build verification prevents regressions**
4. ✅ **Version stamping enables deployment verification**
5. ✅ **Vercel configuration locks production to main branch**
6. ✅ **Rollback policy prevents legacy UI restoration**
7. ✅ **Clear deployment and verification procedures**

**Status:** Ready for implementation
**Risk Level:** Low (no legacy code to remove)
**Implementation Time:** 30 minutes
