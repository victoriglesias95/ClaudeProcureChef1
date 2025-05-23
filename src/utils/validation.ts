// src/utils/validation.ts - Common validation schemas
import { z } from 'zod';

export const schemas = {
  email: z.string().email('Invalid email address'),
  
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number'),
  
  positiveNumber: z.number().positive('Must be greater than 0'),
  
  futureDate: z.string().refine((date) => {
    return new Date(date) > new Date();
  }, 'Date must be in the future'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
};