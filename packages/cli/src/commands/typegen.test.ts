import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { typegenCommand, hashSchema } from './typegen'
import * as api from '../api'
import * as config from '../config'

// Mock dependencies
vi.mock('../api')
vi.mock('../config')
vi.mock('fs')

describe('typegen type generation', () => {
  // We'll test the output by calling typegenCommand and checking the generated file
  // Since we can't easily import the internal generateTypes function, we'll test via the command

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should generate TypeScript types with base record interface', async () => {
    // Mock config to return instance
    vi.mocked(config.config.getCurrentInstance).mockReturnValue({
      id: 'inst_123',
      name: 'test-instance',
      url: 'https://test.picobase.com',
      apiKey: 'pbk_test',
    })

    // Mock API to return collections
    const mockCollections = [
      {
        name: 'posts',
        schema: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'editor', required: false },
          { name: 'published', type: 'bool', required: true },
        ],
      },
    ]

    vi.mocked(api.api.getCollections).mockResolvedValue(mockCollections)

    // Mock fs.writeFileSync to capture output
    let generatedContent = ''
    vi.mocked(fs.writeFileSync).mockImplementation((filePath, content) => {
      generatedContent = content as string
    })

    vi.mocked(fs.existsSync).mockReturnValue(true)

    // Execute command
    await typegenCommand({ output: './test-types.ts' })

    // Verify BaseRecord interface was generated
    expect(generatedContent).toContain('export interface BaseRecord')
    expect(generatedContent).toContain('id: string')
    expect(generatedContent).toContain('created: string')
    expect(generatedContent).toContain('updated: string')
  })

  it('should generate collection-specific interfaces', async () => {
    vi.mocked(config.config.getCurrentInstance).mockReturnValue({
      id: 'inst_123',
      name: 'test-instance',
      url: 'https://test.picobase.com',
      apiKey: 'pbk_test',
    })

    const mockCollections = [
      {
        name: 'posts',
        schema: [
          { name: 'title', type: 'text', required: true },
          { name: 'views', type: 'number', required: false },
        ],
      },
      {
        name: 'users',
        schema: [
          { name: 'email', type: 'email', required: true },
          { name: 'name', type: 'text', required: true },
        ],
      },
    ]

    vi.mocked(api.api.getCollections).mockResolvedValue(mockCollections)

    let generatedContent = ''
    vi.mocked(fs.writeFileSync).mockImplementation((filePath, content) => {
      generatedContent = content as string
    })

    vi.mocked(fs.existsSync).mockReturnValue(true)

    await typegenCommand({ output: './test-types.ts' })

    // Verify collection interfaces
    expect(generatedContent).toContain('export interface PostsRecord extends BaseRecord')
    expect(generatedContent).toContain('title: string')
    expect(generatedContent).toContain('views?: number')

    expect(generatedContent).toContain('export interface UsersRecord extends BaseRecord')
    expect(generatedContent).toContain('email: string')
    expect(generatedContent).toContain('name: string')
  })

  it('should map field types correctly', async () => {
    vi.mocked(config.config.getCurrentInstance).mockReturnValue({
      id: 'inst_123',
      name: 'test',
      url: 'https://test.picobase.com',
      apiKey: 'pbk_test',
    })

    const mockCollections = [
      {
        name: 'test_types',
        schema: [
          { name: 'textField', type: 'text', required: true },
          { name: 'numberField', type: 'number', required: true },
          { name: 'boolField', type: 'bool', required: true },
          { name: 'dateField', type: 'date', required: true },
          { name: 'urlField', type: 'url', required: false },
          { name: 'emailField', type: 'email', required: false },
          { name: 'editorField', type: 'editor', required: false },
          { name: 'jsonField', type: 'json', required: false },
        ],
      },
    ]

    vi.mocked(api.api.getCollections).mockResolvedValue(mockCollections)

    let generatedContent = ''
    vi.mocked(fs.writeFileSync).mockImplementation((filePath, content) => {
      generatedContent = content as string
    })

    vi.mocked(fs.existsSync).mockReturnValue(true)

    await typegenCommand({ output: './test-types.ts' })

    // Verify field types
    expect(generatedContent).toContain('textField: string')
    expect(generatedContent).toContain('numberField: number')
    expect(generatedContent).toContain('boolField: boolean')
    expect(generatedContent).toContain('dateField: string')
    expect(generatedContent).toContain('urlField?: string')
    expect(generatedContent).toContain('emailField?: string')
    expect(generatedContent).toContain('editorField?: string')
    expect(generatedContent).toContain('jsonField?: any')
  })

  it('should generate select field with union types', async () => {
    vi.mocked(config.config.getCurrentInstance).mockReturnValue({
      id: 'inst_123',
      name: 'test',
      url: 'https://test.picobase.com',
      apiKey: 'pbk_test',
    })

    const mockCollections = [
      {
        name: 'posts',
        schema: [
          {
            name: 'status',
            type: 'select',
            required: true,
            options: { values: ['draft', 'published', 'archived'] },
          },
        ],
      },
    ]

    vi.mocked(api.api.getCollections).mockResolvedValue(mockCollections)

    let generatedContent = ''
    vi.mocked(fs.writeFileSync).mockImplementation((filePath, content) => {
      generatedContent = content as string
    })

    vi.mocked(fs.existsSync).mockReturnValue(true)

    await typegenCommand({ output: './test-types.ts' })

    // Verify select union type
    expect(generatedContent).toContain("status: 'draft' | 'published' | 'archived'")
  })

  it('should handle file and relation fields', async () => {
    vi.mocked(config.config.getCurrentInstance).mockReturnValue({
      id: 'inst_123',
      name: 'test',
      url: 'https://test.picobase.com',
      apiKey: 'pbk_test',
    })

    const mockCollections = [
      {
        name: 'posts',
        schema: [
          { name: 'avatar', type: 'file', required: false, options: { maxSelect: 1 } },
          { name: 'images', type: 'file', required: false, options: { maxSelect: 5 } },
          { name: 'author', type: 'relation', required: true, options: { maxSelect: 1 } },
          { name: 'tags', type: 'relation', required: false, options: { maxSelect: 10 } },
        ],
      },
    ]

    vi.mocked(api.api.getCollections).mockResolvedValue(mockCollections)

    let generatedContent = ''
    vi.mocked(fs.writeFileSync).mockImplementation((filePath, content) => {
      generatedContent = content as string
    })

    vi.mocked(fs.existsSync).mockReturnValue(true)

    await typegenCommand({ output: './test-types.ts' })

    // Single file/relation = string, multiple = string[]
    expect(generatedContent).toContain('avatar?: string')
    expect(generatedContent).toContain('images?: string[]')
    expect(generatedContent).toContain('author: string')
    expect(generatedContent).toContain('tags?: string[]')
  })

  it('should generate CollectionName union type', async () => {
    vi.mocked(config.config.getCurrentInstance).mockReturnValue({
      id: 'inst_123',
      name: 'test',
      url: 'https://test.picobase.com',
      apiKey: 'pbk_test',
    })

    const mockCollections = [
      { name: 'posts', schema: [] },
      { name: 'users', schema: [] },
      { name: 'comments', schema: [] },
    ]

    vi.mocked(api.api.getCollections).mockResolvedValue(mockCollections)

    let generatedContent = ''
    vi.mocked(fs.writeFileSync).mockImplementation((filePath, content) => {
      generatedContent = content as string
    })

    vi.mocked(fs.existsSync).mockReturnValue(true)

    await typegenCommand({ output: './test-types.ts' })

    // Verify CollectionName type
    expect(generatedContent).toContain("export type CollectionName = 'posts' | 'users' | 'comments'")
  })

  it('should generate CollectionRecords mapping interface', async () => {
    vi.mocked(config.config.getCurrentInstance).mockReturnValue({
      id: 'inst_123',
      name: 'test',
      url: 'https://test.picobase.com',
      apiKey: 'pbk_test',
    })

    const mockCollections = [
      { name: 'posts', schema: [] },
      { name: 'users', schema: [] },
    ]

    vi.mocked(api.api.getCollections).mockResolvedValue(mockCollections)

    let generatedContent = ''
    vi.mocked(fs.writeFileSync).mockImplementation((filePath, content) => {
      generatedContent = content as string
    })

    vi.mocked(fs.existsSync).mockReturnValue(true)

    await typegenCommand({ output: './test-types.ts' })

    // Verify CollectionRecords mapping
    expect(generatedContent).toContain('export interface CollectionRecords')
    expect(generatedContent).toContain('posts: PostsRecord')
    expect(generatedContent).toContain('users: UsersRecord')
  })

  it('should generate typed client helpers', async () => {
    vi.mocked(config.config.getCurrentInstance).mockReturnValue({
      id: 'inst_123',
      name: 'test',
      url: 'https://test.picobase.com',
      apiKey: 'pbk_test',
    })

    vi.mocked(api.api.getCollections).mockResolvedValue([{ name: 'posts', schema: [] }])

    let generatedContent = ''
    vi.mocked(fs.writeFileSync).mockImplementation((filePath, content) => {
      generatedContent = content as string
    })

    vi.mocked(fs.existsSync).mockReturnValue(true)

    await typegenCommand({ output: './test-types.ts' })

    // Verify typed client
    expect(generatedContent).toContain('export interface TypedPicoBaseClient')
    expect(generatedContent).toContain('export function createTypedClient')
    expect(generatedContent).toContain('export const pb = createTypedClient()')
  })

  it('should convert snake_case and kebab-case to PascalCase', async () => {
    vi.mocked(config.config.getCurrentInstance).mockReturnValue({
      id: 'inst_123',
      name: 'test',
      url: 'https://test.picobase.com',
      apiKey: 'pbk_test',
    })

    const mockCollections = [
      { name: 'blog_posts', schema: [] },
      { name: 'user-profiles', schema: [] },
      { name: 'api_keys', schema: [] },
    ]

    vi.mocked(api.api.getCollections).mockResolvedValue(mockCollections)

    let generatedContent = ''
    vi.mocked(fs.writeFileSync).mockImplementation((filePath, content) => {
      generatedContent = content as string
    })

    vi.mocked(fs.existsSync).mockReturnValue(true)

    await typegenCommand({ output: './test-types.ts' })

    // Verify PascalCase conversion
    expect(generatedContent).toContain('export interface BlogPostsRecord')
    expect(generatedContent).toContain('export interface UserProfilesRecord')
    expect(generatedContent).toContain('export interface ApiKeysRecord')
  })

  it('should create output directory if it doesn\'t exist', async () => {
    vi.mocked(config.config.getCurrentInstance).mockReturnValue({
      id: 'inst_123',
      name: 'test',
      url: 'https://test.picobase.com',
      apiKey: 'pbk_test',
    })

    vi.mocked(api.api.getCollections).mockResolvedValue([])
    vi.mocked(fs.existsSync).mockReturnValue(false)

    await typegenCommand({ output: './src/types/picobase.ts' })

    // Verify mkdir was called
    expect(fs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('src/types'),
      { recursive: true }
    )
  })
})

describe('hashSchema', () => {
  it('should produce consistent hashes for the same schema', () => {
    const collections = [
      { name: 'posts', type: 'base', schema: [{ name: 'title', type: 'text' }] },
    ]
    const hash1 = hashSchema(collections)
    const hash2 = hashSchema(collections)
    expect(hash1).toBe(hash2)
  })

  it('should produce different hashes when schema changes', () => {
    const collections1 = [
      { name: 'posts', type: 'base', schema: [{ name: 'title', type: 'text' }] },
    ]
    const collections2 = [
      { name: 'posts', type: 'base', schema: [
        { name: 'title', type: 'text' },
        { name: 'content', type: 'editor' },
      ] },
    ]
    expect(hashSchema(collections1)).not.toBe(hashSchema(collections2))
  })

  it('should ignore non-schema fields (like timestamps)', () => {
    const collections1 = [
      { name: 'posts', type: 'base', schema: [], created: '2024-01-01', updated: '2024-01-01' },
    ]
    const collections2 = [
      { name: 'posts', type: 'base', schema: [], created: '2024-06-01', updated: '2024-06-15' },
    ]
    expect(hashSchema(collections1)).toBe(hashSchema(collections2))
  })

  it('should detect when a collection is added', () => {
    const collections1 = [
      { name: 'posts', type: 'base', schema: [] },
    ]
    const collections2 = [
      { name: 'posts', type: 'base', schema: [] },
      { name: 'comments', type: 'base', schema: [] },
    ]
    expect(hashSchema(collections1)).not.toBe(hashSchema(collections2))
  })
})
