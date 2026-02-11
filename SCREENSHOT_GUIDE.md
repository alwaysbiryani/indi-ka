# Screenshot Guide for README

## 📸 Screenshots Needed

To complete the README, we need the following screenshots from the live site (https://indi-ka.vercel.app/):

### **1. MacBook View - Light Mode**
- **Device**: MacBook Pro (1440x900 or similar)
- **Browser**: Chrome or Safari
- **What to capture**: Full browser window showing the phone mockup centered on the page
- **Theme**: Light/Day mode (sun icon in header)
- **State**: Idle state with "SPEAK" button visible
- **Filename**: `screenshots/macbook-light-mode.png`

### **2. MacBook View - Dark Mode**
- **Device**: MacBook Pro (1440x900 or similar)
- **Browser**: Chrome or Safari
- **What to capture**: Full browser window showing the phone mockup centered on the page
- **Theme**: Dark/Night mode (moon icon in header)
- **State**: Idle state with "SPEAK" button visible
- **Filename**: `screenshots/macbook-dark-mode.png`

### **3. iPhone 12 Pro - Light Mode**
- **Device**: iPhone 12 Pro (actual device or simulator)
- **Browser**: Safari
- **What to capture**: Full phone screen showing the app interface
- **Theme**: Light/Day mode
- **State**: Idle state with "SPEAK" button visible
- **Filename**: `screenshots/iphone-light-mode.png`

### **4. iPhone 12 Pro - Dark Mode**
- **Device**: iPhone 12 Pro (actual device or simulator)
- **Browser**: Safari
- **What to capture**: Full phone screen showing the app interface
- **Theme**: Dark/Night mode
- **State**: Idle state with "SPEAK" button visible
- **Filename**: `screenshots/iphone-dark-mode.png`

### **5. Recording State (Optional)**
- **Device**: Any
- **What to capture**: The interface while recording (showing timer and waveform)
- **Filename**: `screenshots/recording-state.png`

### **6. History Sidebar (Optional)**
- **Device**: Any
- **What to capture**: The history sidebar open with some sample transcriptions
- **Filename**: `screenshots/history-sidebar.png`

---

## 📝 How to Take Screenshots

### **For MacBook Views:**

1. Open https://indi-ka.vercel.app/ in Chrome or Safari
2. Set browser window to ~1440x900 (or your preferred size)
3. For light mode: Click the sun/moon icon to ensure light theme
4. For dark mode: Click the sun/moon icon to switch to dark theme
5. Press `Cmd+Shift+4` then `Space` to capture the window
6. Or use `Cmd+Shift+3` for full screen
7. Save to `screenshots/` folder

### **For iPhone 12 Pro:**

**Option A: Using Real Device**
1. Open https://indi-ka.vercel.app/ in Safari on iPhone 12 Pro
2. Switch theme as needed
3. Press `Volume Up + Side Button` simultaneously to screenshot
4. AirDrop or email the screenshot to your Mac
5. Save to `screenshots/` folder

**Option B: Using Xcode Simulator**
1. Open Xcode
2. Open Simulator (Xcode → Open Developer Tool → Simulator)
3. Choose iPhone 12 Pro from device menu
4. Open Safari in simulator
5. Navigate to https://indi-ka.vercel.app/
6. Switch theme as needed
7. Press `Cmd+S` to save screenshot
8. Save to `screenshots/` folder

**Option C: Using Browser DevTools**
1. Open https://indi-ka.vercel.app/ in Chrome
2. Press `F12` to open DevTools
3. Click the device toolbar icon (or `Cmd+Shift+M`)
4. Select "iPhone 12 Pro" from device dropdown
5. Switch theme as needed
6. Click the three dots in DevTools → "Capture screenshot"
7. Save to `screenshots/` folder

---

## 🖼️ Adding Screenshots to README

Once you have the screenshots, update the README.md:

### **Replace the "Experience" Section:**

```markdown
## 📱 Experience

### 🖥️ Desktop Experience

<div align="center">

#### Light Mode (Day Theme)
<img src="screenshots/macbook-light-mode.png" alt="Indi-क on MacBook - Light Mode" width="800"/>

*A clean, bright interface perfect for daytime use*

#### Dark Mode (Night Theme)
<img src="screenshots/macbook-dark-mode.png" alt="Indi-क on MacBook - Dark Mode" width="800"/>

*A beautiful dark interface that's easy on the eyes*

</div>

---

### 📱 Mobile Experience

<div align="center">

<table>
<tr>
<td align="center">
<img src="screenshots/iphone-light-mode.png" alt="Indi-क on iPhone - Light Mode" width="300"/>
<br/>
<b>Light Mode</b>
</td>
<td align="center">
<img src="screenshots/iphone-dark-mode.png" alt="Indi-क on iPhone - Dark Mode" width="300"/>
<br/>
<b>Dark Mode</b>
</td>
</tr>
</table>

</div>
```

---

## 📁 File Structure

After adding screenshots, your structure should look like:

```
indi-ka/
├── screenshots/
│   ├── macbook-light-mode.png
│   ├── macbook-dark-mode.png
│   ├── iphone-light-mode.png
│   ├── iphone-dark-mode.png
│   ├── recording-state.png (optional)
│   └── history-sidebar.png (optional)
├── README.md
└── ...
```

---

## ✅ Checklist

Before committing screenshots:

- [ ] Create `screenshots/` folder in project root
- [ ] Take MacBook light mode screenshot
- [ ] Take MacBook dark mode screenshot
- [ ] Take iPhone light mode screenshot
- [ ] Take iPhone dark mode screenshot
- [ ] Optimize images (compress if > 500KB each)
- [ ] Update README.md with image references
- [ ] Commit with message: `docs: add screenshots to README`
- [ ] Push to GitHub

---

## 🎨 Screenshot Tips

- **Consistency**: Use the same browser and window size for all desktop screenshots
- **Clean State**: Make sure no error messages or loading states are visible
- **High Quality**: Use retina/2x resolution if possible
- **File Size**: Compress images to keep them under 500KB each (use ImageOptim or similar)
- **Naming**: Use descriptive, lowercase, hyphenated names

---

## 🚀 Quick Command to Add Screenshots

```bash
# Create screenshots folder
mkdir -p screenshots

# After adding your screenshot files:
git add screenshots/
git add README.md
git commit -m "docs: add screenshots to README"

# This will NOT trigger deployment (only code changes trigger deployment)
git push origin main
```

---

**Note**: Adding screenshots to the README will NOT trigger a new deployment. Only changes to source code files (`.ts`, `.tsx`, `.css`, etc.) trigger deployments.
