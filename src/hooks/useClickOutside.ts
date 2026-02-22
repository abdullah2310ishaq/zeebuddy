import { useEffect, RefObject } from 'react';

/**
 * Custom hook to handle clicks outside of a referenced element
 */
export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T | null>,
    handler: () => void
) {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                handler();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref, handler]);
}
