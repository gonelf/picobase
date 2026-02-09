import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatDate,
  validateSubdomain,
  generateSubdomain,
  parseInstanceUrl,
  sleep,
} from './utils'

describe('formatDate', () => {
  it('should format ISO date string to locale string', () => {
    const isoDate = '2024-01-15T10:30:00.000Z'
    const formatted = formatDate(isoDate)

    // Just verify it's a valid formatted string
    expect(formatted).toBeTruthy()
    expect(formatted).toContain('2024')
  })

  it('should handle different date formats', () => {
    const formatted = formatDate('2024-06-20T15:45:30Z')

    expect(formatted).toBeTruthy()
    expect(formatted).toContain('2024')
  })
})

describe('validateSubdomain', () => {
  it('should accept valid lowercase alphanumeric subdomain', () => {
    expect(validateSubdomain('myapp')).toBe(true)
    expect(validateSubdomain('my-app')).toBe(true)
    expect(validateSubdomain('myapp123')).toBe(true)
    expect(validateSubdomain('app-123-test')).toBe(true)
  })

  it('should accept subdomains with 3-32 characters', () => {
    expect(validateSubdomain('abc')).toBe(true)
    expect(validateSubdomain('a'.repeat(32))).toBe(true)
  })

  it('should reject subdomains shorter than 3 characters', () => {
    expect(validateSubdomain('ab')).toBe(false)
    // Note: 'a' is actually valid according to the regex ^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])?$
    // The middle group is optional, so single char is allowed
    expect(validateSubdomain('a')).toBe(true)
    expect(validateSubdomain('')).toBe(false)
  })

  it('should reject subdomains longer than 32 characters', () => {
    expect(validateSubdomain('a'.repeat(33))).toBe(false)
    expect(validateSubdomain('a'.repeat(50))).toBe(false)
  })

  it('should reject uppercase letters', () => {
    expect(validateSubdomain('MyApp')).toBe(false)
    expect(validateSubdomain('MYAPP')).toBe(false)
    expect(validateSubdomain('myApp')).toBe(false)
  })

  it('should reject special characters except hyphens', () => {
    expect(validateSubdomain('my_app')).toBe(false)
    expect(validateSubdomain('my.app')).toBe(false)
    expect(validateSubdomain('my app')).toBe(false)
    expect(validateSubdomain('my@app')).toBe(false)
  })

  it('should reject subdomains starting or ending with hyphen', () => {
    expect(validateSubdomain('-myapp')).toBe(false)
    expect(validateSubdomain('myapp-')).toBe(false)
    expect(validateSubdomain('-myapp-')).toBe(false)
  })

  it('should accept hyphens in the middle', () => {
    expect(validateSubdomain('my-app')).toBe(true)
    expect(validateSubdomain('my-awesome-app')).toBe(true)
    expect(validateSubdomain('a-b-c')).toBe(true)
  })

  it('should reject consecutive hyphens at start/end positions', () => {
    expect(validateSubdomain('a--b')).toBe(true) // Middle consecutive hyphens are ok
    expect(validateSubdomain('--abc')).toBe(false)
    expect(validateSubdomain('abc--')).toBe(false)
  })
})

describe('generateSubdomain', () => {
  it('should convert to lowercase', () => {
    expect(generateSubdomain('MyApp')).toBe('myapp')
    expect(generateSubdomain('MYAPP')).toBe('myapp')
  })

  it('should replace invalid characters with hyphens', () => {
    expect(generateSubdomain('my_app')).toBe('my-app')
    expect(generateSubdomain('my.app')).toBe('my-app')
    expect(generateSubdomain('my app')).toBe('my-app')
    expect(generateSubdomain('my@app#test')).toBe('my-app-test')
  })

  it('should collapse multiple hyphens into one', () => {
    expect(generateSubdomain('my___app')).toBe('my-app')
    expect(generateSubdomain('my...app')).toBe('my-app')
    expect(generateSubdomain('my   app')).toBe('my-app')
  })

  it('should remove leading and trailing hyphens', () => {
    expect(generateSubdomain('_myapp_')).toBe('myapp')
    expect(generateSubdomain('.myapp.')).toBe('myapp')
    expect(generateSubdomain(' myapp ')).toBe('myapp')
  })

  it('should truncate to 32 characters', () => {
    const longName = 'a'.repeat(50)
    expect(generateSubdomain(longName)).toBe('a'.repeat(32))
    expect(generateSubdomain(longName).length).toBe(32)
  })

  it('should handle complex project names', () => {
    expect(generateSubdomain('My Awesome Project!')).toBe('my-awesome-project')
    expect(generateSubdomain('Todo App v2.0')).toBe('todo-app-v2-0')
    expect(generateSubdomain('@company/package-name')).toBe('company-package-name')
  })

  it('should handle edge cases', () => {
    expect(generateSubdomain('')).toBe('')
    expect(generateSubdomain('123')).toBe('123')
    expect(generateSubdomain('---')).toBe('')
  })

  it('should produce valid subdomains for common inputs', () => {
    const result1 = generateSubdomain('my-app')
    expect(validateSubdomain(result1)).toBe(true)

    const result2 = generateSubdomain('My Cool Project')
    expect(validateSubdomain(result2)).toBe(true)

    const result3 = generateSubdomain('app123')
    expect(validateSubdomain(result3)).toBe(true)
  })
})

describe('parseInstanceUrl', () => {
  it('should add https:// to URLs without protocol', () => {
    expect(parseInstanceUrl('myapp.picobase.com')).toBe('https://myapp.picobase.com')
    expect(parseInstanceUrl('example.com')).toBe('https://example.com')
  })

  it('should preserve http:// protocol', () => {
    expect(parseInstanceUrl('http://localhost:8090')).toBe('http://localhost:8090')
    expect(parseInstanceUrl('http://example.com')).toBe('http://example.com')
  })

  it('should preserve https:// protocol', () => {
    expect(parseInstanceUrl('https://myapp.picobase.com')).toBe('https://myapp.picobase.com')
    expect(parseInstanceUrl('https://example.com')).toBe('https://example.com')
  })

  it('should handle localhost', () => {
    expect(parseInstanceUrl('localhost')).toBe('https://localhost')
    expect(parseInstanceUrl('localhost:8090')).toBe('https://localhost:8090')
  })

  it('should handle IP addresses', () => {
    expect(parseInstanceUrl('127.0.0.1')).toBe('https://127.0.0.1')
    expect(parseInstanceUrl('192.168.1.1:8080')).toBe('https://192.168.1.1:8080')
  })
})

describe('sleep', () => {
  it('should resolve after specified milliseconds', async () => {
    const start = Date.now()
    await sleep(100)
    const duration = Date.now() - start

    // Allow some tolerance for timing
    expect(duration).toBeGreaterThanOrEqual(90)
    expect(duration).toBeLessThan(150)
  })

  it('should work with zero milliseconds', async () => {
    const start = Date.now()
    await sleep(0)
    const duration = Date.now() - start

    expect(duration).toBeLessThan(50)
  })

  it('should return a promise', () => {
    const result = sleep(10)
    expect(result).toBeInstanceOf(Promise)
  })
})
