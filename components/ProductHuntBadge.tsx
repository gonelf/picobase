'use client';

import { useEffect, useState } from 'react';

export default function ProductHuntBadge() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
            <a
                href="https://presubscribe.producthunt.com/picobase-2"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:scale-105 transition-transform duration-300"
            >
                <img
                    src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=465355&theme=light"
                    alt="PicoBase - The open source Firebase alternative for vibe coders | Product Hunt"
                    style={{ width: '250px', height: '54px' }}
                    width="250"
                    height="54"
                />
            </a>
        </div>
    );
}
