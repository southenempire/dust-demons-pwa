// src/hooks/useTransactions.js
// Manages transaction state and history

import { useState, useCallback } from 'react';

export function useTransactions() {
    const [pendingTx, setPendingTx] = useState(null);
    const [sessionHistory, setSessionHistory] = useState([]);

    // Add transaction to history
    const addTransaction = useCallback((tx) => {
        const transaction = {
            ...tx,
            timestamp: Date.now(),
            id: `${tx.type}-${Date.now()}`
        };

        setSessionHistory(prev => [transaction, ...prev].slice(0, 50)); // Keep last 50
        return transaction;
    }, []);

    // Set pending transaction
    const setPending = useCallback((typeOrObj, message) => {
        if (typeOrObj === null) {
            setPendingTx(null);
        } else if (typeof typeOrObj === 'object') {
            setPendingTx(typeOrObj);
        } else {
            setPendingTx({ type: typeOrObj, message });
        }
    }, []);

    // Clear pending transaction
    const clearPending = useCallback(() => {
        setPendingTx(null);
    }, []);

    // Clear history
    const clearHistory = useCallback(() => {
        setSessionHistory([]);
    }, []);

    // Get transactions by type
    const getTransactionsByType = useCallback((type) => {
        return sessionHistory.filter(tx => tx.type === type);
    }, [sessionHistory]);

    return {
        pendingTx,
        sessionHistory,
        addTransaction,
        setPending,
        clearPending,
        clearHistory,
        getTransactionsByType
    };
}
