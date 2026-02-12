import { useEffect, useState } from 'react';

export default function usePullToRefresh(ref) {
    useEffect(() => {
        const element = ref.current || window;
        let startY = 0;

        // Only enable if user is at the top
        const isAtTop = () => (ref.current ? ref.current.scrollTop === 0 : window.scrollY === 0);

        const handleTouchStart = (e) => {
            if (isAtTop()) {
                startY = e.touches[0].clientY;
            }
        };

        const handleTouchEnd = (e) => {
            if (!isAtTop()) return;

            const endY = e.changedTouches[0].clientY;
            const dist = endY - startY;

            // Threshold for refresh (e.g., 150px pull)
            if (startY > 0 && dist > 150) {
                // Visual feedback could be added here
                window.location.reload();
            }
            startY = 0; // Reset
        };

        element.addEventListener('touchstart', handleTouchStart);
        element.addEventListener('touchend', handleTouchEnd);

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [ref]);
}
