import type { Metadata } from 'next'
import ComparisonLayout from '../ComparisonLayout'
import type { FeatureComparison, CodeExample } from '../ComparisonLayout'

export const metadata: Metadata = {
  title: 'PicoBase vs Convex — Comparison',
  description:
    'Compare PicoBase and Convex. See how PicoBase offers a simpler model with zero config, no custom query language, and straightforward pricing.',
  openGraph: {
    title: 'PicoBase vs Convex — Which Backend Should You Choose?',
    description:
      'Side-by-side comparison of PicoBase and Convex for database, auth, realtime, and developer experience.',
  },
}

const featureComparisons: FeatureComparison[] = [
  {
    category: 'Setup & DX',
    features: [
      { name: 'Zero-config start', picobase: true, competitor: false },
      { name: 'Auto-creating collections', picobase: true, competitor: false },
      { name: 'No custom query language', picobase: true, competitor: false },
      { name: 'TypeScript SDK', picobase: true, competitor: true },
      { name: 'React hooks', picobase: true, competitor: true },
      { name: 'Works with AI coding tools', picobase: true, competitor: 'partial' },
    ],
  },
  {
    category: 'Database',
    features: [
      { name: 'Relational database', picobase: true, competitor: false },
      { name: 'Document-based database', picobase: false, competitor: true },
      { name: 'Realtime by default', picobase: true, competitor: true },
      { name: 'REST API', picobase: true, competitor: false },
      { name: 'Server-side queries', picobase: true, competitor: true },
      { name: 'ACID transactions', picobase: true, competitor: true },
    ],
  },
  {
    category: 'Auth',
    features: [
      { name: 'Built-in auth', picobase: true, competitor: false },
      { name: 'OAuth providers', picobase: true, competitor: 'Via Clerk/Auth0' },
      { name: 'Drop-in auth UI', picobase: true, competitor: 'Via integration' },
      { name: 'No third-party auth required', picobase: true, competitor: false },
    ],
  },
  {
    category: 'Infrastructure',
    features: [
      { name: 'Managed hosting', picobase: true, competitor: true },
      { name: 'File storage', picobase: true, competitor: true },
      { name: 'Server functions', picobase: false, competitor: true },
      { name: 'Scheduled jobs', picobase: false, competitor: true },
      { name: 'Open source', picobase: true, competitor: 'partial' },
      { name: 'Self-hostable', picobase: true, competitor: false },
      { name: 'Per-tenant isolation', picobase: true, competitor: false },
    ],
  },
  {
    category: 'Pricing',
    features: [
      { name: 'Free tier', picobase: true, competitor: true },
      { name: 'Paid from', picobase: '$7/mo', competitor: '$25/mo' },
      { name: 'Predictable pricing', picobase: true, competitor: false },
    ],
  },
]

const codeExamples: CodeExample[] = [
  {
    label: 'Initialize the Client',
    picobase: `import { createClient } from '@picobase_app/client'

// Zero config — reads from env
const pb = createClient()`,
    competitor: `// convex/_generated/api.js is auto-generated
import { ConvexProvider, ConvexReactClient }
  from 'convex/react'

const convex = new ConvexReactClient(
  'https://your-deployment.convex.cloud'
)

// Must wrap app in provider
<ConvexProvider client={convex}>
  <App />
</ConvexProvider>`,
  },
  {
    label: 'Create a Record',
    picobase: `// Collection auto-creates on first write
const post = await pb
  .collection('posts')
  .create({ title: 'Hello', published: true })`,
    competitor: `// Must define schema + mutation first
// convex/schema.ts
import { defineSchema, defineTable }
  from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  posts: defineTable({
    title: v.string(),
    published: v.boolean(),
  }),
})

// convex/posts.ts
export const create = mutation({
  args: { title: v.string(), published: v.boolean() },
  handler: async (ctx, args) => {
    return await ctx.db.insert('posts', args)
  },
})

// Client code
await convex.mutation(api.posts.create, {
  title: 'Hello', published: true
})`,
  },
  {
    label: 'Query with Filters',
    picobase: `const posts = await pb
  .collection('posts')
  .getList(1, 20, {
    filter: 'published = true',
    sort: '-created',
  })`,
    competitor: `// Must define query function first
// convex/posts.ts
export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query('posts')
      .filter(q => q.eq(q.field('published'), true))
      .order('desc')
      .take(20)
  },
})

// Client code
const posts = useQuery(api.posts.list)`,
  },
  {
    label: 'Authentication',
    picobase: `// Built-in, no third party needed
await pb.auth.signUp({
  email: 'user@example.com',
  password: 'secure123',
})

await pb.auth.signIn({
  email: 'user@example.com',
  password: 'secure123',
})`,
    competitor: `// Requires Clerk, Auth0, or custom integration
// Example with Clerk:
import { ClerkProvider } from '@clerk/nextjs'

// Wrap app
<ClerkProvider>
  <ConvexProviderWithClerk client={convex}>
    <App />
  </ConvexProviderWithClerk>
</ClerkProvider>

// No built-in email/password auth`,
  },
]

const whySwitch = [
  {
    title: 'No Custom Query Language',
    description:
      'Convex requires you to learn its own query builder and define server-side query/mutation functions. PicoBase uses simple, familiar filter strings you can write inline.',
  },
  {
    title: 'Built-In Authentication',
    description:
      'Convex has no built-in auth — you must integrate Clerk, Auth0, or roll your own. PicoBase ships with email/password and OAuth out of the box.',
  },
  {
    title: 'No Schema Boilerplate',
    description:
      'Convex requires a schema definition file and separate query/mutation functions before you can read or write data. PicoBase collections auto-create on first write.',
  },
  {
    title: 'Self-Hostable & Open Source',
    description:
      'PicoBase is fully open source and can be self-hosted anywhere. Convex is a proprietary, cloud-only platform with no self-hosting option.',
  },
  {
    title: 'Standard REST API',
    description:
      'PicoBase exposes a REST API for every collection, usable from any language or tool. Convex requires its own client libraries and server functions.',
  },
  {
    title: 'Simpler Pricing',
    description:
      'PicoBase has flat, predictable plans starting at $7/mo. Convex pricing is usage-based and starts at $25/mo for the Pro plan.',
  },
]

export default function PicoBaseVsConvex() {
  return (
    <ComparisonLayout
      competitor="Convex"
      tagline="All the Reactivity, None of the Boilerplate"
      subtitle="Realtime data without schema files, server functions, or third-party auth."
      heroDescription="Convex offers powerful reactive queries, but requires you to define schemas, write server-side functions, and bring your own auth provider. PicoBase gives you realtime data, built-in auth, and auto-creating collections with a standard REST API."
      featureComparisons={featureComparisons}
      codeExamples={codeExamples}
      whySwitch={whySwitch}
      competitorDescription="Convex is a reactive backend platform that provides a document database with automatic realtime updates, server functions, and file storage. It uses a custom query language and requires schema definitions and server-side query/mutation functions. Auth requires a third-party integration like Clerk or Auth0."
    />
  )
}
