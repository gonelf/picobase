import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { seedCommand, type SeedConfig } from './seed'
import * as configModule from '../config'
import axios from 'axios'

// Mock dependencies
vi.mock('../config')
vi.mock('fs')
vi.mock('axios')

describe('seed command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(configModule.config.getCurrentInstance).mockReturnValue({
      id: 'inst_123',
      name: 'test-instance',
      url: 'https://test.picobase.com',
      apiKey: 'pbk_test',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should detect and load JSON seed file', async () => {
    const seedData: SeedConfig = {
      collections: {
        posts: [
          { title: 'Post 1', content: 'Hello', published: true },
          { title: 'Post 2', content: 'World', published: false },
        ],
      },
    }

    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const filePath = String(p)
      if (filePath.endsWith('picobase.seed.json')) return true
      return false
    })
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(seedData))
    vi.mocked(axios.post).mockResolvedValue({ status: 200, data: { id: 'rec_123' } })

    await seedCommand()

    // Should have posted 2 records to the posts collection
    expect(axios.post).toHaveBeenCalledTimes(2)
    expect(axios.post).toHaveBeenCalledWith(
      'https://test.picobase.com/api/collections/posts/records',
      { title: 'Post 1', content: 'Hello', published: true },
      expect.objectContaining({
        headers: { Authorization: 'Bearer pbk_test' },
      })
    )
  })

  it('should seed multiple collections', async () => {
    const seedData: SeedConfig = {
      collections: {
        posts: [{ title: 'Post 1' }],
        users: [{ email: 'admin@example.com', name: 'Admin' }],
      },
    }

    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const filePath = String(p)
      if (filePath.endsWith('picobase.seed.json')) return true
      return false
    })
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(seedData))
    vi.mocked(axios.post).mockResolvedValue({ status: 200, data: { id: 'rec_123' } })

    await seedCommand()

    // Should have posted to both collections
    expect(axios.post).toHaveBeenCalledTimes(2)
    expect(axios.post).toHaveBeenCalledWith(
      'https://test.picobase.com/api/collections/posts/records',
      expect.any(Object),
      expect.any(Object)
    )
    expect(axios.post).toHaveBeenCalledWith(
      'https://test.picobase.com/api/collections/users/records',
      expect.any(Object),
      expect.any(Object)
    )
  })

  it('should handle --reset flag by clearing data first', async () => {
    const seedData: SeedConfig = {
      collections: {
        posts: [{ title: 'New Post' }],
      },
    }

    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const filePath = String(p)
      if (filePath.endsWith('picobase.seed.json')) return true
      return false
    })
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(seedData))

    // Mock GET for clearing existing records
    vi.mocked(axios.get).mockResolvedValue({
      status: 200,
      data: {
        items: [{ id: 'existing_1' }, { id: 'existing_2' }],
      },
    })
    vi.mocked(axios.delete).mockResolvedValue({ status: 200 })
    vi.mocked(axios.post).mockResolvedValue({ status: 200, data: { id: 'rec_123' } })

    await seedCommand({ reset: true })

    // Should have fetched existing records
    expect(axios.get).toHaveBeenCalledWith(
      'https://test.picobase.com/api/collections/posts/records',
      expect.any(Object)
    )

    // Should have deleted existing records
    expect(axios.delete).toHaveBeenCalledTimes(2)
    expect(axios.delete).toHaveBeenCalledWith(
      'https://test.picobase.com/api/collections/posts/records/existing_1',
      expect.any(Object)
    )

    // Should have created the new record
    expect(axios.post).toHaveBeenCalledTimes(1)
  })

  it('should error when no seed file is found', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)

    // process.exit(1) is called which vitest intercepts and throws
    await expect(seedCommand()).rejects.toThrow()
  })

  it('should handle record creation errors gracefully', async () => {
    const seedData: SeedConfig = {
      collections: {
        posts: [
          { title: 'Good Post' },
          { title: 'Bad Post' },
        ],
      },
    }

    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const filePath = String(p)
      if (filePath.endsWith('picobase.seed.json')) return true
      return false
    })
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(seedData))

    // First call succeeds, second fails
    vi.mocked(axios.post)
      .mockResolvedValueOnce({ status: 200, data: { id: 'rec_1' } })
      .mockRejectedValueOnce(new Error('Validation failed'))

    // Should complete without throwing — errors are per-record, not fatal
    await seedCommand()

    expect(axios.post).toHaveBeenCalledTimes(2)
  })

  it('should use explicit file path when provided', async () => {
    const seedData: SeedConfig = {
      collections: {
        posts: [{ title: 'Custom Path Post' }],
      },
    }

    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(seedData))
    vi.mocked(axios.post).mockResolvedValue({ status: 200, data: { id: 'rec_123' } })

    await seedCommand({ file: './custom-seed.json' })

    expect(axios.post).toHaveBeenCalledTimes(1)
  })

  it('should validate seed config has collections property', async () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const filePath = String(p)
      if (filePath.endsWith('picobase.seed.json')) return true
      return false
    })
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ notCollections: {} }))

    await expect(seedCommand()).rejects.toThrow()
  })

  it('should validate collections are arrays of records', async () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const filePath = String(p)
      if (filePath.endsWith('picobase.seed.json')) return true
      return false
    })
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ collections: { posts: 'not-an-array' } })
    )

    await expect(seedCommand()).rejects.toThrow()
  })

  it('should fall back to localhost when no instance is configured', async () => {
    vi.mocked(configModule.config.getCurrentInstance).mockReturnValue(undefined)

    const seedData: SeedConfig = {
      collections: {
        posts: [{ title: 'Local Post' }],
      },
    }

    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const filePath = String(p)
      if (filePath.endsWith('picobase.seed.json')) return true
      return false
    })
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(seedData))
    vi.mocked(axios.post).mockResolvedValue({ status: 200, data: { id: 'rec_123' } })

    await seedCommand()

    // Should use localhost fallback
    expect(axios.post).toHaveBeenCalledWith(
      'http://127.0.0.1:8090/api/collections/posts/records',
      expect.any(Object),
      expect.any(Object)
    )
  })
})
