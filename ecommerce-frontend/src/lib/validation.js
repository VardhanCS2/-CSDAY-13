import { z } from 'zod'

const emailField = z.string().trim().email('Enter a valid email address.')
const passwordField = z.string().min(8, 'Password must contain at least 8 characters.')
const registrationPasswordField = passwordField
  .regex(/\d/, 'Password must contain at least one number.')
  .regex(/[^A-Za-z0-9\s]/, 'Password must contain at least one special character.')

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
})

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must contain at least 2 characters.').max(100, 'Name must be 100 characters or fewer.'),
  email: emailField,
  password: registrationPasswordField,
})

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required.').max(100, 'Name must be 100 characters or fewer.'),
  description: z.string().trim().max(2000, 'Description must be 2,000 characters or fewer.'),
  price: z.string()
    .trim()
    .min(1, 'Price is required.')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid price with up to two decimal places.')
    .transform(Number)
    .pipe(z.number().finite().min(0, 'Price cannot be negative.')),
  stock: z.string()
    .trim()
    .min(1, 'Stock is required.')
    .regex(/^\d+$/, 'Stock must be a whole number.')
    .transform(Number)
    .pipe(z.number().int().min(0, 'Stock cannot be negative.')),
})
