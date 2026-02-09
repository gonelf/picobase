import type { Metadata } from 'next'
import ComparisonLayout from '../ComparisonLayout'
import type { FeatureComparison, CodeExample, FAQItem } from '../ComparisonLayout'

export const metadata: Metadata = {
  title: 'PicoBase vs Nhost — Comparison (2025)',
  description:
    'Compare PicoBase and Nhost side-by-side. No GraphQL required, no SQL migrations, single-binary self-hosting, and lower pricing. See code comparisons and feature tables.',
  keywords: [
    'picobase vs nhost', 'nhost alternative', 'nhost competitor', 'best nhost alternative',
    'nhost vs supabase', 'graphql backend', 'hasura alternative', 'backend as a service',
    'baas comparison', 'nhost pricing', 'open source baas',
  ],
  alternates: {
    canonical: 'https://picobase.app/compare/nhost',
  },
  openGraph: {
    title: 'PicoBase vs Nhost — Which Backend Should You Choose?',
    description:
      'Side-by-side comparison of PicoBase and Nhost. No GraphQL required, no SQL migrations, simpler stack.',
    url: 'https://picobase.app/compare/nhost',
    siteName: 'PicoBase',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PicoBase vs Nhost — Which Backend Should You Choose?',
    description: 'No GraphQL required, no SQL migrations, single-binary self-hosting.',
  },
}

const featureComparisons: FeatureComparison[] = [
  {
    category: 'Setup & DX',
    features: [
      { name: 'Zero-config start', picobase: true, competitor: false },
      { name: 'Auto-creating collections', picobase: true, competitor: false },
      { name: 'No GraphQL knowledge needed', picobase: true, competitor: false },
      { name: 'No SQL migrations', picobase: true, competitor: false },
      { name: 'TypeScript SDK', picobase: true, competitor: true },
      { name: 'Works with AI coding tools', picobase: true, competitor: 'partial' },
    ],
  },
  {
    category: 'Database',
    features: [
      { name: 'Relational database', picobase: true, competitor: true },
      { name: 'GraphQL API', picobase: false, competitor: true },
      { name: 'REST API', picobase: true, competitor: 'partial' },
      { name: 'Realtime subscriptions', picobase: true, competitor: true },
      { name: 'No Hasura required', picobase: true, competitor: false },
      { name: 'No schema setup required', picobase: true, competitor: false },
    ],
  },
  {
    category: 'Auth',
    features: [
      { name: 'Email/password', picobase: true, competitor: true },
      { name: 'OAuth providers', picobase: true, competitor: true },
      { name: 'Drop-in auth UI', picobase: true, competitor: true },
      { name: 'Magic link', picobase: false, competitor: true },
      { name: 'SMS auth', picobase: false, competitor: true },
    ],
  },
  {
    category: 'Infrastructure',
    features: [
      { name: 'Managed hosting', picobase: true, competitor: true },
      { name: 'File storage', picobase: true, competitor: true },
      { name: 'Serverless functions', picobase: false, competitor: true },
      { name: 'Open source', picobase: true, competitor: true },
      { name: 'Self-hostable', picobase: true, competitor: true },
      { name: 'Per-tenant isolation', picobase: true, competitor: false },
      { name: 'Single-binary deployment', picobase: true, competitor: false },
    ],
  },
  {
    category: 'Pricing',
    features: [
      { name: 'Free tier', picobase: true, competitor: true },
      { name: 'Paid from', picobase: '$7/mo', competitor: '$25/mo' },
      { name: 'No credit card for free tier', picobase: true, competitor: true },
    ],
  },
]

const codeExamples: CodeExample[] = [
  {
    label: 'Initialize the Client',
    picobase: `import { createClient } from '@picobase_app/client'

// Zero config — reads from env
const pb = createClient()`,
    competitor: `import { NhostClient } from '@nhost/nhost-js'

const nhost = new NhostClient({
  subdomain: 'your-subdomain',
  region: 'us-east-1',
})`,
  },
  {
    label: 'Create a Record',
    picobase: `// Collection auto-creates on first write
const post = await pb
  .collection('posts')
  .create({ title: 'Hello', published: true })`,
    competitor: `// Requires Postgres table + Hasura permissions
const INSERT_POST = gql\`
  mutation InsertPost(
    $title: String!,
    $published: Boolean!
  ) {
    insert_posts_one(object: {
      title: $title,
      published: $published
    }) {
      id
      title
      published
    }
  }
\`

const { data, error } = await nhost.graphql
  .request(INSERT_POST, {
    title: 'Hello',
    published: true,
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
    competitor: `const GET_POSTS = gql\`
  query GetPosts {
    posts(
      where: { published: { _eq: true } }
      order_by: { created_at: desc }
      limit: 20
    ) {
      id
      title
      published
      created_at
    }
  }
\`

const { data, error } = await nhost.graphql
  .request(GET_POSTS)`,
  },
  {
    label: 'Authentication',
    picobase: `await pb.auth.signUp({
  email: 'user@example.com',
  password: 'secure123',
})

await pb.auth.signIn({
  email: 'user@example.com',
  password: 'secure123',
})`,
    competitor: `await nhost.auth.signUp({
  email: 'user@example.com',
  password: 'secure123',
})

await nhost.auth.signIn({
  email: 'user@example.com',
  password: 'secure123',
})`,
  },
  {
    label: 'Realtime Subscriptions',
    picobase: `const unsub = await pb
  .collection('messages')
  .subscribe((e) => {
    console.log(e.action, e.record)
  })`,
    competitor: `// Requires GraphQL subscription
const SUBSCRIBE_MESSAGES = gql\`
  subscription OnNewMessage {
    messages(order_by: { created_at: desc }) {
      id
      content
      created_at
    }
  }
\`

// Typically used with a React hook
// or Apollo subscription client`,
  },
]

const whySwitch = [
  {
    title: 'No GraphQL Required',
    description:
      'Nhost is built on Hasura and requires GraphQL for data operations. PicoBase uses a simple, chainable TypeScript API. No query language to learn.',
  },
  {
    title: 'No SQL Migrations',
    description:
      'Nhost requires Postgres migrations and Hasura metadata management. PicoBase collections auto-create. No migration files, no schema syncing.',
  },
  {
    title: 'Simpler Stack',
    description:
      'Nhost runs Postgres + Hasura + custom auth under the hood. PicoBase is a single binary with everything built in. Fewer moving parts means fewer things to break.',
  },
  {
    title: 'Lower Entry Price',
    description:
      'PicoBase paid plans start at $7/mo vs Nhost\'s $25/mo Pro plan. More value at every tier.',
  },
  {
    title: 'Better AI Compatibility',
    description:
      'GraphQL mutations and queries are notoriously hard for AI coding tools to generate correctly. PicoBase\'s REST API is simple enough for AI to get right every time.',
  },
  {
    title: 'Single-Binary Self-Hosting',
    description:
      'Self-hosting Nhost means running Postgres, Hasura, and auth services. PicoBase is a single Go binary you can deploy anywhere in seconds.',
  },
]

const faqItems: FAQItem[] = [
  {
    question: 'Do I need to know GraphQL to use PicoBase?',
    answer: 'No. PicoBase uses a simple REST API with a chainable TypeScript SDK. There are no GraphQL queries, mutations, or subscriptions to write. If you\'re tired of writing gql template literals, PicoBase is a welcome change.',
  },
  {
    question: 'Is PicoBase still relational like Nhost?',
    answer: 'Yes. Both PicoBase and Nhost use relational databases under the hood. The difference is that PicoBase doesn\'t require Postgres migrations or a GraphQL engine (Hasura) to access your data. You get the benefits of relational data with a simpler access layer.',
  },
  {
    question: 'Can AI coding tools work with PicoBase better than Nhost?',
    answer: 'Yes. GraphQL mutations and queries are notoriously hard for AI tools like Cursor, Claude, and v0 to generate correctly — the syntax is complex and error-prone. PicoBase\'s REST API and simple filter strings are easy for AI to get right every time.',
  },
  {
    question: 'How does self-hosting PicoBase compare to self-hosting Nhost?',
    answer: 'Self-hosting Nhost requires running Postgres, Hasura, an auth service, and potentially more containers. PicoBase is a single Go binary — download it, run it, done. No Docker, no container orchestration, no multi-service management.',
  },
  {
    question: 'Does PicoBase support serverless functions like Nhost?',
    answer: 'PicoBase currently focuses on database, auth, realtime, and file storage. For server-side logic, you can pair PicoBase with your existing framework (Next.js API routes, Vercel functions, etc.). Dedicated serverless functions are on our roadmap.',
  },
]

export default function PicoBaseVsNhost() {
  return (
    <ComparisonLayout
      competitor="Nhost"
      competitorSlug="nhost"
      tagline="Skip the GraphQL. Ship Faster."
      subtitle="All the backend power without the GraphQL complexity."
      heroDescription="Nhost pairs Postgres with Hasura and GraphQL, giving you power at the cost of complexity. PicoBase gives you a relational backend with a simple REST API — no GraphQL, no migrations, no Hasura configuration."
      featureComparisons={featureComparisons}
      codeExamples={codeExamples}
      whySwitch={whySwitch}
      competitorDescription="Nhost is an open-source Firebase alternative built on Postgres, Hasura (GraphQL engine), and a custom auth service. It provides a GraphQL API, authentication, file storage, and serverless functions. While powerful, it requires knowledge of GraphQL, Postgres migrations, and Hasura permissions to use effectively."
      faqItems={faqItems}
    />
  )
}
