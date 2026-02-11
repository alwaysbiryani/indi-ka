# Deployment Checklist - Indi-क Mobile-First UI

## Pre-Deployment Verification ✅

### Local Verification
- [ ] Run `npm run verify:ui` - Passes without legacy UI patterns
- [ ] Run `npm run build` - Builds successfully
- [ ] Run `npm run deploy:check` - All checks pass
- [ ] Test locally at `http://localhost:3000` - Mobile-first UI renders correctly
- [ ] Check browser console - Build info displays correctly
- [ ] Git status clean - `git status` shows no uncommitted changes

### Code Review
- [ ] All changes are on `main` branch
- [ ] No legacy UI code in `/src` directory
- [ ] Single `page.tsx` exists at `/src/app/page.tsx`
- [ ] No feature flags or conditional UI rendering
- [ ] Build metadata added to `layout.tsx`
- [ ] Console logging added to `page.tsx`

### Configuration Files
- [ ] `vercel.json` exists and locks to `main` branch
- [ ] `next.config.ts` has build ID generation
- [ ] `.github/workflows/build-verification.yml` exists
- [ ] `package.json` has verification scripts

---

## Deployment Process 🚀

### Step 1: Commit Changes
```bash
git add .
git commit -m "feat: production safety guards for mobile-first UI"
git push origin main
```

### Step 2: Monitor GitHub Actions
1. Visit: https://github.com/alwaysbiryani/indi-ka/actions
2. Wait for "Build Verification & Legacy UI Guard" workflow
3. Verify all checks pass (green checkmark)

### Step 3: Monitor Vercel Deployment
1. Visit: https://vercel.com/dashboard
2. Watch for auto-deployment from `main` branch
3. Wait for "Ready" status (typically 1-2 minutes)

### Step 4: Verify Production Deployment
1. Visit: https://indi-ka.vercel.app/
2. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)
3. Open DevTools Console (F12)
4. Verify console output shows:
   ```
   🇮🇳 Indi-क Mobile-First UI
   Build Commit: <7-char-hash>
   Build Time: <ISO-timestamp>
   UI Version: mobile-first-v2
   ```

---

## Post-Deployment Verification ✅

### Visual Verification
- [ ] Mobile-first UI loads (phone mockup visible)
- [ ] No legacy website-style UI elements
- [ ] Header shows: Logo, Theme toggle, Recent button
- [ ] Language selector displays correctly
- [ ] Recording interface works
- [ ] History sidebar opens correctly
- [ ] Theme switching works (dark ↔ light)

### Technical Verification
- [ ] Open DevTools → Console
- [ ] Verify build commit hash matches latest git commit
- [ ] Check DevTools → Network tab
  - [ ] No 404 errors
  - [ ] All assets load from `/_next/static/`
  - [ ] Response headers include `X-Build-Source: github-main-mobile-first`
- [ ] Inspect HTML `<head>` meta tags
  - [ ] `build-commit` meta tag present
  - [ ] `build-time` meta tag present
  - [ ] `ui-version: mobile-first-v2` present

### Functional Testing
- [ ] Click "SPEAK" button - Recording starts
- [ ] Speak in Hinglish - Transcription appears
- [ ] Click "Recent" - History sidebar opens
- [ ] Toggle theme - Smooth transition occurs
- [ ] Copy transcription - Clipboard works
- [ ] Test on mobile device (or DevTools mobile view)

### Performance Check
- [ ] Page loads in < 3 seconds
- [ ] No console errors
- [ ] Lighthouse score > 90 (optional)

---

## Rollback Procedure 🔄

### If Issues Detected

1. **Identify Last Known Good Commit**
   ```bash
   git log --oneline -10
   ```
   Look for commits before the problematic one.

2. **Revert to Safe Commit**
   ```bash
   git revert HEAD --no-edit
   git push origin main
   ```

3. **Verify Rollback**
   - Vercel auto-deploys the reverted state
   - Check production URL
   - Verify mobile-first UI still works

### Safe Rollback Targets
- `d098375` - chore: trigger deployment
- `091f183` - fix: make copy and delete buttons always visible
- `aed304f` - feat: optimize mobile transcription experience

**⚠️ NEVER ROLLBACK TO:**
- Any commit before December 2024
- Any commit mentioning "legacy" or "old UI"
- Any commit with multiple `page.tsx` files

---

## Emergency Contacts 🆘

- **Repository:** https://github.com/alwaysbiryani/indi-ka
- **Production:** https://indi-ka.vercel.app/
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Actions:** https://github.com/alwaysbiryani/indi-ka/actions

---

## Verification Commands

### Local
```bash
# Verify UI integrity
npm run verify:ui

# Build and verify
npm run verify:build

# Full deployment check
npm run deploy:check

# Check git status
git status

# View recent commits
git log --oneline -5
```

### Production
```bash
# Get current build ID
curl -I https://indi-ka.vercel.app/ | grep -i build

# Check response headers
curl -I https://indi-ka.vercel.app/
```

---

## Success Criteria ✅

Deployment is successful when:
1. ✅ GitHub Actions workflow passes
2. ✅ Vercel deployment shows "Ready" status
3. ✅ Production URL loads mobile-first UI only
4. ✅ Console shows correct build commit hash
5. ✅ No 404 errors in Network tab
6. ✅ All functional tests pass
7. ✅ No legacy UI elements visible

---

## Notes

- **Deployment Frequency:** Every push to `main` triggers auto-deployment
- **Preview Deployments:** Disabled for non-main branches (via vercel.json)
- **Cache Invalidation:** Automatic on every deployment
- **Build Time:** Typically 60-90 seconds
- **Propagation Time:** Immediate (Vercel Edge Network)

---

**Last Updated:** 2026-02-11  
**Checklist Version:** 1.0  
**UI Version:** mobile-first-v2
