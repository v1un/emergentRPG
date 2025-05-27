// Validation utilities using Zod

import { z } from 'zod';

// Basic validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters');

// Character validation
export const characterNameSchema = z.string()
  .min(2, 'Character name must be at least 2 characters')
  .max(50, 'Character name must be at most 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Character name can only contain letters, spaces, hyphens, and apostrophes');

export const characterStatsSchema = z.object({
  strength: z.number().min(1).max(20),
  dexterity: z.number().min(1).max(20),
  constitution: z.number().min(1).max(20),
  intelligence: z.number().min(1).max(20),
  wisdom: z.number().min(1).max(20),
  charisma: z.number().min(1).max(20),
});

export const characterSchema = z.object({
  name: characterNameSchema,
  level: z.number().min(1).max(100),
  health: z.number().min(0),
  max_health: z.number().min(1),
  mana: z.number().min(0),
  max_mana: z.number().min(1),
  experience: z.number().min(0),
  stats: characterStatsSchema,
  class_name: z.string().min(1, 'Class name is required'),
  background: z.string().optional(),
  equipped_items: z.record(z.string()),
  max_carry_weight: z.number().min(1),
  metadata: z.record(z.any()).optional(),
});

// Game action validation
export const actionSchema = z.string()
  .min(1, 'Action cannot be empty')
  .max(500, 'Action must be at most 500 characters')
  .refine(
    (action) => action.trim().length > 0,
    'Action cannot be only whitespace'
  );

// Session creation validation
export const createSessionSchema = z.object({
  lorebook_id: z.string().uuid('Invalid lorebook ID').optional(),
  character_name: characterNameSchema.optional(),
  scenario_template_id: z.string().uuid('Invalid scenario template ID').optional(),
});

// Scenario generation validation
export const generationRequestSchema = z.object({
  series_title: z.string().min(1, 'Series title is required').max(100, 'Series title must be at most 100 characters'),
  series_type: z.enum(['book', 'movie', 'tv_show', 'game', 'anime', 'other'], {
    errorMap: () => ({ message: 'Invalid series type' })
  }),
  genre: z.string().min(1, 'Genre is required').max(50, 'Genre must be at most 50 characters'),
  setting: z.string().min(1, 'Setting is required').max(200, 'Setting must be at most 200 characters'),
  power_system: z.string().min(1, 'Power system is required').max(200, 'Power system must be at most 200 characters'),
  tone: z.string().min(1, 'Tone is required').max(50, 'Tone must be at most 50 characters'),
  themes: z.array(z.string().min(1).max(50)).min(1, 'At least one theme is required').max(10, 'At most 10 themes allowed'),
});

// UI preferences validation
export const uiPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.string().min(2).max(5),
  timezone: z.string(),
  dateFormat: z.string(),
  timeFormat: z.enum(['12h', '24h']),
  enableNotifications: z.boolean(),
  enableKeyboardShortcuts: z.boolean(),
  accessibilityMode: z.boolean(),
  reducedMotion: z.boolean(),
  highContrast: z.boolean(),
});

// Search and filter validation
export const searchSchema = z.object({
  query: z.string().max(100, 'Search query must be at most 100 characters'),
  fields: z.array(z.string()).min(1, 'At least one search field is required'),
  caseSensitive: z.boolean().optional(),
  exactMatch: z.boolean().optional(),
});

export const filterSchema = z.object({
  field: z.string().min(1, 'Filter field is required'),
  operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'greaterThan', 'lessThan']),
  value: z.any(),
});

export const sortSchema = z.object({
  field: z.string().min(1, 'Sort field is required'),
  direction: z.enum(['asc', 'desc']),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1'),
  pageSize: z.number().min(1, 'Page size must be at least 1').max(100, 'Page size must be at most 100'),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().optional(),
  allowedTypes: z.array(z.string()).optional(),
});

// Custom validation functions
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function validateImageDimensions(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img.width <= maxWidth && img.height <= maxHeight);
    };
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validateJSON(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

export function validateHexColor(color: string): boolean {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

export function validateCreditCard(cardNumber: string): boolean {
  // Luhn algorithm
  const digits = cardNumber.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

export function validatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score += 1;
  else feedback.push('Password should be at least 8 characters long');
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Password should contain lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Password should contain uppercase letters');
  
  if (/\d/.test(password)) score += 1;
  else feedback.push('Password should contain numbers');
  
  if (/[^a-zA-Z\d]/.test(password)) score += 1;
  else feedback.push('Password should contain special characters');
  
  return { score, feedback };
}

// Form validation helper
export function createFormValidator<T extends z.ZodType>(schema: T) {
  return (data: unknown): { success: boolean; data?: z.infer<T>; errors?: Record<string, string> } => {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      return { success: false, errors };
    }
  };
}

// Async validation helper
export async function validateAsync<T>(
  value: T,
  validator: (value: T) => Promise<boolean>,
  errorMessage: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const isValid = await validator(value);
    return { valid: isValid, error: isValid ? undefined : errorMessage };
  } catch {
    return { valid: false, error: 'Validation failed' };
  }
}
