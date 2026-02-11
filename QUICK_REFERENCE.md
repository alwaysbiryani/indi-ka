# Quick Reference - Indi-क Production Safety

## 🚀 Deploy to Production

```bash
# 1. Verify locally
npm run deploy:check

# 2. Commit and push
git add .
git commit -m "feat: your changes"
git push origin main

# 3. Monitor
# GitHub Actions: https://github.com/alwaysbiryani/indi-ka/actions
# Vercel: https://vercel.com/dashboard
# Production: https://indi-ka.vercel.app/
```

---

## ✅ Verify Production Deployment

```bash
# Open production URL
open https://indi-ka.vercel.app/

# Check console (F12)
# Should see:
# 🇮🇳 Indi-क Mobile-First UI
# Build Commit: abc1234
# Build Time: 2026-02-11T...
# UI Version: mobile-first-v2
```

---

## 🔄 Rollback

```bash
# Revert last commit
git revert HEAD --no-edit
git push origin main

# Vercel auto-deploys in ~2 minutes
```

---

## 🔍 Local Verification

```bash
# Check for legacy UI patterns
npm run verify:ui

# Build and verify
npm run verify:build

# Full pre-deployment check
npm run deploy:check
```

---

## 📊 Production Health Check

```bash
# Check response headers
curl -I https://indi-ka.vercel.app/

# Should include:
# X-Build-Source: github-main-mobile-first
# Cache-Control: public, max-age=0, must-revalidate
```

---

## 🛡️ Safety Guards Active

- ✅ GitHub Actions - Blocks legacy UI code
- ✅ Vercel Lock - Main branch only
- ✅ Build Verification - Automated checks
- ✅ Version Stamping - Traceable deployments
- ✅ Cache Control - No stale UI

---

## 📚 Documentation

- **DEPLOYMENT_CHECKLIST.md** - Step-by-step deployment guide
- **DEPLOYMENT_SAFETY_PLAN.md** - Comprehensive architecture
- **IMPLEMENTATION_SUMMARY.md** - What was implemented
- **ARCHITECTURE.md** - Visual diagrams and flows

---

## 🆘 Emergency Contacts

- **Repository:** https://github.com/alwaysbiryani/indi-ka
- **Production:** https://indi-ka.vercel.app/
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Actions:** https://github.com/alwaysbiryani/indi-ka/actions

---

## 🎯 Key Files

```
.github/workflows/build-verification.yml  # CI/CD guard
vercel.json                               # Deployment lock
next.config.ts                            # Build config
src/app/layout.tsx                        # Build metadata
src/app/page.tsx                          # Console logging
package.json                              # Verification scripts
```

---

## ⚡ Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Verify UI
npm run verify:ui

# Deploy check
npm run deploy:check

# Git status
git status

# Recent commits
git log --oneline -5

# Push to production
git push origin main
```

---

**Status:** 🔒 Production Locked to Mobile-First UI  
**Last Updated:** 2026-02-11
