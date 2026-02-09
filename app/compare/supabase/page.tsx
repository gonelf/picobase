import type { Metadata } from 'next'
import ComparisonLayout from '../ComparisonLayout'
import type { FeatureComparison, CodeExample } from '../ComparisonLayout'

export const metadata: Metadata = {
  title: 'PicoBase vs Supabase — Comparison',
  description:
    'Compare PicoBase and Supabase. See how PicoBase offers zero-config setup, auto-creating collections, and a simpler developer experience for shipping fast.',
  openGraph: {
    title: 'PicoBase vs Supabase — Which Backend Should You Choose?',
    description:
      'Side-by-side comparison of PicoBase and Supabase for database, auth, realtime, and file storage.',
  },
}

const featureComparisons: FeatureComparison[] = [
  {
    category: 'Setup & DX',
    features: [
      { name: 'Zero-config start', picobase: true, competitor: false },
      { name: 'Auto-creating collections', picobase: true, competitor: false },
      { name: 'No SQL migrations needed', picobase: true, competitor: false },
      { name: 'CLI scaffolding', picobase: true, competitor: true },
      { name: 'TypeScript SDK', picobase: true, competitor: true },
      { name: 'Works with AI coding tools', picobase: true, competitor: 'partial' },
    ],
  },
  {
    category: 'Database',
    features: [
      { name: 'Relational database', picobase: true, competitor: true },
      { name: 'Realtime subscriptions', picobase: true, competitor: true },
      { name: 'Auto-generated REST API', picobase: true, competitor: true },
      { name: 'Row-level security', picobase: true, competitor: true },
      { name: 'No schema setup required', picobase: true, competitor: false },
      { name: 'GraphQL', picobase: false, competitor: 'partial' },
    ],
  },
  {
    category: 'Auth',
    features: [
      { name: 'Email/password', picobase: true, competitor: true },
      { name: 'OAuth providers', picobase: true, competitor: true },
      { name: 'Drop-in auth UI component', picobase: true, competitor: true },
      { name: 'One-line auth setup', picobase: true, competitor: false },
    ],
  },
  {
    category: 'Infrastructure',
    features: [
      { name: 'Managed hosting', picobase: true, competitor: true },
      { name: 'File storage', picobase: true, competitor: true },
      { name: 'Edge functions', picobase: false, competitor: true },
      { name: 'Open source', picobase: true, competitor: true },
      { name: 'Self-hostable', picobase: true, competitor: true },
      { name: 'Per-tenant isolation', picobase: true, competitor: false },
    ],
  },
  {
    category: 'Pricing',
    features: [
      { name: 'Free tier', picobase: true, competitor: true },
      { name: 'Starts at', picobase: '$0/mo', competitor: '$0/mo' },
      { name: 'Paid from', picobase: '$7/mo', competitor: '$25/mo' },
      { name: 'No credit card required', picobase: true, competitor: true },
    ],
  },
]

const codeExamples: CodeExample[] = [
  {
    label: 'Initialize the Client',
    picobase: `import { createClient } from '@picobase_app/client'

// Zero config — reads from env
const pb = createClient()`,
    competitor: `import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xyz.supabase.co',
  'your-anon-key'
)`,
  },
  {
    label: 'Create a Record',
    picobase: `// Collection auto-creates on first write
const post = await pb
  .collection('posts')
  .create({ title: 'Hello', published: true })`,
    competitor: `// Requires table + migration first
const { data, error } = await supabase
  .from('posts')
  .insert({ title: 'Hello', published: true })

if (error) throw error`,
  },
  {
    label: 'Query with Filters',
    picobase: `const posts = await pb
  .collection('posts')
  .getList(1, 20, {
    filter: 'published = true',
    sort: '-created',
  })`,
    competitor: `const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .range(0, 19)`,
  },
  {
    label: 'Authentication',
    picobase: `// Sign up
await pb.auth.signUp({
  email: 'user@example.com',
  password: 'secure123',
})

// Sign in
await pb.auth.signIn({
  email: 'user@example.com',
  password: 'secure123',
})`,
    competitor: `// Sign up
const { data, error } = await supabase
  .auth.signUp({
    email: 'user@example.com',
    password: 'secure123',
  })

// Sign in
const { data, error } = await supabase
  .auth.signInWithPassword({
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
    competitor: `const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'messages' },
    (payload) => console.log(payload)
  )
  .subscribe()`,
  },
]

const whySwitch = [
  {
    title: 'Zero Config, Zero Friction',
    description:
      'No connection strings, no API keys in your code, no dashboard configuration. Install the SDK and start writing data. PicoBase reads everything from your environment.',
  },
  {
    title: 'Collections Auto-Create',
    description:
      'Write to any collection name and it exists. No SQL migrations, no schema editor, no waiting. Just code and ship.',
  },
  {
    title: 'Simpler Mental Model',
    description:
      'No need to learn SQL, RLS policies, or Postgres internals. PicoBase gives you a clean TypeScript API that works the way you think.',
  },
  {
    title: 'Built for AI-Assisted Development',
    description:
      'PicoBase is designed to work seamlessly with Cursor, Claude, v0, and other AI coding tools. The API surface is small enough for AI to use correctly every time.',
  },
  {
    title: '3.5x Cheaper to Start',
    description:
      'Paid plans start at $7/mo vs Supabase\'s $25/mo. Same features, lower barrier. Scale when you need to, not before.',
  },
  {
    title: 'Per-Tenant Isolation',
    description:
      'Every PicoBase project runs in its own isolated instance. No shared database, no noisy neighbor issues. True multi-tenancy from day one.',
  },
]

export default function PicoBaseVsSupabase() {
  return (
    <ComparisonLayout
      competitor="Supabase"
      tagline="The Simpler Supabase Alternative"
      subtitle="Same power. Less complexity. Ship in minutes, not hours."
      heroDescription="Supabase gives you a powerful Postgres-backed platform, but it comes with SQL migrations, RLS policies, and configuration overhead. PicoBase gives you the same capabilities with zero config."
      featureComparisons={featureComparisons}
      codeExamples={codeExamples}
      whySwitch={whySwitch}
      competitorDescription="Supabase is an open-source Firebase alternative built on top of PostgreSQL. It provides a full suite of backend tools including a Postgres database, authentication, realtime subscriptions, edge functions, and file storage. It's a powerful platform, but requires SQL knowledge, migration management, and row-level security policies to get started."
    />
  )
}
