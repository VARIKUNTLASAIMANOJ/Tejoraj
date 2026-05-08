import { useId } from 'react';

export default function SpaceAgentLogo({ size = 40, className = '', title = 'SpaceAgent logo' }) {
    const uid = useId();
    const bgId = `spaceagent-logo-bg-${uid}`;
    const rayId = `spaceagent-logo-ray-${uid}`;

    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 100 100"
            role="img"
            aria-label={title}
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <radialGradient id={bgId} cx="50%" cy="40%" r="70%">
                    <stop offset="0%" stopColor="#111a49" />
                    <stop offset="100%" stopColor="#060a1f" />
                </radialGradient>
                <linearGradient id={rayId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f2d27a" />
                    <stop offset="100%" stopColor="#d3aa4c" />
                </linearGradient>
            </defs>

            <circle cx="50" cy="50" r="48" fill={`url(#${bgId})`} />

            <g fill={`url(#${rayId})`}>
                <polygon points="50,6 54,40 50,48 46,40" />
                <polygon points="50,94 54,60 50,52 46,60" />
                <polygon points="6,50 40,54 48,50 40,46" />
                <polygon points="94,50 60,54 52,50 60,46" />

                <polygon points="50,14 57,39 50,50 43,39" />
                <polygon points="50,86 57,61 50,50 43,61" />
                <polygon points="14,50 39,57 50,50 39,43" />
                <polygon points="86,50 61,57 50,50 61,43" />

                <polygon points="50,18 62,38 50,50 38,38" />
                <polygon points="50,82 62,62 50,50 38,62" />
                <polygon points="18,50 38,62 50,50 38,38" />
                <polygon points="82,50 62,62 50,50 62,38" />

                <polygon points="50,22 68,36 50,50 32,36" />
                <polygon points="50,78 68,64 50,50 32,64" />
                <polygon points="22,50 36,68 50,50 36,32" />
                <polygon points="78,50 64,68 50,50 64,32" />

                <polygon points="50,26 74,34 50,50 26,34" />
                <polygon points="50,74 74,66 50,50 26,66" />
                <polygon points="26,50 34,74 50,50 34,26" />
                <polygon points="74,50 66,74 50,50 66,26" />
            </g>

            <circle cx="50" cy="50" r="19" fill="#060a1f" stroke="#d3aa4c" strokeWidth="2" />
            <circle cx="50" cy="50" r="8" fill="#f2d27a" />
        </svg>
    );
}