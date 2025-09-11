import { z } from 'zod'

// Helper schemas for complex types
const dimensionsSchema = z.object({
  width: z.number().positive('Width must be greater than 0'),
  height: z.number().positive('Height must be greater than 0'),
  units: z.enum(['inches', 'centimeters']),
  paperSize: z.string().optional(),
  framedDimensions: z.object({
    width: z.number().positive('Framed width must be greater than 0'),
    height: z.number().positive('Framed height must be greater than 0'),
    depth: z.number().positive('Framed depth must be greater than 0').optional(),
  }).optional(),
}).refine(
  data => data.framedDimensions ? 
    data.framedDimensions.width > data.width && 
    data.framedDimensions.height > data.height : true,
  'Framed dimensions must be larger than image dimensions'
)

const shippingDetailsSchema = z.object({
  method: z.enum(['Standard', 'Express', 'Overnight', 'International']),
  timeframe: z.string().min(1, 'Shipping timeframe is required'),
  restrictions: z.string().optional(),
})

// Photo validation schema
export const photoValidationSchema = z.object({
  // Basic Information
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),
  price: z.number()
    .positive('Price must be greater than 0')
    .transform(val => Number(val.toFixed(2))) // Round to 2 decimal places
    .optional(),
  isForSale: z.boolean(),
  tags: z.array(z.string().min(1, 'Tags cannot be empty')),
  category: z.string().min(1, 'Category is required').optional(),
  location: z.string().max(100, 'Location must not exceed 100 characters').optional(),

  // Artwork Information
  photographerName: z.string()
    .min(1, 'Photographer name is required')
    .max(100, 'Photographer name must not exceed 100 characters')
    .optional(),
  yearCreated: z.string()
    .regex(/^\d{4}$/, 'Year must be in YYYY format')
    .refine(
      val => {
        const year = parseInt(val)
        return year >= 1800 && year <= new Date().getFullYear()
      },
      'Year must be between 1800 and current year'
    )
    .optional(),
  yearPrinted: z.string()
    .regex(/^\d{4}$/, 'Year must be in YYYY format')
    .refine(
      val => {
        const year = parseInt(val)
        return year >= 1800 && year <= new Date().getFullYear()
      },
      'Year must be between 1800 and current year'
    )
    .optional(),
  seriesName: z.string()
    .max(200, 'Series name must not exceed 200 characters')
    .optional(),

  // Edition & Authenticity
  editionNumber: z.string()
    .regex(/^\d+\/\d+$/, 'Edition number must be in format "n/m"')
    .refine(
      val => {
        const [current, total] = val.split('/').map(Number)
        return current <= total
      },
      'Edition number cannot be greater than total editions'
    )
    .optional(),
  editionSize: z.number()
    .int('Edition size must be a whole number')
    .positive('Edition size must be greater than 0')
    .optional(),
  signatureType: z.enum(['Hand-signed', 'Digital signature', 'Certificate only', 'Unsigned'])
    .optional(),
  certificateOfAuthenticity: z.boolean()
    .optional(),

  // Materials & Size
  medium: z.string()
    .min(1, 'Medium is required')
    .max(100, 'Medium must not exceed 100 characters')
    .optional(),
  printingTechnique: z.string()
    .min(1, 'Printing technique is required')
    .max(100, 'Printing technique must not exceed 100 characters')
    .optional(),
  paperType: z.string()
    .min(1, 'Paper type is required')
    .max(100, 'Paper type must not exceed 100 characters')
    .optional(),
  dimensions: dimensionsSchema.optional(),
  framingOptions: z.array(z.string()
    .min(1, 'Framing option cannot be empty')
    .max(100, 'Framing option must not exceed 100 characters')
  ).optional(),

  // Context
  artistStatement: z.string()
    .max(2000, 'Artist statement must not exceed 2000 characters')
    .optional(),
  exhibitionHistory: z.array(z.string()
    .min(1, 'Exhibition history entry cannot be empty')
    .max(500, 'Exhibition history entry must not exceed 500 characters')
  ).optional(),

  // Purchase Information
  shippingDetails: shippingDetailsSchema.optional(),
  returnPolicy: z.string()
    .max(1000, 'Return policy must not exceed 1000 characters')
    .optional()
})

// Photo update validation schema (all fields optional)
export const photoUpdateValidationSchema = photoValidationSchema.partial()

// Purchase request validation schema
export const purchaseRequestValidationSchema = z.object({
  inviteCode: z.string(),
  email: z.string().email().optional(),
  message: z.string().optional()
})

// API response types
export type PhotoValidationError = {
  field: string
  message: string
}

export type PhotoValidationResponse = {
  success: boolean
  errors?: PhotoValidationError[]
  data?: z.infer<typeof photoValidationSchema>
}

// Validate photo data
export const validatePhotoData = (data: any): PhotoValidationResponse => {
  try {
    const validatedData = photoValidationSchema.parse(data)

    // Additional business logic validation
    if (validatedData.isForSale) {
      if (!validatedData.price) {
        return {
          success: false,
          errors: [{
            field: 'price',
            message: 'Price is required when photo is for sale'
          }]
        }
      }
      if (!validatedData.shippingDetails) {
        return {
          success: false,
          errors: [{
            field: 'shippingDetails',
            message: 'Shipping details are required when photo is for sale'
          }]
        }
      }
    }

    if (validatedData.certificateOfAuthenticity && !validatedData.signatureType) {
      return {
        success: false,
        errors: [{
          field: 'signatureType',
          message: 'Signature type is required when certificate of authenticity is provided'
        }]
      }
    }

    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: error instanceof Error ? error.message : 'Validation failed'
      }]
    }
  }
}
