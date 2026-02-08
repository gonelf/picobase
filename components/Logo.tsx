import Link from 'next/link'

interface LogoProps {
    className?: string
    showName?: boolean
}

export function Logo({ className = '', showName = true }: LogoProps) {
    return (
        <Link href="/dashboard" className={`flex items-center gap-2 text-primary-500 ${className}`}>
            <div
                className="w-6 h-6 bg-current"
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

            {showName && (
                <span className="text-sm font-semibold text-white">
                    PicoBase
                </span>
            )}
        </Link>
    )
}
