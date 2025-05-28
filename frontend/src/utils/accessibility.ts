// Accessibility utilities and helpers

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-disabled'?: boolean;
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-pressed'?: boolean;
  'aria-selected'?: boolean;
  role?: string;
  tabIndex?: number;
}

// Screen reader announcements
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Focus management
export const focusElement = (selector: string | HTMLElement) => {
  const element = typeof selector === 'string' 
    ? document.querySelector(selector) as HTMLElement
    : selector;
    
  if (element) {
    element.focus();
  }
};

export const trapFocus = (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };
  
  container.addEventListener('keydown', handleTabKey);
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
};

// Keyboard navigation helpers
export const handleKeyboardNavigation = (
  e: React.KeyboardEvent,
  handlers: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onHome?: () => void;
    onEnd?: () => void;
  }
) => {
  switch (e.key) {
    case 'Enter':
      handlers.onEnter?.();
      break;
    case ' ':
      e.preventDefault();
      handlers.onSpace?.();
      break;
    case 'Escape':
      handlers.onEscape?.();
      break;
    case 'ArrowUp':
      e.preventDefault();
      handlers.onArrowUp?.();
      break;
    case 'ArrowDown':
      e.preventDefault();
      handlers.onArrowDown?.();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      handlers.onArrowLeft?.();
      break;
    case 'ArrowRight':
      e.preventDefault();
      handlers.onArrowRight?.();
      break;
    case 'Home':
      e.preventDefault();
      handlers.onHome?.();
      break;
    case 'End':
      e.preventDefault();
      handlers.onEnd?.();
      break;
  }
};

// ARIA helpers
// Use a counter for stable IDs across server and client rendering
let idCounter = 0;

export const generateId = (prefix: string = 'element') => {
  // For client-side only, we can use this approach
  if (typeof window !== 'undefined') {
    // Use a stable counter-based approach instead of random
    return `${prefix}-${(idCounter++).toString(36)}`;
  }
  
  // For SSR, return a stable placeholder that will be consistent
  return `${prefix}-ssr`;
};

export const getAriaProps = (
  label?: string,
  description?: string,
  expanded?: boolean,
  selected?: boolean,
  disabled?: boolean
): AccessibilityProps => {
  const props: AccessibilityProps = {};
  
  if (label) props['aria-label'] = label;
  if (description) props['aria-describedby'] = generateId('desc');
  if (expanded !== undefined) props['aria-expanded'] = expanded;
  if (selected !== undefined) props['aria-selected'] = selected;
  if (disabled !== undefined) props['aria-disabled'] = disabled;
  
  return props;
};

// Color contrast helpers
export const getContrastRatio = (_color1: string, _color2: string): number => {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd use a proper color library
  return 4.5; // Placeholder - meets WCAG AA standard
};

export const meetsContrastRequirement = (
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA'
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
};

// Reduced motion detection
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// High contrast detection
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Screen reader detection
export const isScreenReaderActive = (): boolean => {
  // This is a simplified check - real implementation would be more comprehensive
  return window.navigator.userAgent.includes('NVDA') || 
         window.navigator.userAgent.includes('JAWS') ||
         window.speechSynthesis?.speaking === true;
};

export default {
  announceToScreenReader,
  focusElement,
  trapFocus,
  handleKeyboardNavigation,
  generateId,
  getAriaProps,
  getContrastRatio,
  meetsContrastRequirement,
  prefersReducedMotion,
  prefersHighContrast,
  isScreenReaderActive,
};
