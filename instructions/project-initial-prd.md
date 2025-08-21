# Wedding Guest Planner - Project Documentation

## Overview

A comprehensive wedding guest management tool with drag-and-drop reordering, organization-based access, and real-time data persistence using Neon. Designed to support diverse weddings by allowing fully customizable partner roles and initials.

---

## Authentication & Organization System

- **Signup & Login**: You decide. The simple and easiest one.
- **Organizations**: Each wedding project belongs to an **organization**. The creator of an organization becomes the **admin**.
- **Admin Capabilities**:
  - Configure partner roles (Bride + Groom, Bride + Bride, Groom + Groom, or custom labels).
  - Define initials for each role (e.g., Y/M, A/B, etc.).
  - Invite partners and collaborators to the wedding project by invite code:
    – Admin can share invite code
    – User can signup and login and then use the code once logged in to be part of an existing org
- **Session Persistence**: Login state and organization membership persist across browser sessions.
- **Shared Access**: Multiple users can collaborate within the same organization. Active collaborators appear with avatars in the shared view.

---

## Main Dashboard

### Statistics Cards

Four compact stat cards displayed horizontally:

- **Total Guests**: Shows complete guest count.
- **Confirmed Guests**: Displays confirmed count with percentage.
- **Partner 1 Guests**: Count of guests linked to Partner 1 (customizable label & initial).
- **Partner 2 Guests**: Count of guests linked to Partner 2 (customizable label & initial).

\*(Example: “Convidados da Noiva (Y)” or “Guests of Partner A (A)”)

---

### Guest Table Features

#### Table Customization

- **Settings Menu**: Gear icon in table header opens column visibility controls.
- **Toggle Columns**: Checkboxes to show/hide Category, Age, Food Preference, and Confirmations.
- **Responsive Layout**: Table width adjusts based on visible columns.
- **Preference Persistence**: Column visibility settings saved to localStorage.

#### Guest Management

- **Drag & Drop Reordering**: Guests can be reordered by dragging the gray handle.
- **Inline Name Editing**: Click pencil icon to edit names directly in table.
- **Quick Add Form**: Input field at bottom of table for rapid guest addition.
- **Default Values**: New guests default to Partner 1’s category, Adult age, No food restrictions.

#### Guest Categories

- **Configurable Categories**: Two customizable categories (e.g., Bride/Groom, Bride/Bride, Groom/Groom).
- **Visual Indicators**: Single-letter buttons (custom initials like Y/M, A/B) for quick category switching.
- **Default Selection**: New guests default to Partner 1’s category.

#### Age Groups

- **Three Options**: Adult (person icon), 7 years (number 7), 11 years (number 11).
- **Icon-Based Selection**: Compact buttons with visual indicators.
- **Default**: Adult age group for new guests.

#### Food Preferences

- **Five Options**: No Restrictions (utensils), Vegetarian (leaf), Vegan (green leaf), Gluten Free (wheat), Dairy Free (cow).
- **Icon-Based Interface**: Visual buttons for quick selection.
- **Default**: No Restrictions for new guests.

#### Confirmation System

- **Three-Stage Process**: Save the Date → Invitation → Final Confirmation.
- **Progressive Tracking**: Button shows "Confirmations X/3" format.
- **Click to Advance**: Single click cycles through confirmation stages.
- **Visual States**: Gray (0), Blue (1-2), Green (3 confirmations).

#### Guest Actions

- **Won't Make It**: X-circle icon marks guest as declined (grays out row).
- **Move to End**: Arrow-down icon moves guest to bottom of list.
- **Delete**: Trash icon permanently removes guest.
- **Visual Feedback**: Declined guests shown with strikethrough text and gray background.

---

## User Experience Design

### Visual Hierarchy

- **Clean Layout**: White cards on light gray background.
- **Consistent Spacing**: 8px spacing system throughout.
- **Typography**: Clear font weights and sizes for readability.
- **Color System**: Indigo primary, gray neutrals, semantic colors for status.
- **Hover States**: All buttons have hover states with tooltip with text.

### Interaction Patterns

- **Hover States**: All interactive elements have hover feedback.
- **Loading States**: Form submissions show loading indicators.
- **Error Handling**: Clear error messages for failed operations.
- **Confirmation Feedback**: Visual feedback for all user actions.

### Responsive Behavior

- **Mobile Optimization**: Table scrolls horizontally on small screens.
- **Flexible Layout**: Stats cards wrap on narrow screens.
- **Touch-Friendly**: All buttons sized for mobile interaction.
- **Minimum Widths**: Table maintains readability across devices.

---

## Data Persistence

- **Real-Time Sync**: All changes immediately saved to Neon.
- **Offline Resilience**: Local state management prevents data loss.
- **Order Preservation**: Drag-and-drop changes persist across sessions.
- **Concurrent Access**: Multiple users can access simultaneously (avatars displayed for collaborators).

---

## System Behavior

### Guest List Management

- **Automatic Numbering**: Guests numbered sequentially in display order.
- **Bulk Operations**: Settings allow hiding/showing multiple columns.
- **Search-Free Design**: Small lists don’t require search functionality.
- **Quick Access**: Most common actions available without menus.

### State Management

- **Optimistic Updates**: UI updates immediately, syncs in background.
- **Error Recovery**: Failed operations show clear error messages.
- **Session Continuity**: All preferences and login state preserved.
- **Data Integrity**: Validation prevents invalid data entry.

### Performance Considerations

- **Smooth Animations**: Drag-and-drop with smooth visual feedback.
