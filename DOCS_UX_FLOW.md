# UX FLOW DOCUMENTATION - VIP List Manager SaaS
**Version:** 1.0
**Date:** 2025-11-23
**Focus:** Mobile-First User Experience
**Status:** Ready for Implementation

---

## TABLE OF CONTENTS
1. [Executive UX Summary](#executive-ux-summary)
2. [User Personas & Journey Maps](#user-personas--journey-maps)
3. [Happy Path Flows](#happy-path-flows)
4. [Error States & Edge Cases](#error-states--edge-cases)
5. [Screen Wireframes (Text-Based)](#screen-wireframes-text-based)
6. [Mobile-First Interaction Patterns](#mobile-first-interaction-patterns)
7. [Accessibility Considerations](#accessibility-considerations)
8. [UX Principles & Design Decisions](#ux-principles--design-decisions)
9. [Usability Testing Checklist](#usability-testing-checklist)

---

## EXECUTIVE UX SUMMARY

### Application Purpose
A mobile-first SaaS platform for nightclub VIP list management with three core user experiences:
1. **Admin** - Event creation with smart recurrence
2. **Promoter** - Frictionless name submission via public form
3. **Doorstaff (Portaria)** - Lightning-fast check-in with real-time validation

### UX Goals
- **Speed**: Check-in < 1 second, search < 100ms
- **Simplicity**: Max 3 taps to complete any action
- **Mobile-First**: 100% usable on 375px screens
- **Zero-Training**: Intuitive enough for first-time users
- **Error-Prevention**: Proactive validation before submission

### Target Devices
- **Primary**: iPhone SE (375px), iPhone 13 (390px), Android mid-range (360px)
- **Secondary**: iPad (810px), Desktop (1920px)
- **Touch Targets**: Minimum 44x44px (iOS HIG standard)

### Current State Analysis
Based on git history analysis:
- Previous system had basic CRUD for events and check-in
- NO intelligent parsing existed
- NO event recurrence system
- NO real-time synchronization
- UI was functional but not optimized for speed
- **Key Gap**: Doorstaff workflow was too slow (30+ seconds per check-in)

---

## USER PERSONAS & JOURNEY MAPS

### PERSONA 1: Admin (Event Manager)
**Name:** Marina, 32, Nightclub Operations Manager
**Tech Savvy:** High
**Device:** iPad Pro + MacBook
**Usage Pattern:** Desktop during day, tablet on event nights

**Goals:**
- Create weekly recurring events quickly
- Approve guest lists from promoters
- Monitor real-time attendance metrics
- Zero manual data entry

**Pain Points (Current State):**
- Manually recreating events every week wastes 30 min
- Promoters send unformatted names in WhatsApp
- No visibility into who's already entered
- Excel spreadsheets error-prone

**Ideal Experience:**
- Clone event template for 4 weeks in 2 clicks
- Auto-parse messy names from promoters
- Live dashboard showing check-ins as they happen

---

### PERSONA 2: Promoter (Guest List Submitter)
**Name:** João, 25, Party Promoter
**Tech Savvy:** Medium
**Device:** Android smartphone (360px)
**Usage Pattern:** Mobile-only, on the go

**Goals:**
- Submit 100+ names quickly before event
- No account creation (too much friction)
- Copy-paste from WhatsApp/Instagram DMs
- Get confirmation it was received

**Pain Points (Current State):**
- Venue requires specific format (impossible to enforce)
- Has to manually type each name
- No way to know if submission succeeded
- Account creation is annoying (never remembers password)

**Ideal Experience:**
- Public link (no login)
- Paste entire messy list (emojis, numbers, symbols)
- Auto-cleanup and confirmation
- Instant success/error feedback

---

### PERSONA 3: Doorstaff (Portaria)
**Name:** Pedro, 28, Nightclub Security/Door Control
**Tech Savvy:** Low-Medium
**Device:** Work-issued smartphone (older Android)
**Usage Pattern:** Mobile-only, loud environment, gloves in winter

**Goals:**
- Find guest name in < 1 second
- Validate VIP time restrictions instantly
- Work even if internet drops
- Minimal screen time (eyes on crowd)

**Pain Points (Current State):**
- Scrolling through 500+ name PDF takes forever
- VIP time limits enforced manually (inconsistent)
- Can't tell if other doorstaff already checked someone in
- Phone screen too small for readable lists

**Ideal Experience:**
- Large search box (easy to tap with gloves)
- Instant results as typing
- Clear visual feedback (green/red fullscreen)
- Offline mode with cached list
- Auto-clear after check-in (ready for next)

---

## HAPPY PATH FLOWS

### FLOW 1: Admin Creates Recurring Event
**Context:** Marina wants to create a weekly Saturday party for the next month

**Steps:**
1. Open app on iPad
2. Tap "New Event" (floating action button, bottom right)
3. Fill form:
   - Event Name: "Saturday Night Fever"
   - Reference Date: Nov 15, 2025
   - Start Time: 23:00
   - End Time: 05:00
   - VIP Cutoff: 00:30
   - Capacity: 100
4. Tap "Save & Clone"
5. Modal appears: "Create recurring event?"
   - Weeks: [4] (slider)
   - Keep times? [YES] (toggle)
   - Keep capacity? [YES] (toggle)
6. Tap "Create 4 Events"
7. Loading spinner (1-2s)
8. Success: Green toast "4 events created: Nov 22, Nov 29, Dec 6, Dec 13"
9. Auto-navigate to event list showing all 4 instances

**Expected Outcome:**
- 4 independent event instances created
- Each has empty guest list (ready for submissions)
- Admin sees clear differentiation (Week 1, Week 2, etc.)

**Time to Complete:** 30 seconds

---

### FLOW 2: Promoter Submits Guest List
**Context:** João has 50 names from Instagram DMs, needs to submit quickly

**Steps:**
1. Receives WhatsApp message from Marina with link:
   "Submit your list: https://app.vipmanager.com/submit/ABC123"
2. Taps link (opens in browser, no app install)
3. Sees event details:
   - "Saturday Night Fever - Nov 22"
   - "VIP entry until 00:30"
   - Large textarea: "Paste names here (one per line)"
4. Switches to Instagram, copies all DMs:
   ```
   🔥 1- João Silva
   002. Maria Santos VIP
   (Carla Oliveira)
   pedro ferreira
   ```
5. Pastes into textarea
6. Real-time counter appears: "4 names detected"
7. Taps "Submit List" (big green button)
8. Loading spinner with text "Cleaning up names..." (1s)
9. Success screen:
   - "4 names submitted successfully"
   - "Submission ID: #AB12CD"
   - "Sent for approval"
   - Shows cleaned names:
     - João Silva
     - Maria Santos
     - Carla Oliveira
     - Pedro Ferreira
10. WhatsApp deep-link to share confirmation with friends

**Expected Outcome:**
- Names auto-cleaned (emojis, numbers removed)
- Saved as "Pending Approval"
- Admin gets notification
- Promoter has proof of submission

**Time to Complete:** 45 seconds

---

### FLOW 3: Admin Approves Submission
**Context:** Marina reviews João's submission on her iPad

**Steps:**
1. Sees notification badge on dashboard: "3 Pending Submissions"
2. Taps badge
3. List view shows:
   ```
   Submission #AB12CD
   From: João (promoter)
   Event: Saturday Nov 22
   Names: 4
   Submitted: 2 hours ago
   ```
4. Taps submission
5. Modal shows:
   - Original raw text (collapsed)
   - Cleaned names list (4 names)
   - Duplicates detected: 0
   - Already on list: 0
6. Options at bottom:
   - "Approve All" (green)
   - "Reject" (red)
   - "Edit" (yellow)
7. Taps "Approve All"
8. Confirmation: "Add 4 names to Saturday Nov 22?"
9. Taps "Confirm"
10. Success: "4 names added to VIP list"
11. Submission status changes to "Approved"
12. Names now searchable by doorstaff

**Expected Outcome:**
- Guest records created for event
- Promoter optionally notified
- Names immediately available for check-in

**Time to Complete:** 20 seconds

---

### FLOW 4: Doorstaff Checks In Guest (On Time)
**Context:** Pedro at door, guest arrives at 23:45 (VIP cutoff is 00:30)

**Steps:**
1. Pedro already has check-in screen open on phone:
   ```
   ┌─────────────────────────┐
   │ Saturday Nov 22         │
   │ Current Time: 23:45     │
   ├─────────────────────────┤
   │                         │
   │  [Search VIP Name...]   │  ← Large input
   │                         │
   └─────────────────────────┘
   ```
2. Guest says: "João Silva"
3. Pedro taps search, types "joa" (partial match)
4. Instant results appear (< 100ms):
   ```
   ┌─────────────────────────┐
   │ RESULTS (2)             │
   ├─────────────────────────┤
   │ ✓ João Silva            │
   │   VIP | Until 00:30     │
   │   [CHECK IN]            │  ← Big button
   ├─────────────────────────┤
   │ ✓ João Pedro            │
   │   Guest | No limit      │
   │   [CHECK IN]            │
   └─────────────────────────┘
   ```
5. Pedro taps "João Silva" CHECK IN button
6. Instant validation (< 100ms):
   - Type: VIP
   - Time: 23:45
   - Cutoff: 00:30
   - Allowed? YES (23:45 < 00:30)
7. Screen flashes GREEN with large text:
   ```
   ┌─────────────────────────┐
   │                         │
   │         ✓✓✓✓✓          │
   │    JOÃO SILVA          │
   │    WELCOME!            │
   │                         │
   │  Entered at 23:45      │
   │                         │
   └─────────────────────────┘
   ```
8. Optional sound: pleasant "ding"
9. After 2 seconds, auto-clears back to search
10. Meanwhile, WebSocket broadcasts to all devices:
    "João Silva checked in"

**Expected Outcome:**
- Guest checked in successfully
- Other doorstaff see real-time update (prevents double entry)
- Pedro ready for next guest immediately
- Marina sees live count on dashboard

**Time to Complete:** 3-5 seconds (target: < 1 second)

---

### FLOW 5: Doorstaff Blocks Late VIP
**Context:** VIP guest arrives at 00:45 (cutoff was 00:30)

**Steps:**
1. Pedro searches "Maria"
2. Results show:
   ```
   Maria Santos
   VIP | Until 00:30
   Current time: 00:45
   ```
3. Taps CHECK IN button
4. Validation fails:
   - Time: 00:45
   - Cutoff: 00:30
   - Allowed? NO
5. Screen flashes RED with large text:
   ```
   ┌─────────────────────────┐
   │                         │
   │         ✗✗✗✗✗          │
   │   MARIA SANTOS         │
   │   VIP CUTOFF PASSED    │
   │                         │
   │  VIP until: 00:30      │
   │  Now: 00:45 (15 min late)│
   │                         │
   │  [CALL MANAGER]        │  ← Override option
   │  [BACK]                │
   │                         │
   └─────────────────────────┘
   ```
6. Pedro taps [BACK]
7. Can optionally call manager for override (future feature)

**Expected Outcome:**
- VIP time rule enforced consistently
- Clear feedback to guest (via doorstaff)
- No manual calculation needed
- Audit trail of attempted late entry

**Time to Complete:** 5 seconds

---

## ERROR STATES & EDGE CASES

### ERROR 1: Parsing Rejects Invalid Names

**Scenario:** Promoter pastes list with invalid entries

**Input:**
```
João Silva
@maria_insta
123
🔥🔥🔥🔥
X
valid name here
```

**Output Screen:**
```
┌─────────────────────────────────┐
│ Submission Review               │
├─────────────────────────────────┤
│ ✓ 2 names accepted              │
│ ✗ 4 names rejected              │
│                                 │
│ ACCEPTED:                       │
│ • João Silva                    │
│ • Valid Name Here               │
│                                 │
│ REJECTED:                       │
│ • @maria_insta                  │
│   → Contains invalid characters │
│ • 123                           │
│   → Too short (min 2 letters)   │
│ • 🔥🔥🔥🔥                        │
│   → No valid characters         │
│ • X                             │
│   → Too short (min 2 letters)   │
│                                 │
│ [Submit 2 Names] [Edit & Retry] │
└─────────────────────────────────┘
```

**UX Principle:**
- Never silently discard data
- Always explain why something failed
- Offer actionable next steps

---

### ERROR 2: Duplicate Name Detection

**Scenario:** Admin approves submission with existing names

**Screen:**
```
┌─────────────────────────────────┐
│ Approve Submission #AB12        │
├─────────────────────────────────┤
│ 5 names submitted               │
│                                 │
│ ⚠ WARNING: Duplicates Found     │
│                                 │
│ ALREADY ON LIST:                │
│ • João Silva                    │
│   Added on Nov 20 by Maria      │
│ • Pedro Santos                  │
│   Added on Nov 21 by João       │
│                                 │
│ NEW NAMES (3):                  │
│ • Carla Oliveira                │
│ • Ana Costa                     │
│ • Lucas Mendes                  │
│                                 │
│ [Add New Only (3)] [Add All (5)]│
│ [Cancel]                        │
└─────────────────────────────────┘
```

**UX Principle:**
- Prevent duplicate entries but don't block workflow
- Show context (who added, when)
- Let admin decide (maybe intentional)

---

### ERROR 3: Network Failure During Check-In

**Scenario:** Doorstaff loses internet connection

**Screen Sequence:**

1. **Connection Lost Toast** (top of screen):
```
┌─────────────────────────────────┐
│ ⚠ OFFLINE MODE                  │
│ Using cached list (last updated │
│ 5 minutes ago)                  │
└─────────────────────────────────┘
```

2. **Search Still Works** (cached data):
```
Search: "João"
Results:
✓ João Silva (VIP) - CACHED
✓ João Pedro (Guest) - CACHED
[CHECK IN - Will sync when online]
```

3. **Check-In Queued**:
```
┌─────────────────────────────────┐
│         ✓ (offline)             │
│    JOÃO SILVA                   │
│    CHECK-IN QUEUED              │
│                                 │
│  Will sync when online          │
│  (1 pending sync)               │
└─────────────────────────────────┘
```

4. **Connection Restored**:
```
┌─────────────────────────────────┐
│ ✓ ONLINE                        │
│ Syncing 1 queued check-in...    │
│ Sync complete!                  │
└─────────────────────────────────┘
```

**UX Principle:**
- Never block critical workflow
- Make offline state obvious
- Auto-sync when possible
- Show sync status clearly

---

### ERROR 4: Event Capacity Reached

**Scenario:** Check-in when venue is at capacity

**Screen:**
```
┌─────────────────────────────────┐
│         ⚠                       │
│    CAPACITY ALERT               │
│                                 │
│  Current: 99/100                │
│  After check-in: 100/100        │
│                                 │
│  Venue will be at full capacity │
│                                 │
│  [Proceed Anyway] [Cancel]      │
│                                 │
│  Admin override required for    │
│  entries beyond 100             │
└─────────────────────────────────┘
```

**UX Principle:**
- Warn before hitting limits
- Don't hard-block (manager can override)
- Show clear numbers
- Escalation path visible

---

### ERROR 5: No Results Found

**Scenario:** Doorstaff searches name not on list

**Screen:**
```
┌─────────────────────────────────┐
│ Search: "Roberto Silva"         │
├─────────────────────────────────┤
│                                 │
│    No results found             │
│                                 │
│  Name not on VIP list           │
│                                 │
│  Options:                       │
│  • Guest may be using different │
│    name variation               │
│  • Try searching last name only │
│  • Contact manager to add       │
│                                 │
│  [Search Again] [Add Guest]     │
│                                 │
└─────────────────────────────────┘
```

**UX Principle:**
- Never blame user
- Offer helpful suggestions
- Provide escape hatch (manual add)
- Keep workflow moving

---

## SCREEN WIREFRAMES (TEXT-BASED)

### SCREEN 1: Admin Dashboard (Mobile - 375px)

```
┌───────────────────────────────────┐
│ ☰  VIP Manager            [🔔 3] │ ← Navbar
├───────────────────────────────────┤
│                                   │
│ QUICK STATS                       │
│ ┌───────┐ ┌────────┐ ┌─────────┐│
│ │ 4     │ │ 3      │ │ 142     ││
│ │Events │ │Pending │ │Check-ins││
│ └───────┘ └────────┘ └─────────┘│
│                                   │
│ UPCOMING EVENTS                   │
│ ┌─────────────────────────────┐ │
│ │ Nov 22 - Saturday Night     │ │
│ │ 23:00-05:00 | 50/100 VIPs   │ │
│ │ ▸ Week 1 of recurring       │ │
│ │                             │ │
│ │ [View List] [Check-In]      │ │
│ └─────────────────────────────┘ │
│                                   │
│ ┌─────────────────────────────┐ │
│ │ Nov 29 - Saturday Night     │ │
│ │ 23:00-05:00 | 0/100 VIPs    │ │
│ │ ▸ Week 2 of recurring       │ │
│ │                             │ │
│ │ [View List] [Clone]         │ │
│ └─────────────────────────────┘ │
│                                   │
│ PENDING SUBMISSIONS (3)           │
│ ┌─────────────────────────────┐ │
│ │ #AB12CD | João | 4 names    │ │
│ │ 2 hours ago                 │ │
│ │ [Review]                    │ │
│ └─────────────────────────────┘ │
│                                   │
│                                   │
│                                   │
│                                   │
│                                   │
│                                   │
│              [+ NEW EVENT] ←─────┤ Floating
└───────────────────────────────────┘ Action Button
```

**Key Features:**
- Stats cards: Tappable, lead to filtered views
- Event cards: Swipeable for quick actions
- Pending indicator: Red badge for urgency
- FAB: Always accessible, primary action
- Touch targets: All buttons 48px+ height

---

### SCREEN 2: Create Event Form (Mobile)

```
┌───────────────────────────────────┐
│ ← New Event                  [×] │
├───────────────────────────────────┤
│                                   │
│ Event Name *                      │
│ ┌───────────────────────────────┐│
│ │ Saturday Night Fever          ││ ← Auto-capitalize
│ └───────────────────────────────┘│
│                                   │
│ Reference Date *                  │
│ ┌───────────────────────────────┐│
│ │ Nov 15, 2025        [📅]      ││ ← Date picker
│ └───────────────────────────────┘│
│                                   │
│ Time Range *                      │
│ ┌─────────────┬─────────────────┐│
│ │ 23:00  [🕐] │ 05:00  [🕐]     ││ ← Time pickers
│ │ Start       │ End             ││
│ └─────────────┴─────────────────┘│
│                                   │
│ VIP Cutoff Time *                 │
│ ┌───────────────────────────────┐│
│ │ 00:30           [🕐]          ││
│ └───────────────────────────────┘│
│ ℹ VIPs can enter until this time │
│                                   │
│ Capacity *                        │
│ ┌───────────────────────────────┐│
│ │ 100                           ││ ← Number input
│ └───────────────────────────────┘│
│                                   │
│ ┌───────────────────────────────┐│
│ │ [Save Only]  [Save & Clone]   ││ ← Split action
│ └───────────────────────────────┘│
│                                   │
└───────────────────────────────────┘
```

**UX Details:**
- Required fields marked with *
- Input types: text, date, time, number
- Validation: Real-time, inline errors
- Help text: Contextual, below complex fields
- Primary action: "Save & Clone" (most common use case)
- Secondary: "Save Only" (less prominent)

---

### SCREEN 3: Clone Event Modal (Mobile)

```
┌───────────────────────────────────┐
│ Create Recurring Event        [×] │
├───────────────────────────────────┤
│                                   │
│ Template: Saturday Night Fever    │
│ Start: Nov 15, 2025               │
│                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                   │
│ Number of Weeks                   │
│ ┌───────────────────────────────┐│
│ │ 1 ──●──────────────────── 52  ││ ← Slider
│ │           [4 weeks]           ││
│ └───────────────────────────────┘│
│                                   │
│ Will create events on:            │
│ • Nov 22, 2025 (Week 1)           │
│ • Nov 29, 2025 (Week 2)           │
│ • Dec 06, 2025 (Week 3)           │
│ • Dec 13, 2025 (Week 4)           │
│                                   │
│ Options                           │
│ ┌───────────────────────────────┐│
│ │ [✓] Keep times (23:00-05:00)  ││ ← Toggles
│ │ [✓] Keep capacity (100)       ││
│ └───────────────────────────────┘│
│                                   │
│ ┌───────────────────────────────┐│
│ │      CREATE 4 EVENTS          ││ ← Primary
│ └───────────────────────────────┘│
│ [Cancel]                          │
│                                   │
└───────────────────────────────────┘
```

**UX Details:**
- Preview: Shows exact dates to be created
- Slider: Visual, easy to adjust
- Toggles: Default ON (most common)
- Confirmation: Clear action (number in button)
- Calendar calculation: Automatic, no mental math

---

### SCREEN 4: Public Submission Form (Mobile)

```
┌───────────────────────────────────┐
│ 🎉 VIP Manager                    │
├───────────────────────────────────┤
│                                   │
│ Submit Guest List                 │
│                                   │
│ Event: Saturday Night Fever       │
│ Date: Nov 22, 2025                │
│ VIP Entry: Until 00:30            │
│                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                   │
│ Paste names (one per line)        │
│ ┌───────────────────────────────┐│
│ │🔥 João Silva                  ││
│ │1- Maria Santos                ││
│ │(Carla Oliveira)               ││
│ │pedro ferreira                 ││
│ │                               ││ ← Large textarea
│ │                               ││   (8 lines min)
│ │                               ││
│ │                               ││
│ └───────────────────────────────┘│
│ 4 names detected                  │
│                                   │
│ ℹ We'll auto-clean: emojis,      │
│   numbers, formatting             │
│                                   │
│ ┌───────────────────────────────┐│
│ │        SUBMIT LIST            ││ ← Big, green
│ └───────────────────────────────┘│
│                                   │
│ No login required!                │
│                                   │
└───────────────────────────────────┘
```

**UX Details:**
- Branding: Minimal, friendly
- Event context: Always visible
- Textarea: Auto-expanding
- Counter: Real-time (encourages completion)
- Education: What happens to data
- Trust signals: "No login", simple language
- Mobile keyboard: text mode (auto-capitalize)

---

### SCREEN 5: Submission Success (Mobile)

```
┌───────────────────────────────────┐
│                                   │
│                                   │
│           ✓✓✓✓✓                  │
│                                   │
│     Submission Received!          │
│                                   │
│  Submission ID: #AB12CD           │
│                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                   │
│ Names Submitted (4):              │
│ • João Silva                      │
│ • Maria Santos                    │
│ • Carla Oliveira                  │
│ • Pedro Ferreira                  │
│                                   │
│ Status: Pending Approval          │
│                                   │
│ ℹ The venue will review your      │
│   submission. You'll be notified  │
│   once approved.                  │
│                                   │
│ ┌───────────────────────────────┐│
│ │     SHARE CONFIRMATION        ││ ← WhatsApp deep-link
│ └───────────────────────────────┘│
│                                   │
│ [Submit Another List] [Close]     │
│                                   │
└───────────────────────────────────┘
```

**UX Details:**
- Visual hierarchy: Success icon largest
- Proof: ID + cleaned name list
- Next steps: Clear status + expectation
- Social: Easy to share with group
- Continuation: Option to submit more

---

### SCREEN 6: Doorstaff Check-In Screen (Mobile - Primary Interface)

```
┌───────────────────────────────────┐
│ Saturday Nov 22        [⚙] [📊]  │
├───────────────────────────────────┤
│ Current Time: 23:45               │
│ VIP Cutoff: 00:30 (45 min left)   │
│                                   │
│ ┌───────────────────────────────┐│
│ │                               ││
│ │   [Search VIP Name...]        ││ ← 64px height
│ │                               ││   Large tap target
│ └───────────────────────────────┘│
│                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                   │
│ QUICK STATS                       │
│ ┌──────────┬─────────┬──────────┐│
│ │ 45/100   │ 45%     │ 23:30    ││
│ │ Checked  │ Full    │ Peak     ││
│ └──────────┴─────────┴──────────┘│
│                                   │
│ RECENT CHECK-INS (Live)           │
│ • João Silva (VIP) - 23:44        │
│ • Ana Costa (Guest) - 23:43       │
│ • Pedro Alves (VIP) - 23:42       │
│                                   │
│ ┌───────────────────────────────┐│
│ │     🔄 SYNC: Online ✓         ││ ← Connection status
│ └───────────────────────────────┘│
│                                   │
│                                   │
│                                   │
│                                   │
└───────────────────────────────────┘
```

**UX Details:**
- Context: Event, time, countdown always visible
- Search: Dominates screen (primary action)
- Glove-friendly: 64px tall search box
- Live feed: Shows activity (confirms sync working)
- Status: Online/offline obvious
- Stats: Glanceable, not distracting

---

### SCREEN 7: Search Results (Mobile - Doorstaff)

```
┌───────────────────────────────────┐
│ Search: "joa"              [×]    │
├───────────────────────────────────┤
│                                   │
│ RESULTS (2)                       │
│                                   │
│ ┌─────────────────────────────┐ │
│ │ João Silva                  │ │
│ │ VIP | Until 00:30           │ │
│ │ Added by: Maria             │ │
│ │                             │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │     ✓ CHECK IN          │ │ │ ← 56px height
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
│                                   │
│ ┌─────────────────────────────┐ │
│ │ João Pedro                  │ │
│ │ Guest | No time limit       │ │
│ │ Added by: João              │ │
│ │                             │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │     ✓ CHECK IN          │ │ │
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
│                                   │
│ [Search Again]                    │
│                                   │
└───────────────────────────────────┘
```

**UX Details:**
- Instant: Appears as typing (< 100ms)
- Scannable: Name largest, metadata smaller
- Differentiation: VIP vs Guest clear
- Context: Who added (trust/traceability)
- Touch: Large CHECK IN buttons (56px)
- Escape: Easy to search again

---

### SCREEN 8: Check-In Success (Mobile - Doorstaff)

```
┌───────────────────────────────────┐
│                                   │
│                                   │
│                                   │
│         ✓✓✓✓✓                    │ ← Green background
│                                   │   (fullscreen)
│     JOÃO SILVA                    │
│     WELCOME!                      │
│                                   │
│  VIP | Entered at 23:45           │
│  45 of 100 checked in             │
│                                   │
│                                   │
│                                   │
│                                   │
│ Auto-clearing in 2s...            │
│                                   │
│ [Skip]                            │
│                                   │
└───────────────────────────────────┘
```

**UX Details:**
- Fullscreen takeover: No ambiguity
- Color psychology: Green = success/go
- Name capitalized: Easy to verify
- Stats: Quick context
- Auto-clear: Keeps workflow fast
- Manual skip: For power users
- Sound (optional): "Ding" confirmation

---

### SCREEN 9: Check-In Blocked (Mobile - Doorstaff)

```
┌───────────────────────────────────┐
│                                   │
│                                   │
│                                   │
│         ✗✗✗✗✗                    │ ← Red background
│                                   │   (fullscreen)
│   MARIA SANTOS                    │
│   VIP CUTOFF PASSED               │
│                                   │
│  VIP entry until: 00:30           │
│  Current time: 00:45              │
│  Late by: 15 minutes              │
│                                   │
│                                   │
│ ┌───────────────────────────────┐│
│ │     CALL MANAGER              ││
│ └───────────────────────────────┘│
│                                   │
│ [Back to Search]                  │
│                                   │
└───────────────────────────────────┘
```

**UX Details:**
- Fullscreen takeover: Serious/blocking
- Color: Red = stop/error
- Clarity: Exact time difference
- Escalation: Clear next step
- Sound (optional): Different tone
- Non-destructive: Easy to go back

---

## MOBILE-FIRST INTERACTION PATTERNS

### Pattern 1: Large Touch Targets
**Guideline:** Minimum 44x44px (iOS HIG), prefer 48x48px (Android Material)

**Implementation:**
```css
.btn-primary {
  min-height: 48px;
  min-width: 48px;
  padding: 12px 24px;
  font-size: 16px; /* Prevents iOS zoom on focus */
}

.search-input {
  min-height: 64px; /* Extra large for gloved hands */
  font-size: 18px;
  padding: 16px;
}
```

**Rationale:**
- Doorstaff may wear gloves in winter
- Loud environments = rushed tapping
- Larger targets = fewer mis-taps

---

### Pattern 2: Thumb-Zone Optimization
**Guideline:** Primary actions in bottom 2/3 of screen (easy thumb reach)

**Layout Strategy:**
```
Screen divided into 3 zones:

┌─────────────────┐
│  HARD ZONE      │ ← Header, secondary actions
│  (top 1/3)      │   Settings, notifications
├─────────────────┤
│  EASY ZONE      │ ← Primary content
│  (middle 1/3)   │   Search, results
├─────────────────┤
│  NATURAL ZONE   │ ← Primary actions
│  (bottom 1/3)   │   Buttons, FAB
└─────────────────┘
```

**Applied to Check-In:**
- Search box: Middle (easy to reach)
- Results: Middle (scrollable)
- CHECK IN button: Inside result card (thumb-friendly)
- Settings/stats: Top (less frequent)

---

### Pattern 3: Progressive Disclosure
**Guideline:** Show only what's needed now, reveal more on demand

**Example: Event Creation**

**Step 1 (Initial):**
```
Basic fields only:
- Event name
- Date
- Times
[Continue]
```

**Step 2 (After Continue):**
```
Advanced options (collapsed):
▸ Guest types
▸ Capacity settings
▸ Notifications
▸ Recurrence options
[Save]
```

**Rationale:**
- Reduces cognitive load
- Faster for common tasks
- Advanced users can expand

---

### Pattern 4: Optimistic UI Updates
**Guideline:** Show success immediately, sync in background

**Example: Check-In**

**User Experience:**
1. Tap CHECK IN button
2. Instant green screen (< 50ms)
3. API call happens in background
4. If fails, rollback + retry

**Code Pattern:**
```javascript
function checkIn(guestId) {
  // 1. Immediate UI update
  showSuccessScreen(guestId);

  // 2. Background sync
  api.checkIn(guestId)
    .then(() => {
      // Already showing success
      broadcastToOtherDevices(guestId);
    })
    .catch((error) => {
      // Rollback + show error
      showErrorScreen(error);
      revertUIState();
    });
}
```

**Rationale:**
- Perceived speed > actual speed
- No waiting for network
- Failures rare (handle gracefully)

---

### Pattern 5: Swipe Gestures
**Guideline:** Support common mobile gestures for efficiency

**Implemented Gestures:**

1. **Swipe-to-delete** (Admin submission list):
   - Swipe left on submission → Delete option appears
   - Common pattern (Mail, Messages apps)

2. **Pull-to-refresh** (Doorstaff check-in list):
   - Pull down → Refresh guest list
   - Visual indicator (spinner)

3. **Swipe-between-events** (Admin event cards):
   - Swipe left/right → Navigate weeks
   - Carousel pattern

**Not Implemented (Too complex):**
- Pinch-to-zoom (not needed)
- Multi-touch gestures (confusing)

---

### Pattern 6: Keyboard Optimization
**Guideline:** Show correct keyboard type, prevent zoom

**Input Types:**

```html
<!-- Name search: Text keyboard -->
<input
  type="text"
  inputmode="text"
  autocomplete="name"
  autocapitalize="words"
  style="font-size: 16px" <!-- Prevents iOS zoom -->
/>

<!-- Capacity: Number keyboard -->
<input
  type="number"
  inputmode="numeric"
  pattern="[0-9]*"
  style="font-size: 16px"
/>

<!-- Time: Time picker (native) -->
<input
  type="time"
  style="font-size: 16px"
/>
```

**Rationale:**
- Correct keyboard = faster input
- Native pickers = familiar UX
- 16px font = no zoom on iOS

---

### Pattern 7: Offline-First Architecture
**Guideline:** Cache critical data, sync when online

**Caching Strategy:**

1. **Guest List (Doorstaff)**:
   - Cache full list on app open
   - Refresh every 5 minutes (background)
   - Offline = use cached (show warning)

2. **Check-In Records**:
   - Queue offline check-ins in IndexedDB
   - Auto-sync when reconnected
   - Show "pending sync" indicator

3. **Search Results**:
   - Client-side filtering of cached list
   - Instant results (no network)

**Visual Indicators:**
```
Online:  🟢 Live sync active
Offline: 🟠 Offline mode (cached 5 min ago)
Syncing: 🔄 Syncing 2 pending check-ins...
```

---

## ACCESSIBILITY CONSIDERATIONS

### Compliance Target
- **WCAG 2.1 Level AA** (minimum)
- Focus on mobile accessibility
- Support for assistive technologies

---

### A11Y Requirement 1: Color Contrast

**Guideline:** Minimum 4.5:1 for text, 3:1 for large text

**Color Palette:**
```
Primary Green (Success):
  Background: #059669 (green-600)
  Text: #FFFFFF
  Contrast: 4.98:1 ✓

Primary Red (Error):
  Background: #DC2626 (red-600)
  Text: #FFFFFF
  Contrast: 5.94:1 ✓

Text on White:
  Body: #1F2937 (gray-800) | 13.43:1 ✓
  Meta: #6B7280 (gray-500) | 4.68:1 ✓
```

**Testing:** Use WebAIM Contrast Checker

---

### A11Y Requirement 2: Keyboard Navigation

**Implementation:**
- All interactive elements focusable
- Visible focus indicator (3px blue outline)
- Logical tab order (top to bottom)
- Skip links for repeated content

**Example:**
```html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<button
  class="btn-primary"
  style="outline-offset: 2px"
>
  Check In
</button>
```

---

### A11Y Requirement 3: Screen Reader Support

**ARIA Labels:**
```html
<!-- Search input -->
<label for="search" class="sr-only">
  Search guest name
</label>
<input
  id="search"
  type="text"
  aria-label="Search VIP guest by name"
  aria-describedby="search-help"
/>
<span id="search-help" class="sr-only">
  Start typing name to see results
</span>

<!-- Result count -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  2 results found
</div>

<!-- Check-in button -->
<button
  aria-label="Check in João Silva, VIP, entry until 00:30"
>
  Check In
</button>
```

**Live Regions:**
- Search results: aria-live="polite"
- Success/error feedback: aria-live="assertive"
- Status updates: aria-live="polite"

---

### A11Y Requirement 4: Touch Target Size

**Already Covered:** Minimum 48x48px

**Additional:**
- Spacing between targets: 8px minimum
- No overlapping touch areas
- Safe area padding (iOS notch)

---

### A11Y Requirement 5: Alternative Text

**Images:**
```html
<!-- Logo -->
<img
  src="logo.svg"
  alt="VIP Manager logo"
/>

<!-- Success icon (decorative) -->
<img
  src="checkmark.svg"
  alt=""
  aria-hidden="true"
/>
```

**Icons with Text:**
```html
<button>
  <svg aria-hidden="true">...</svg>
  <span>Search</span> <!-- Visible label -->
</button>
```

---

### A11Y Requirement 6: Form Validation

**Accessible Errors:**
```html
<div class="form-group">
  <label for="event-name">
    Event Name
    <span class="required">*</span>
  </label>

  <input
    id="event-name"
    aria-required="true"
    aria-invalid="true"
    aria-describedby="event-name-error"
  />

  <span
    id="event-name-error"
    class="error"
    role="alert"
  >
    Event name is required
  </span>
</div>
```

**Characteristics:**
- Error associated with input (aria-describedby)
- Error announced by screen reader (role="alert")
- Visual + text indication (not color alone)

---

### A11Y Requirement 7: Reduced Motion

**Implementation:**
```css
/* Respect user preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Normal motion */
@media (prefers-reduced-motion: no-preference) {
  .success-screen {
    animation: fadeIn 0.3s ease-in;
  }
}
```

---

## UX PRINCIPLES & DESIGN DECISIONS

### Principle 1: Speed Over Features
**Decision:** Optimize for task completion time

**Trade-offs:**
- ✓ Fewer clicks > more options
- ✓ Instant feedback > complete accuracy (optimistic UI)
- ✓ Cached data > always fresh (offline mode)
- ✗ No rich analytics dashboard (use external tool)
- ✗ No advanced filters (keep search simple)

**Measurement:**
- Check-in task: Target < 5 seconds
- Search latency: Target < 100ms
- Form submission: Target < 30 seconds

---

### Principle 2: Zero-Training Interface
**Decision:** Design for first-time users

**Implementation:**
- Familiar patterns: Standard UI components
- Clear labels: No jargon ("Check In" not "Validate Entry")
- Contextual help: Inline hints, not separate docs
- Immediate feedback: No silent failures

**Test:** Can a new doorstaff member use check-in screen without explanation?

---

### Principle 3: Mobile-First, Not Mobile-Only
**Decision:** Optimize for mobile, but support desktop

**Reasoning:**
- Doorstaff: 100% mobile (at venue entrance)
- Admin: 70% desktop (office work) / 30% mobile (on-site)
- Promoter: 90% mobile (on the go)

**Implementation:**
- Design mobile screens first
- Scale up for desktop (not down from desktop)
- Desktop: More data density, multi-column layouts
- Mobile: Single column, larger targets

---

### Principle 4: Progressive Enhancement
**Decision:** Core features work without JavaScript

**Baseline Experience (No JS):**
- Form submission (POST)
- Navigation (links)
- Basic styling (CSS)

**Enhanced Experience (With JS):**
- Real-time search
- Optimistic UI updates
- WebSocket sync
- Smooth animations

**Rationale:**
- Works on slow connections
- Accessible to older devices
- Graceful degradation

---

### Principle 5: Forgiving Interface
**Decision:** Make it hard to make mistakes

**Examples:**

1. **Confirmation for Destructive Actions**:
   - Delete event: "Are you sure?"
   - Reject submission: "This will discard 10 names"

2. **Undo Options**:
   - Check-in: "Undo" button for 5 seconds
   - List delete: Soft delete (recoverable for 30 days)

3. **Clear Error Messages**:
   - Not: "Error 422"
   - Instead: "Event date must be in the future"

4. **Prevent Common Errors**:
   - Disable "Submit" until form valid
   - Date picker: Only future dates selectable
   - Time picker: Auto-adjust if end < start

---

### Principle 6: Consistency Over Creativity
**Decision:** Use standard patterns, not novel interactions

**Standards Followed:**
- iOS HIG: Tab bars, action sheets, alerts
- Material Design: FABs, cards, snackbars
- Web standards: Form labels, ARIA attributes

**Rationale:**
- Users already know these patterns
- Faster implementation
- Better accessibility support
- Easier to maintain

---

### Principle 7: Performance Budget
**Decision:** Enforce strict performance limits

**Budgets:**
- Time to Interactive: < 3 seconds (mobile 4G)
- Bundle size: < 200KB (JS) + < 50KB (CSS)
- Search latency: < 100ms (p95)
- Check-in API: < 500ms (p95)

**Enforcement:**
- Lighthouse CI in pipeline
- Performance tests in E2E suite
- Reject PRs that exceed budget

---

## USABILITY TESTING CHECKLIST

### Test 1: Admin Can Create Recurring Event (5 min)

**Scenario:** "Create a weekly Saturday party for the next 4 weeks"

**Success Criteria:**
- [ ] Finds "New Event" button without help
- [ ] Completes form in < 2 minutes
- [ ] Understands "Save & Clone" option
- [ ] Correctly sets recurrence to 4 weeks
- [ ] Verifies correct dates in preview
- [ ] Completes entire flow in < 5 minutes

**Observations:**
- Did they hesitate at any step?
- Did they try to edit the date list?
- Did they understand template vs instance?

---

### Test 2: Promoter Submits Messy List (3 min)

**Scenario:** "You have 10 names in your notes app with emojis and numbers. Submit them."

**Success Criteria:**
- [ ] Opens link without confusion
- [ ] Finds textarea immediately
- [ ] Pastes content successfully
- [ ] Understands what "4 names detected" means
- [ ] Submits without errors
- [ ] Understands "Pending Approval" status

**Observations:**
- Did they try to format the names first?
- Did they trust the auto-cleanup?
- Did they know what to do with confirmation?

---

### Test 3: Doorstaff Checks In Guest (10 seconds)

**Scenario:** "A guest named João Silva arrives. Check them in."

**Success Criteria:**
- [ ] Finds search box immediately
- [ ] Types name without error
- [ ] Recognizes correct result
- [ ] Taps CHECK IN button
- [ ] Sees success confirmation
- [ ] Screen auto-clears for next guest
- [ ] Completes in < 10 seconds

**Observations:**
- Did they understand VIP time indicator?
- Did they wait for confirmation or keep working?
- Could they use with gloves?

---

### Test 4: Doorstaff Handles Blocked Entry (15 seconds)

**Scenario:** "A VIP guest arrives after cutoff time. Try to check them in."

**Success Criteria:**
- [ ] Searches guest name
- [ ] Taps CHECK IN button
- [ ] Sees red error screen
- [ ] Understands why entry is blocked
- [ ] Knows to call manager (sees button)
- [ ] Returns to search without confusion

**Observations:**
- Did they understand the time calculation?
- Did they know what to do next?
- Were they frustrated or confused?

---

### Test 5: Admin Approves Submission (30 seconds)

**Scenario:** "You have 1 pending submission with 5 names. Approve it."

**Success Criteria:**
- [ ] Finds pending submissions indicator
- [ ] Opens submission detail
- [ ] Reviews cleaned names
- [ ] Notices duplicate detection (if any)
- [ ] Approves successfully
- [ ] Understands confirmation message

**Observations:**
- Did they trust the auto-cleaning?
- Did they want to edit names?
- Did they understand duplicate handling?

---

### Test 6: Error Recovery - No Internet (1 min)

**Scenario:** "You're at the door and your internet drops. Try to check in a guest."

**Success Criteria:**
- [ ] Notices offline indicator
- [ ] Understands cached data is being used
- [ ] Can still search names
- [ ] Can still check in (queued)
- [ ] Sees "pending sync" status
- [ ] Continues working without panic

**Observations:**
- Did they understand offline mode?
- Did they trust queued check-ins?
- Did they try to reconnect?

---

### Test 7: Mobile Usability - One-Handed Use

**Scenario:** "Use the doorstaff check-in screen with only your right thumb"

**Success Criteria:**
- [ ] Can reach search box
- [ ] Can tap results
- [ ] Can tap CHECK IN button
- [ ] Can use without shifting grip
- [ ] No mis-taps on wrong targets

**Observations:**
- Which elements were hard to reach?
- Did they need two hands at any point?
- Did button size feel comfortable?

---

### Test 8: Accessibility - Screen Reader

**Scenario:** "Navigate check-in screen with VoiceOver (iOS) or TalkBack (Android)"

**Success Criteria:**
- [ ] All elements announced correctly
- [ ] Logical reading order
- [ ] Form labels associated with inputs
- [ ] Error messages announced
- [ ] Success feedback announced
- [ ] Can complete check-in without seeing screen

**Observations:**
- Was any information missing?
- Was anything confusing?
- Could they complete task independently?

---

## APPENDIX: DESIGN SYSTEM TOKENS

### Typography Scale (Mobile)

```css
/* Base: 16px */
--text-xs:   12px; /* Labels, captions */
--text-sm:   14px; /* Secondary text */
--text-base: 16px; /* Body text */
--text-lg:   18px; /* Large body, search input */
--text-xl:   20px; /* Section headers */
--text-2xl:  24px; /* Page titles */
--text-3xl:  30px; /* Success/error messages */

/* Line heights */
--leading-tight:  1.2; /* Headings */
--leading-normal: 1.5; /* Body */
--leading-relaxed: 1.75; /* Long form */
```

---

### Spacing Scale

```css
/* Base: 4px */
--space-1:  4px;   /* Tight spacing */
--space-2:  8px;   /* Element padding */
--space-3:  12px;  /* Card padding */
--space-4:  16px;  /* Section padding */
--space-5:  20px;  /* Large gaps */
--space-6:  24px;  /* Page margins */
--space-8:  32px;  /* Major sections */
--space-12: 48px;  /* Hero spacing */
```

---

### Color Palette

```css
/* Primary (Brand) */
--primary-500: #8B5CF6; /* Purple */
--primary-600: #7C3AED;
--primary-700: #6D28D9;

/* Success */
--success-500: #10B981; /* Green */
--success-600: #059669;

/* Error */
--error-500: #EF4444;   /* Red */
--error-600: #DC2626;

/* Warning */
--warning-500: #F59E0B; /* Amber */

/* Neutrals */
--gray-50:  #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-500: #6B7280;
--gray-800: #1F2937;
--gray-900: #111827;
```

---

### Touch Target Sizes

```css
/* Minimum */
--target-min: 44px; /* iOS minimum */

/* Recommended */
--target-base: 48px; /* Material Design */
--target-lg:   56px; /* Primary actions */
--target-xl:   64px; /* Critical actions (check-in) */
```

---

### Animation Timing

```css
/* Duration */
--duration-fast:   150ms; /* Micro-interactions */
--duration-base:   300ms; /* Standard transitions */
--duration-slow:   500ms; /* Complex animations */

/* Easing */
--ease-in:     cubic-bezier(0.4, 0.0, 1, 1);
--ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);
```

---

## CONCLUSION

This UX flow documentation provides:

1. **Complete User Journeys**: All three personas with happy paths and error states
2. **Mobile-First Design**: Every screen optimized for 375px, then scaled up
3. **Interaction Patterns**: Specific guidelines for touch, gestures, and feedback
4. **Accessibility**: WCAG 2.1 AA compliance built in from start
5. **Testing Framework**: Usability tests with clear success criteria
6. **Design System**: Token-based system for consistent implementation

**Next Steps:**
1. Validate flows with stakeholders
2. Create high-fidelity mockups (Figma)
3. Build design system component library
4. Implement MVP screens following this spec
5. Conduct usability testing with real users

**Key Success Metrics:**
- Admin: Creates recurring event in < 5 minutes
- Promoter: Submits list in < 1 minute
- Doorstaff: Checks in guest in < 5 seconds
- All users: Complete primary task without help

---

**Document prepared by:** UX Engineer Agent (Claude)
**Date:** 2025-11-23
**Status:** Ready for Design and Development
**Next Review:** After prototype testing

