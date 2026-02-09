import { ImageResponse } from 'next/og'

export const alt = 'PicoBase - The Open Source Backend for Vibe Coders'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0e1a',
          padding: '40px 56px',
        }}
      >
        {/* Nav */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2L2 7.7735V16.2265L12 22L22 16.2265V7.7735L12 2ZM8.5 7H14.5C16.8 7 18 8.5 18 10.5C18 12.5 16.8 14 14.5 14H11.5V17H8.5V7ZM11.5 9.5V11.5H14.5C15.2 11.5 15.5 11.2 15.5 10.5C15.5 9.8 15.2 9.5 14.5 9.5H11.5Z"
                fill="white"
              />
            </svg>
            <span
              style={{
                color: 'white',
                fontSize: '22px',
                fontWeight: 700,
              }}
            >
              PicoBase
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '28px',
            }}
          >
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '17px',
              }}
            >
              Docs
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '8px 20px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <span style={{ color: 'white', fontSize: '17px' }}>Sign In</span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '48px',
            flex: 1,
          }}
        >
          <div
            style={{
              color: '#4ade80',
              fontSize: '16px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '20px',
            }}
          >
            THE BACKEND FOR FLOW STATE
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                color: 'white',
                fontSize: '64px',
                fontWeight: 400,
                lineHeight: 1.15,
              }}
            >
              The Open Source
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  color: 'white',
                  fontSize: '84px',
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                Backend for
              </div>
              <div
                style={{
                  fontSize: '84px',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  background: 'linear-gradient(to right, #4ade80, #60a5fa)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Vibe Coders
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
