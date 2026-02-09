import Link from 'next/link'
import { getAuthUrl } from '@/lib/auth-utils'
import WaitlistForm from '@/components/WaitlistForm'

export interface FeatureComparison {
  category: string
  features: {
    name: string
    picobase: string | boolean
    competitor: string | boolean
  }[]
}

export interface CodeExample {
  label: string
  picobase: string
  competitor: string
}

interface ComparisonLayoutProps {
  competitor: string
  tagline: string
  subtitle: string
  heroDescription: string
  featureComparisons: FeatureComparison[]
  codeExamples: CodeExample[]
  whySwitch: { title: string; description: string }[]
  competitorDescription: string
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  )
}

function PartialIcon() {
  return (
    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  )
}

function renderValue(val: string | boolean) {
  if (val === true) return <CheckIcon />
  if (val === false) return <XIcon />
  if (val === 'partial') return <PartialIcon />
  return <span className="text-sm text-gray-300">{val}</span>
}

export default function ComparisonLayout({
  competitor,
  tagline,
  subtitle,
  heroDescription,
  featureComparisons,
  codeExamples,
  whySwitch,
  competitorDescription,
}: ComparisonLayoutProps) {
  const signInUrl = getAuthUrl('signin')

  const alternatives = [
    { name: 'Supabase', href: '/compare/supabase' },
    { name: 'Firebase', href: '/compare/firebase' },
    { name: 'Appwrite', href: '/compare/appwrite' },
    { name: 'Convex', href: '/compare/convex' },
    { name: 'Nhost', href: '/compare/nhost' },
  ].filter((a) => a.name.toLowerCase() !== competitor.toLowerCase())

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <div className="relative bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 pt-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 bg-white"
              style={{
                maskImage: 'url(/logo.svg)',
                maskSize: 'contain',
                maskPosition: 'center',
                maskRepeat: 'no-repeat',
                WebkitMaskImage: 'url(/logo.svg)',
                WebkitMaskSize: 'contain',
                WebkitMaskPosition: 'center',
                WebkitMaskRepeat: 'no-repeat',
              }}
            />
            <span className="text-white font-bold text-xl">PicoBase</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/docs"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Docs
            </Link>
            <Link
              href={signInUrl}
              className="px-6 py-2 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/30 hover:bg-white/20 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gray-950 py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-primary-400 font-semibold text-sm uppercase tracking-wider mb-4">
            PicoBase vs {competitor}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {tagline}
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-4 max-w-2xl mx-auto">
            {subtitle}
          </p>
          <p className="text-base text-white/50 mb-10 max-w-2xl mx-auto">
            {heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={signInUrl}
              className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all duration-300"
            >
              Start Building Free
            </Link>
            <Link
              href="/docs"
              className="px-8 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

      {/* What is competitor */}
      <section className="py-16 px-6 bg-gray-900 border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">What is {competitor}?</h2>
          <p className="text-white/70 leading-relaxed">{competitorDescription}</p>
        </div>
      </section>

      {/* Code Comparison */}
      <section className="py-20 md:py-28 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              See the Difference in Code
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Compare how common tasks look in PicoBase vs {competitor}
            </p>
          </div>

          <div className="space-y-8">
            {codeExamples.map((example) => (
              <div key={example.label}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {example.label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-5 py-3 bg-primary-600/10 dark:bg-primary-900/30 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-bold text-primary-700 dark:text-primary-400">PicoBase</span>
                    </div>
                    <pre className="bg-gray-950 p-5 text-sm text-gray-200 leading-relaxed overflow-x-auto">
                      <code>{example.picobase}</code>
                    </pre>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-5 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{competitor}</span>
                    </div>
                    <pre className="bg-gray-950 p-5 text-sm text-gray-200 leading-relaxed overflow-x-auto">
                      <code>{example.competitor}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 md:py-28 px-6 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Feature Comparison
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              How PicoBase stacks up against {competitor}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="grid grid-cols-3 px-6 py-3 bg-gray-950 text-white text-sm font-semibold">
              <span>Feature</span>
              <span className="text-center">PicoBase</span>
              <span className="text-center">{competitor}</span>
            </div>
            {featureComparisons.map((section, sIdx) => (
              <div key={section.category}>
                <div className="px-6 py-4 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white">{section.category}</h3>
                </div>
                {section.features.map((feature, fIdx) => (
                  <div
                    key={feature.name}
                    className={`grid grid-cols-3 px-6 py-4 items-center ${
                      fIdx < section.features.length - 1 || sIdx < featureComparisons.length - 1
                        ? 'border-b border-gray-200 dark:border-gray-700'
                        : ''
                    } bg-white dark:bg-gray-900/50`}
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {feature.name}
                    </span>
                    <div className="flex items-center justify-center">
                      {renderValue(feature.picobase)}
                    </div>
                    <div className="flex items-center justify-center">
                      {renderValue(feature.competitor)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Switch */}
      <section className="py-20 md:py-28 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Why Developers Choose PicoBase
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whySwitch.map((reason) => (
              <div
                key={reason.title}
                className="p-8 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  {reason.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Comparisons */}
      <section className="py-12 px-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Other Comparisons
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {alternatives.map((alt) => (
              <Link
                key={alt.name}
                href={alt.href}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                PicoBase vs {alt.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 px-6 bg-gray-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Try PicoBase?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join the waitlist and be the first to experience the backend built for flow state.
          </p>
          <WaitlistForm />
          <p className="mt-6 text-white/50 text-sm">
            No credit card required. No setup. Just vibes.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-white/60">
          <p>&copy; {new Date().getFullYear()} PicoBase. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
            <Link href="https://github.com/picobase/picobase" className="hover:text-white transition-colors">GitHub</Link>
            <Link href="https://twitter.com/picobase" className="hover:text-white transition-colors">Twitter</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
