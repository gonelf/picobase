import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { doctorCommand } from './doctor'
import * as configModule from '../config'
import axios from 'axios'

// Mock dependencies
vi.mock('../config')
vi.mock('fs')
vi.mock('axios')
vi.mock('child_process', () => ({
  execSync: vi.fn().mockReturnValue('pocketbase version 0.22.0'),
}))

describe('doctor command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: logged in with a valid instance
    vi.mocked(configModule.config.getAuthToken).mockReturnValue('valid.eyJleHAiOjk5OTk5OTk5OTl9.sig')
    vi.mocked(configModule.config.getCurrentInstance).mockReturnValue({
      id: 'inst_123',
      name: 'my-app',
      url: 'https://my-app.picobase.com',
      apiKey: 'pbk_abc123',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should pass when auth token exists', async () => {
    vi.mocked(configModule.config.getAuthToken).mockReturnValue('some-token')
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(axios.get).mockResolvedValue({ status: 200, data: {} })

    // Should complete without throwing (no failures, only warnings)
    await doctorCommand()
  })

  it('should fail when auth token is missing', async () => {
    vi.mocked(configModule.config.getAuthToken).mockReturnValue(undefined)
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(axios.get).mockResolvedValue({ status: 200, data: {} })

    // process.exit(1) is called which vitest intercepts and throws
    await expect(doctorCommand()).rejects.toThrow()
  })

  it('should fail when no instance is configured', async () => {
    vi.mocked(configModule.config.getCurrentInstance).mockReturnValue(undefined)
    vi.mocked(fs.existsSync).mockReturnValue(false)

    await expect(doctorCommand()).rejects.toThrow()
  })

  it('should check instance reachability', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(axios.get).mockResolvedValue({ status: 200, data: { items: [] } })

    await doctorCommand()

    // axios.get should have been called with the health endpoint
    expect(axios.get).toHaveBeenCalledWith(
      'https://my-app.picobase.com/api/health',
      expect.objectContaining({ timeout: 10000 })
    )
  })

  it('should check API key validity', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(axios.get).mockResolvedValue({ status: 200, data: { items: [] } })

    await doctorCommand()

    // axios.get should have been called with the collections endpoint and auth header
    expect(axios.get).toHaveBeenCalledWith(
      'https://my-app.picobase.com/api/collections',
      expect.objectContaining({
        headers: { Authorization: 'Bearer pbk_abc123' },
      })
    )
  })

  it('should detect Node.js version', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(axios.get).mockResolvedValue({ status: 200, data: {} })

    // Node version check uses process.version — should pass on Node >= 18
    await doctorCommand()
  })

  it('should detect env file with required variables', async () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const filePath = String(p)
      if (filePath.endsWith('.env.local')) return true
      return false
    })
    vi.mocked(fs.readFileSync).mockReturnValue(
      'PICOBASE_URL=https://my-app.picobase.com\nPICOBASE_API_KEY=pbk_abc123\n'
    )
    vi.mocked(axios.get).mockResolvedValue({ status: 200, data: {} })

    await doctorCommand()
  })

  it('should detect types file and check age', async () => {
    const recentTime = Date.now() - 1000 * 60 * 30 // 30 minutes ago
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const filePath = String(p)
      if (filePath.includes('picobase.ts')) return true
      return false
    })
    vi.mocked(fs.statSync).mockReturnValue({
      mtimeMs: recentTime,
    } as any)
    vi.mocked(axios.get).mockResolvedValue({ status: 200, data: {} })

    await doctorCommand()
  })

  it('should check package.json for PicoBase packages', async () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const filePath = String(p)
      if (filePath.endsWith('package.json')) return true
      return false
    })
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        dependencies: {
          '@picobase_app/client': '^0.1.0',
        },
      })
    )
    vi.mocked(axios.get).mockResolvedValue({ status: 200, data: {} })

    await doctorCommand()
  })

  it('should warn on package version mismatch', async () => {
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      const filePath = String(p)
      if (filePath.endsWith('package.json')) return true
      return false
    })
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        dependencies: {
          '@picobase_app/client': '^0.1.0',
          '@picobase_app/react': '^0.2.0',
        },
      })
    )
    vi.mocked(axios.get).mockResolvedValue({ status: 200, data: {} })

    // Should complete without hard failure (mismatch is a warning, not failure)
    await doctorCommand()
  })
})
