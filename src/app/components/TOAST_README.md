# 🎉 Toast Notification System

A beautiful, animated toast notification system built with React, TypeScript, Framer Motion, and Tailwind CSS. Fully integrated with your Sleads design system.

## ✨ Features

- 🎨 **Beautiful Design** - Matches your Sleads design system perfectly
- 🌗 **Dark Mode Support** - Automatic dark mode with your app theme
- 🎬 **Smooth Animations** - Powered by Framer Motion
- ⏱️ **Auto-dismiss** - Configurable duration with progress bar
- 🎯 **4 Toast Types** - Success, Error, Warning, Info
- 📱 **Responsive** - Works great on all screen sizes
- ♿ **Accessible** - Proper ARIA labels and keyboard support
- 🪝 **Easy Hook API** - Simple and intuitive to use

## 📦 Installation

The toast system is already integrated into your app! The `ToastProvider` is wrapped around your app in `layout.tsx`.

## 🚀 Quick Start

### Using the Hook (Recommended)

```tsx
"use client";

import { useToast } from "@/app/hooks/useToast";

export default function MyComponent() {
  const toast = useToast();

  const handleClick = () => {
    toast.success("Operation completed successfully!");
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## 📖 API Reference

### useToast Hook

The `useToast` hook provides the following methods:

#### `success(message: string, duration?: number)`
Shows a success toast with a green checkmark icon.

```tsx
toast.success("User created successfully!");
toast.success("Saved!", 3000); // Custom 3s duration
```

#### `error(message: string, duration?: number)`
Shows an error toast with a red X icon.

```tsx
toast.error("Failed to save changes");
toast.error("Network error", 7000); // Custom 7s duration
```

#### `warning(message: string, duration?: number)`
Shows a warning toast with an amber triangle icon.

```tsx
toast.warning("This action cannot be undone");
toast.warning("Please review your input", 4000);
```

#### `info(message: string, duration?: number)`
Shows an info toast with a blue info icon.

```tsx
toast.info("New feature available!");
toast.info("Updates are being downloaded", 6000);
```

#### `addToast(message: string, type?: ToastType, duration?: number)`
General method to create any type of toast.

```tsx
toast.addToast("Custom message", "success", 5000);
```

### Parameters

- **message** (required): The text to display in the toast
- **duration** (optional): Time in milliseconds before auto-dismiss. Default: 5000ms (5 seconds). Set to 0 or negative to disable auto-dismiss.

### Toast Types

- `success` - Green theme with checkmark icon
- `error` - Red theme with X icon
- `warning` - Amber theme with triangle icon
- `info` - Blue theme with info icon

## 💡 Usage Examples

### Basic Usage

```tsx
"use client";

import { useToast } from "@/app/hooks/useToast";

export default function LoginForm() {
  const toast = useToast();

  const handleLogin = async () => {
    try {
      await login();
      toast.success("Welcome back!");
    } catch (error) {
      toast.error("Invalid credentials");
    }
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

### Form Validation

```tsx
"use client";

import { useToast } from "@/app/hooks/useToast";

export default function ContactForm() {
  const toast = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.warning("Email is required");
      return;
    }
    
    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    
    toast.success("Form submitted successfully!");
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Multiple Toasts

```tsx
const handleBulkAction = () => {
  toast.info("Processing items...");
  
  setTimeout(() => {
    toast.success("10 items processed");
  }, 2000);
  
  setTimeout(() => {
    toast.warning("2 items skipped");
  }, 3000);
};
```

### Custom Duration

```tsx
// Quick notification (2 seconds)
toast.success("Copied!", 2000);

// Long notification (10 seconds)
toast.error("Critical error occurred", 10000);

// No auto-dismiss (stays until manually closed)
toast.info("Important announcement", 0);
```

### Async Operations

```tsx
const handleSave = async () => {
  try {
    await saveData();
    toast.success("Data saved successfully!");
  } catch (error) {
    toast.error(`Failed to save: ${error.message}`);
  }
};
```

## 🎨 Design System

The toast system uses your Sleads color palette:

- **Success**: Emerald green (`emerald-500`)
- **Error**: Red (`red-500`)
- **Warning**: Amber (`amber-500`)
- **Info**: Sleads blue (`sleads-blue`)

Each toast includes:
- Gradient glow effect
- Icon with colored background
- Progress bar showing time remaining
- Smooth animations (slide in/out, scale)
- Backdrop blur for modern glass effect
- Responsive sizing (320px min, 420px max width)

## 🔧 Advanced Configuration

### Position

Toasts appear in the **top-right corner** by default. To change the position, edit `ToastContainer.tsx`:

```tsx
// Current: top-right
<div className="fixed top-4 right-4 z-[9999]">

// Top-left
<div className="fixed top-4 left-4 z-[9999]">

// Bottom-right
<div className="fixed bottom-4 right-4 z-[9999]">

// Bottom-center
<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999]">
```

### Default Duration

To change the default duration, edit `ToastContext.tsx`:

```tsx
const addToast = useCallback(
  (message: string, type: ToastType = "info", duration: number = 7000) => {
    // Changed from 5000 to 7000
    // ...
  }
);
```

## 🏗️ Architecture

The toast system consists of 4 main files:

1. **`ToastContext.tsx`** - Context provider managing toast state
2. **`Toast.tsx`** - Individual toast component with animations
3. **`ToastContainer.tsx`** - Container rendering all active toasts
4. **`useToast.ts`** - Hook export for easy access

### File Structure

```
src/app/
├── contexts/
│   └── ToastContext.tsx      # State management
├── components/
│   ├── Toast.tsx              # Toast component
│   └── ToastContainer.tsx     # Container component
└── hooks/
    └── useToast.ts            # Hook export
```

## ♿ Accessibility

- Close buttons have `aria-label="Close notification"`
- Toast colors meet WCAG contrast requirements
- Keyboard accessible (Tab to close button, Enter/Space to close)
- Respects `prefers-reduced-motion` for animations

## 🎯 Best Practices

1. **Use appropriate types**: Match the toast type to the message (success for confirmations, error for failures, etc.)
2. **Keep messages concise**: Short, clear messages work best
3. **Don't overuse**: Too many toasts can be overwhelming
4. **Consider duration**: Quick actions = short duration, important messages = longer duration
5. **Provide actions when needed**: For critical errors, consider adding a retry button

## 🐛 Troubleshooting

### Toasts not appearing?

Make sure `ToastProvider` is wrapped around your app in `layout.tsx`:

```tsx
<ToastProvider>
  <YourApp />
  <ToastContainer />
</ToastProvider>
```

### Hook error?

Ensure you're using the hook inside a component wrapped by `ToastProvider`:

```tsx
Error: "useToast must be used within a ToastProvider"
```

### Animations not working?

Check that Framer Motion is installed:

```bash
npm install framer-motion
```

## 📄 License

Part of the Sleads project.

---

**Built with ❤️ for Sleads**

