# Design & UI Rules

This document serves as a reference for permanent design rules and UX requirements that must be maintained across all future updates.

## 📱 Mobile Layout Rules

### 1. Transcription Canvas Actions
- **Delete/Trash Button Visibility**:
  - **Mobile**: The delete (trash can) icon must be **ALWAYS VISIBLE** (opacity 100%) on mobile screens. It should *not* require a tap or hover to appear, as mobile devices lack a hover state.
  - **Desktop**: The delete icon can remain hidden by default and appear on hover (`group-hover`).
  - **Code Reference**: Ensure conditional logic like `opacity-100 md:opacity-0 md:group-hover:opacity-100` is preserved.
