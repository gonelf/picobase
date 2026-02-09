import type { Metadata } from 'next'
import ComparisonLayout from '../ComparisonLayout'
import type { FeatureComparison, CodeExample } from '../ComparisonLayout'

export const metadata: Metadata = {
  title: 'PicoBase vs Appwrite — Comparison',
  description:
    'Compare PicoBase and Appwrite. See how PicoBase offers a simpler setup, auto-creating collections, and a leaner developer experience.',
  openGraph: {
    title: 'PicoBase vs Appwrite — Which Backend Should You Choose?',
    description:
      'Side-by-side comparison of PicoBase and Appwrite for database, auth, realtime, and file storage.',
  },
}

const featureComparisons: FeatureComparison[] = [
  {
    category: 'Setup & DX',
    features: [
      { name: 'Zero-config start', picobase: true, competitor: false },
      { name: 'Auto-creating collections', picobase: true, competitor: false },
      { name: 'No Docker required (managed)', picobase: true, competitor: true },
      { name: 'CLI scaffolding', picobase: true, competitor: true },
      { name: 'TypeScript SDK', picobase: true, competitor: true },
      { name: 'Works with AI coding tools', picobase: true, competitor: 'partial' },
    ],
  },
  {
    category: 'Database',
    features: [
      { name: 'Relational database', picobase: true, competitor: false },
      { name: 'Document-based database', picobase: false, competitor: true },
      { name: 'Realtime subscriptions', picobase: true, competitor: true },
      { name: 'Auto-generated REST API', picobase: true, competitor: true },
      { name: 'No schema setup required', picobase: true, competitor: false },
      { name: 'Complex queries', picobase: true, competitor: true },
    ],
  },
  {
    category: 'Auth',
    features: [
      { name: 'Email/password', picobase: true, competitor: true },
      { name: 'OAuth providers', picobase: true, competitor: true },
      { name: 'Drop-in auth UI', picobase: true, competitor: false },
      { name: 'Teams & roles', picobase: 'partial', competitor: true },
      { name: 'Magic link / passwordless', picobase: false, competitor: true },
    ],
  },
  {
    category: 'Infrastructure',
    features: [
      { name: 'Managed hosting', picobase: true, competitor: true },
      { name: 'File storage', picobase: true, competitor: true },
      { name: 'Cloud functions', picobase: false, competitor: true },
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
      { name: 'Paid from', picobase: '$7/mo', competitor: '$15/mo' },
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
    competitor: `import { Client, Databases } from 'appwrite'

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('project-id')

const databases = new Databases(client)`,
  },
  {
    label: 'Create a Record',
    picobase: `// Collection auto-creates on first write
const post = await pb
  .collection('posts')
  .create({ title: 'Hello', published: true })`,
    competitor: `// Requires database + collection created in console
import { ID } from 'appwrite'

const post = await databases.createDocument(
  'database-id',
  'posts-collection-id',
  ID.unique(),
  { title: 'Hello', published: true }
)`,
  },
  {
    label: 'Query with Filters',
    picobase: `const posts = await pb
  .collection('posts')
  .getList(1, 20, {
    filter: 'published = true',
    sort: '-created',
  })`,
    competitor: `import { Query } from 'appwrite'

const posts = await databases.listDocuments(
  'database-id',
  'posts-collection-id',
  [
    Query.equal('published', true),
    Query.orderDesc('$createdAt'),
    Query.limit(20),
  ]
)`,
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
    competitor: `import { Account, ID } from 'appwrite'
const account = new Account(client)

await account.create(
  ID.unique(),
  'user@example.com',
  'secure123'
)

await account.createEmailPasswordSession(
  'user@example.com',
  'secure123'
)`,
  },
  {
    label: 'Realtime Subscriptions',
    picobase: `const unsub = await pb
  .collection('messages')
  .subscribe((e) => {
    console.log(e.action, e.record)
  })`,
    competitor: `client.subscribe(
  'databases.db-id.collections.messages.documents',
  (response) => {
    console.log(response.events, response.payload)
  }
)`,
  },
]

const whySwitch = [
  {
    title: 'No Database IDs to Manage',
    description:
      'Appwrite requires you to reference database IDs and collection IDs in every query. PicoBase uses simple collection names — just write pb.collection(\'posts\') and go.',
  },
  {
    title: 'Auto-Creating Collections',
    description:
      'With Appwrite, you must create databases, collections, and define attributes in the console before writing any data. PicoBase collections create themselves on first write.',
  },
  {
    title: 'Simpler Architecture',
    description:
      'Appwrite self-hosting requires Docker with multiple containers (MariaDB, Redis, etc.). PicoBase runs as a single binary. The managed version requires zero setup.',
  },
  {
    title: 'Relational Data',
    description:
      'PicoBase uses a relational model with proper joins and relations. Appwrite uses a document model that can make complex queries harder to express.',
  },
  {
    title: 'Lower Starting Price',
    description:
      'PicoBase paid plans start at $7/mo vs Appwrite\'s $15/mo Pro plan. Get more out of your budget when you\'re starting out.',
  },
  {
    title: 'Built for Vibe Coding',
    description:
      'PicoBase is optimized for AI-assisted development. The small API surface means tools like Cursor and Claude generate correct PicoBase code reliably.',
  },
]

export default function PicoBaseVsAppwrite() {
  return (
    <ComparisonLayout
      competitor="Appwrite"
      tagline="Less Config, More Shipping"
      subtitle="Same open-source values. Radically simpler developer experience."
      heroDescription="Appwrite is a solid open-source BaaS, but it requires you to set up databases, collections, and attributes before writing any code. PicoBase skips all that — just install and start building."
      featureComparisons={featureComparisons}
      codeExamples={codeExamples}
      whySwitch={whySwitch}
      competitorDescription="Appwrite is an open-source Backend-as-a-Service platform that provides database, authentication, functions, storage, and messaging. It's self-hostable via Docker and also offers a managed cloud service. While comprehensive, it requires manual setup of databases, collections, and attribute definitions before you can store data."
    />
  )
}
