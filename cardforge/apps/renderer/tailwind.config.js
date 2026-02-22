/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                cairo: ['Cairo', 'Tajawal', 'Noto Naskh Arabic', 'Segoe UI', 'system-ui', 'sans-serif'],
                inter: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
            },
            colors: {
                forge: {
                    950: '#07090f',
                    900: '#0a0e17',
                    800: '#0d1120',
                    700: '#111827',
                    600: '#1a2138',
                    panel: 'rgba(255,255,255,0.06)',
                    border: 'rgba(255,255,255,0.08)',
                },
                accent: {
                    purple: '#9b4dff',
                    blue: '#2e86ff',
                    glow: 'rgba(155,77,255,0.35)',
                },
                rarity: {
                    common: '#94a3b8',
                    uncommon: '#4ade80',
                    rare: '#38bdf8',
                    epic: '#c084fc',
                    legendary: '#fbbf24',
                },
            },
            backgroundImage: {
                'forge-gradient': 'linear-gradient(135deg, #0a0e17 0%, #0d1120 50%, #07090f 100%)',
                'accent-gradient': 'linear-gradient(135deg, #9b4dff 0%, #2e86ff 100%)',
                'panel-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                'card-fire': 'linear-gradient(135deg, #2d0a0a 0%, #1a0505 100%)',
                'card-water': 'linear-gradient(135deg, #0a1a2d 0%, #051020 100%)',
                'card-nature': 'linear-gradient(135deg, #0a2d0a 0%, #051505 100%)',
                'card-dark': 'linear-gradient(135deg, #0f0a1a 0%, #07060f 100%)',
                'card-light': 'linear-gradient(135deg, #2d2a0a 0%, #1a1705 100%)',
                'card-neutral': 'linear-gradient(135deg, #1a1a2d 0%, #0f0f1a 100%)',
                'dot-pattern': 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            },
            backgroundSize: {
                'dot-sm': '20px 20px',
                'dot-md': '28px 28px',
            },
            boxShadow: {
                'forge': '0 8px 32px rgba(0,0,0,0.6)',
                'forge-xl': '0 20px 60px rgba(0,0,0,0.7)',
                'glow-purple': '0 0 24px rgba(155,77,255,0.45)',
                'glow-blue': '0 0 24px rgba(46,134,255,0.45)',
                'glow-legendary': '0 0 40px rgba(251,191,36,0.55)',
                'glow-epic': '0 0 32px rgba(192,132,252,0.45)',
                'glow-rare': '0 0 28px rgba(56,189,248,0.45)',
                'glow-uncommon': '0 0 20px rgba(74,222,128,0.35)',
                'panel': '0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
            },
            borderRadius: {
                '2xl': '18px',
                '3xl': '24px',
                '4xl': '32px',
            },
            backdropBlur: {
                xs: '2px',
            },
            animation: {
                'rarity-pulse': 'rarity-pulse 2.5s ease-in-out infinite',
                'shimmer': 'shimmer 1.8s linear infinite',
                'float': 'float 4s ease-in-out infinite',
                'glow-breathe': 'glow-breathe 3s ease-in-out infinite',
                'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.4,0,0.2,1)',
                'slide-in-left': 'slide-in-left 0.3s cubic-bezier(0.4,0,0.2,1)',
                'slide-up': 'slide-up 0.3s cubic-bezier(0.4,0,0.2,1)',
                'fade-in': 'fade-in 0.25s ease-out',
                'scale-in': 'scale-in 0.2s cubic-bezier(0.4,0,0.2,1)',
                'spin-slow': 'spin 3s linear infinite',
            },
            keyframes: {
                'rarity-pulse': {
                    '0%, 100%': { opacity: '0.7' },
                    '50%': { opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                'glow-breathe': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(155,77,255,0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(155,77,255,0.65)' },
                },
                'slide-in-right': {
                    from: { transform: 'translateX(100%)', opacity: '0' },
                    to: { transform: 'translateX(0)', opacity: '1' },
                },
                'slide-in-left': {
                    from: { transform: 'translateX(-100%)', opacity: '0' },
                    to: { transform: 'translateX(0)', opacity: '1' },
                },
                'slide-up': {
                    from: { transform: 'translateY(24px)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'scale-in': {
                    from: { transform: 'scale(0.92)', opacity: '0' },
                    to: { transform: 'scale(1)', opacity: '1' },
                },
            },
            transitionTimingFunction: {
                spring: 'cubic-bezier(0.4, 0, 0.2, 1)',
                bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            },
        },
    },
    plugins: [],
};
