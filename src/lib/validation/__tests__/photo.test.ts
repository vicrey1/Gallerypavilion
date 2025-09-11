import { describe, expect, test } from 'vitest'
import { photoValidationSchema, validatePhotoData } from '../photo'
import { z } from 'zod'

describe('Photo Validation', () => {
  // Test valid data
  test('validates complete photo data', () => {
    const validData = {
      title: 'Sunset at the Beach',
      description: 'A beautiful sunset captured at the beach',
      price: 1000,
      isForSale: true,
      tags: ['nature', 'sunset', 'beach'],
      category: 'landscape',
      location: 'Malibu, CA',
      photographerName: 'John Doe',
      yearCreated: '2025',
      yearPrinted: '2025',
      seriesName: 'Coastal Series',
      editionNumber: '1/10',
      editionSize: 10,
      signatureType: 'Hand-signed',
      certificateOfAuthenticity: true,
      medium: 'Digital Photography',
      printingTechnique: 'Inkjet',
      paperType: 'Fine Art Paper',
      dimensions: {
        width: 24,
        height: 36,
        units: 'inches',
        framedDimensions: {
          width: 26,
          height: 38,
          depth: 2
        }
      },
      framingOptions: ['Black Frame', 'White Frame', 'No Frame'],
      artistStatement: 'This photograph captures the essence of California sunsets.',
      exhibitionHistory: ['Gallery A, 2024', 'Gallery B, 2025'],
      shippingDetails: {
        method: 'Standard',
        timeframe: '5-7 business days',
        restrictions: 'No international shipping'
      },
      returnPolicy: '30-day return policy'
    }

    const result = validatePhotoData(validData)
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  // Test required fields when for sale
  test('requires price and shipping details when photo is for sale', () => {
    const invalidData = {
      title: 'Test Photo',
      isForSale: true,
      tags: ['test']
    }

    const result = validatePhotoData(invalidData)
    expect(result.success).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'price',
      message: 'Price is required when photo is for sale'
    })
  })

  // Test dimensions validation
  test('validates framed dimensions are larger than image dimensions', () => {
    const invalidDimensions = {
      width: 30,
      height: 40,
      units: 'inches' as const,
      framedDimensions: {
        width: 20, // Smaller than image width
        height: 30, // Smaller than image height
        depth: 2
      }
    }

    expect(() => 
      photoValidationSchema.shape.dimensions.parse(invalidDimensions)
    ).toThrow('Framed dimensions must be larger than image dimensions')
  })

  // Test edition number format
  test('validates edition number format', () => {
    const invalidEdition = '2/1' // Current edition greater than total

    expect(() =>
      photoValidationSchema.shape.editionNumber.parse(invalidEdition)
    ).toThrow('Edition number cannot be greater than total editions')
  })

  // Test year validation
  test('validates year range', () => {
    const futureYear = '2030'
    const oldYear = '1700'

    expect(() =>
      photoValidationSchema.shape.yearCreated.parse(futureYear)
    ).toThrow('Year must be between 1800 and current year')

    expect(() =>
      photoValidationSchema.shape.yearCreated.parse(oldYear)
    ).toThrow('Year must be between 1800 and current year')
  })

  // Test string length limits
  test('validates string length limits', () => {
    const longTitle = 'a'.repeat(201)
    const longDescription = 'a'.repeat(2001)
    const longArtistStatement = 'a'.repeat(2001)

    expect(() =>
      photoValidationSchema.shape.title.parse(longTitle)
    ).toThrow('Title must not exceed 200 characters')

    expect(() =>
      photoValidationSchema.shape.description.parse(longDescription)
    ).toThrow('Description must not exceed 2000 characters')

    expect(() =>
      photoValidationSchema.shape.artistStatement.parse(longArtistStatement)
    ).toThrow('Artist statement must not exceed 2000 characters')
  })

  // Test shipping details validation
  test('validates shipping details', () => {
    const invalidMethod = {
      method: 'Invalid' as any,
      timeframe: '5-7 days'
    }

    expect(() =>
      photoValidationSchema.shape.shippingDetails.parse(invalidMethod)
    ).toThrow('Invalid input')
  })

  // Test certificate and signature requirements
  test('requires signature type with certificate', () => {
    const invalidCertData = {
      title: 'Test Photo',
      isForSale: true,
      price: 100,
      tags: ['test'],
      certificateOfAuthenticity: true,
      shippingDetails: {
        method: 'Standard',
        timeframe: '5-7 days'
      }
    }

    const result = validatePhotoData(invalidCertData)
    expect(result.success).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'signatureType',
      message: 'Signature type is required when certificate of authenticity is provided'
    })
  })
})
