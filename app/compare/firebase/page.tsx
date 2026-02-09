import type { Metadata } from 'next'
import ComparisonLayout from '../ComparisonLayout'
import type { FeatureComparison, CodeExample, FAQItem } from '../ComparisonLayout'

export const metadata: Metadata = {
  title: 'PicoBase vs Firebase — Comparison (2025)',
  description:
    'Compare PicoBase and Firebase side-by-side. Open source, predictable pricing, no vendor lock-in, relational data model. See code comparisons and feature tables.',
  keywords: [
    'picobase vs firebase', 'firebase alternative', 'firebase alternative open source', 'best firebase alternative',
    'firebase competitor', 'firestore alternative', 'backend as a service', 'baas comparison',
    'firebase pricing', 'firebase open source alternative', 'firebase vendor lock-in',
  ],
  alternates: {
    canonical: 'https://picobase.app/compare/firebase',
  },
  openGraph: {
    title: 'PicoBase vs Firebase — Which Backend Should You Choose?',
    description:
      'Side-by-side comparison of PicoBase and Firebase. Open source, predictable pricing, no vendor lock-in.',
    url: 'https://picobase.app/compare/firebase',
    siteName: 'PicoBase',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PicoBase vs Firebase — Which Backend Should You Choose?',
    description: 'Open source, predictable pricing, no vendor lock-in. See the full comparison.',
  },
}

const featureComparisons: FeatureComparison[] = [
  {
    category: 'Setup & DX',
    features: [
      { name: 'Zero-config start', picobase: true, competitor: false },
      { name: 'Auto-creating collections', picobase: true, competitor: false },
      { name: 'CLI scaffolding', picobase: true, competitor: true },
      { name: 'TypeScript SDK', picobase: true, competitor: true },
      { name: 'Works with AI coding tools', picobase: true, competitor: 'partial' },
      { name: 'No Google account required', picobase: true, competitor: false },
    ],
  },
  {
    category: 'Database',
    features: [
      { name: 'Relational database', picobase: true, competitor: false },
      { name: 'NoSQL / document store', picobase: false, competitor: true },
      { name: 'Realtime subscriptions', picobase: true, competitor: true },
      { name: 'Auto-generated REST API', picobase: true, competitor: false },
      { name: 'SQL-like filtering', picobase: true, competitor: false },
      { name: 'Offline support', picobase: false, competitor: true },
    ],
  },
  {
    category: 'Auth',
    features: [
      { name: 'Email/password', picobase: true, competitor: true },
      { name: 'OAuth providers', picobase: true, competitor: true },
      { name: 'Drop-in auth UI component', picobase: true, competitor: true },
      { name: 'Anonymous auth', picobase: false, competitor: true },
      { name: 'Phone auth', picobase: false, competitor: true },
    ],
  },
  {
    category: 'Infrastructure',
    features: [
      { name: 'Managed hosting', picobase: true, competitor: true },
      { name: 'File storage', picobase: true, competitor: true },
      { name: 'Cloud functions', picobase: false, competitor: true },
      { name: 'Open source', picobase: true, competitor: false },
      { name: 'Self-hostable', picobase: true, competitor: false },
      { name: 'No vendor lock-in', picobase: true, competitor: false },
      { name: 'Per-tenant isolation', picobase: true, competitor: false },
    ],
  },
  {
    category: 'Pricing',
    features: [
      { name: 'Free tier', picobase: true, competitor: true },
      { name: 'Predictable pricing', picobase: true, competitor: false },
      { name: 'Paid from', picobase: '$7/mo', competitor: 'Pay-as-you-go' },
      { name: 'No surprise bills', picobase: true, competitor: false },
    ],
  },
]

const codeExamples: CodeExample[] = [
  {
    label: 'Initialize the Client',
    picobase: `import { createClient } from '@picobase_app/client'

// Zero config — reads from env
const pb = createClient()`,
    competitor: `import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const app = initializeApp({
  apiKey: "AIza...",
  authDomain: "myapp.firebaseapp.com",
  projectId: "myapp-12345",
  storageBucket: "myapp-12345.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
})

const db = getFirestore(app)`,
  },
  {
    label: 'Create a Record',
    picobase: `// Collection auto-creates on first write
const post = await pb
  .collection('posts')
  .create({ title: 'Hello', published: true })`,
    competitor: `import { collection, addDoc } from 'firebase/firestore'

const docRef = await addDoc(
  collection(db, 'posts'),
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
    competitor: `import {
  collection, query, where,
  orderBy, limit, getDocs
} from 'firebase/firestore'

const q = query(
  collection(db, 'posts'),
  where('published', '==', true),
  orderBy('created', 'desc'),
  limit(20)
)
const snapshot = await getDocs(q)
const posts = snapshot.docs.map(
  doc => ({ id: doc.id, ...doc.data() })
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
    competitor: `import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'

const auth = getAuth()

await createUserWithEmailAndPassword(
  auth, 'user@example.com', 'secure123'
)

await signInWithEmailAndPassword(
  auth, 'user@example.com', 'secure123'
)`,
  },
  {
    label: 'Realtime Subscriptions',
    picobase: `const unsub = await pb
  .collection('messages')
  .subscribe((e) => {
    console.log(e.action, e.record)
  })`,
    competitor: `import { collection, onSnapshot } from 'firebase/firestore'

const unsub = onSnapshot(
  collection(db, 'messages'),
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      console.log(change.type, change.doc.data())
    })
  }
)`,
  },
]

const whySwitch = [
  {
    title: 'Open Source, No Lock-In',
    description:
      'PicoBase is fully open source and self-hostable. Your data lives in standard SQLite databases you can export anytime. No proprietary formats, no Google dependency.',
  },
  {
    title: 'Predictable Pricing',
    description:
      'Firebase\'s pay-per-read/write model leads to surprise bills. PicoBase has flat, predictable pricing starting at $7/mo. Know what you\'ll pay before you ship.',
  },
  {
    title: 'Relational Data Model',
    description:
      'PicoBase uses a relational database with proper filtering, sorting, and pagination. No need to denormalize your data or restructure for every new query pattern.',
  },
  {
    title: 'Simpler SDK Surface',
    description:
      'Firebase requires importing dozens of functions from different modules. PicoBase has a single client with a chainable, intuitive API. Less imports, less boilerplate.',
  },
  {
    title: 'Zero-Config Setup',
    description:
      'Firebase needs a config object with 7 fields. PicoBase reads from your environment automatically. One install, zero configuration.',
  },
  {
    title: 'AI-Native Development',
    description:
      'PicoBase\'s small, predictable API surface is designed for AI coding tools. Cursor, Claude, and v0 can use PicoBase correctly without hallucinating complex configurations.',
  },
]

const faqItems: FAQItem[] = [
  {
    question: 'Is PicoBase a drop-in replacement for Firebase?',
    answer: 'PicoBase covers the core Firebase features — database, auth, realtime, and file storage. However, PicoBase uses a relational data model instead of Firebase\'s NoSQL document model. For most apps, this is an upgrade, but if you heavily depend on Firestore\'s nested document structure or offline-first sync, the migration requires some data restructuring.',
  },
  {
    question: 'Will I get surprise bills with PicoBase like Firebase?',
    answer: 'No. PicoBase uses flat, predictable monthly pricing starting at $7/mo. There are no per-read or per-write charges. You know exactly what you\'ll pay before you ship, unlike Firebase\'s pay-per-operation model.',
  },
  {
    question: 'Can I use PicoBase without a Google account?',
    answer: 'Yes. PicoBase is completely independent of Google. You can sign up with any email, self-host on any infrastructure, and export your data at any time. No Google Cloud dependency.',
  },
  {
    question: 'Does PicoBase support offline-first like Firebase?',
    answer: 'PicoBase currently focuses on online-first with realtime subscriptions. If your app requires extensive offline support with automatic sync (like Firebase\'s Firestore offline persistence), Firebase may be a better fit for that specific use case.',
  },
  {
    question: 'Why choose PicoBase over Firebase for a new project?',
    answer: 'PicoBase offers open-source transparency, a relational data model that scales without denormalization, predictable pricing, zero vendor lock-in, and a simpler SDK surface that works perfectly with AI coding tools. If you\'re starting fresh, PicoBase gets you to production faster with less complexity.',
  },
]

export default function PicoBaseVsFirebase() {
  return (
    <ComparisonLayout
      competitor="Firebase"
      competitorSlug="firebase"
      tagline="The Open Source Firebase Alternative"
      subtitle="Open source. Predictable pricing. No vendor lock-in."
      heroDescription="Firebase gives you a lot of features tied to Google Cloud. PicoBase gives you the essentials — database, auth, realtime, storage — without the complexity, the lock-in, or the surprise bills."
      featureComparisons={featureComparisons}
      codeExamples={codeExamples}
      whySwitch={whySwitch}
      competitorDescription="Firebase is Google's Backend-as-a-Service platform. It offers a NoSQL document database (Firestore), authentication, cloud functions, hosting, and file storage. While feature-rich and well-integrated with Google Cloud, it uses proprietary formats, has a complex pricing model based on reads/writes, and creates significant vendor lock-in."
      faqItems={faqItems}
    />
  )
}
