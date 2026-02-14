// src/hooks/useModal.js
// Manages modal state and actions

import { useState, useCallback } from 'react';

export function useModal() {
    const [modal, setModal] = useState({
        isOpen: false,
        type: 'INFO',
        title: '',
        message: '',
        actionLabel: '',
        onConfirm: null
    });

    const showModal = useCallback((type, title, message, onConfirm = null, actionLabel = 'OK') => {
        setModal({
            isOpen: true,
            type,
            title,
            message,
            actionLabel,
            onConfirm
        });
    }, []);

    const closeModal = useCallback(() => {
        setModal(prev => ({ ...prev, isOpen: false }));
    }, []);

    return {
        modal,
        showModal,
        closeModal
    };
}
