import Link from 'next/link'

interface LogoProps {
    className?: string
    showName?: boolean
}

export function Logo({ className = '', showName = true }: LogoProps) {
    return (
        <Link href="/dashboard" className={`flex items-center gap-2 ${className}`}>
            {/* 
        TODO: Replace the SVG below with the actual logo SVG. 
        For now using a placeholder shape.
      */}
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary-600 dark:text-primary-500"
            >
                <path
                    d="M8 4H20C24.4183 4 28 7.58172 28 12C28 16.4183 24.4183 20 20 20H14V28H8V4Z"
                    fill="currentColor"
                />
            </svg>

            {showName && (
                <span className="text-xl font-bold gradient-text from-primary-600 to-accent-600">
                    PicoBase
                </span>
            )}
        </Link>
    )
}
