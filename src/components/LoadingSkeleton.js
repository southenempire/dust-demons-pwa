// src/components/LoadingSkeleton.js
// Reusable loading skeleton component for better UX

export function TokenSkeleton() {
    return (
        <div style={{
            padding: '12px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '8px',
            marginBottom: '8px'
        }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)'
                }} />
                <div style={{ flex: 1 }}>
                    <div style={{
                        height: '14px',
                        width: '60%',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        marginBottom: '8px'
                    }} />
                    <div style={{
                        height: '12px',
                        width: '40%',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '4px'
                    }} />
                </div>
                <div style={{
                    height: '16px',
                    width: '80px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px'
                }} />
            </div>
        </div>
    );
}

export function BalanceSkeleton() {
    return (
        <div style={{
            padding: '20px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            marginBottom: '16px'
        }}>
            <div style={{
                height: '16px',
                width: '100px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                marginBottom: '12px',
                animation: 'shimmer 1.5s infinite'
            }} />
            <div style={{
                height: '32px',
                width: '150px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '6px',
                animation: 'shimmer 1.5s infinite'
            }} />
        </div>
    );
}

export function StatsSkeleton() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[1, 2, 3, 4].map(i => (
                <div key={i} style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    animation: 'shimmer 1.5s infinite',
                    animationDelay: `${i * 0.1}s`
                }}>
                    <div style={{
                        height: '12px',
                        width: '60px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        marginBottom: '8px'
                    }} />
                    <div style={{
                        height: '24px',
                        width: '80px',
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '4px'
                    }} />
                </div>
            ))}
        </div>
    );
}

// Add shimmer animation to global styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
    document.head.appendChild(style);
}
