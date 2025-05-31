// Animated Components - Smooth animations and transitions

'use client';

import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { prefersReducedMotion } from '@/utils/accessibility';

// Animation variants
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export const slideInFromRight: Variants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 }
};

export const slideInFromLeft: Variants = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 }
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

// Animated wrapper components
interface AnimatedWrapperProps {
  children: React.ReactNode;
  variants?: Variants;
  className?: string;
  delay?: number;
  duration?: number;
}

export function AnimatedWrapper({ 
  children, 
  variants = fadeInUp, 
  className,
  delay = 0,
  duration = 0.3
}: AnimatedWrapperProps) {
  const shouldAnimate = !prefersReducedMotion();
  
  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
}

// Panel transition wrapper
interface PanelTransitionProps {
  children: React.ReactNode;
  panelKey: string;
  className?: string;
}

export function PanelTransition({ children, panelKey, className }: PanelTransitionProps) {
  const shouldAnimate = !prefersReducedMotion();
  
  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={panelKey}
        className={className}
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Staggered list animation
interface StaggeredListProps {
  children: React.ReactNode[];
  className?: string;
  itemClassName?: string;
}

export function StaggeredList({ children, className, itemClassName }: StaggeredListProps) {
  const shouldAnimate = !prefersReducedMotion();
  
  if (!shouldAnimate) {
    return (
      <div className={className}>
        {children.map((child, index) => (
          <div key={index} className={itemClassName}>
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          className={itemClassName}
          variants={staggerItem}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Modal/Dialog animation
interface AnimatedModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function AnimatedModal({ children, isOpen, onClose, className }: AnimatedModalProps) {
  const shouldAnimate = !prefersReducedMotion();
  
  if (!shouldAnimate) {
    return isOpen ? (
      <div className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className={className}>{children}</div>
      </div>
    ) : null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className={className}
            variants={scaleIn}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Notification animation
interface AnimatedNotificationProps {
  children: React.ReactNode;
  isVisible: boolean;
  className?: string;
}

export function AnimatedNotification({ children, isVisible, className }: AnimatedNotificationProps) {
  const shouldAnimate = !prefersReducedMotion();
  
  if (!shouldAnimate) {
    return isVisible ? <div className={className}>{children}</div> : null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={className}
          variants={slideInFromRight}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Loading spinner animation
export function AnimatedSpinner({ className }: { className?: string }) {
  const shouldAnimate = !prefersReducedMotion();
  
  if (!shouldAnimate) {
    return <div className={`w-4 h-4 border-2 border-current rounded-full ${className}`} />;
  }

  return (
    <motion.div
      className={`w-4 h-4 border-2 border-current border-t-transparent rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}

// Hover animation wrapper
interface HoverAnimationProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

export function HoverAnimation({ children, className, scale = 1.05 }: HoverAnimationProps) {
  const shouldAnimate = !prefersReducedMotion();
  
  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export default {
  AnimatedWrapper,
  PanelTransition,
  StaggeredList,
  AnimatedModal,
  AnimatedNotification,
  AnimatedSpinner,
  HoverAnimation,
  fadeInUp,
  fadeIn,
  slideInFromRight,
  slideInFromLeft,
  scaleIn,
  staggerContainer,
  staggerItem,
};
