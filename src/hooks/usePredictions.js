// src/hooks/usePredictions.js
// Manages prediction market state and logic

import { useState, useEffect, useCallback } from 'react';

export function usePredictions() {
    const [currentSOLPrice, setCurrentSOLPrice] = useState(0);
    const [previousSOLPrice, setPreviousSOLPrice] = useState(0);
    const [priceDirection, setPriceDirection] = useState(null);
    const [dailyPrediction, setDailyPrediction] = useState(null);
    const [predictionHistory, setPredictionHistory] = useState([]);
    const [timeUntilNextPrediction, setTimeUntilNextPrediction] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');

    // Fetch SOL price from CoinGecko
    const fetchSOLPrice = useCallback(async () => {
        try {
            const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true'
            );
            const data = await response.json();
            const price = data?.solana?.usd || 0;
            const change24h = data?.solana?.usd_24h_change || 0;

            setPreviousSOLPrice(currentSOLPrice || price);
            setCurrentSOLPrice(price);
            setPriceDirection(change24h > 0 ? 'up' : 'down');

            return price;
        } catch (error) {
            console.error('Failed to fetch SOL price:', error);
            return 0;
        }
    }, [currentSOLPrice]);

    // Make a prediction
    const makePrediction = useCallback((direction, currentPrice) => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const prediction = {
            date: now.toISOString(),
            prediction: direction,
            targetPrice: currentPrice,
            expiresAt: tomorrow.toISOString(),
            result: null
        };

        setDailyPrediction(prediction);
        setTimeUntilNextPrediction(tomorrow.getTime());

        return prediction;
    }, []);

    // Check prediction result
    const checkPredictionResult = useCallback((prediction, newPrice) => {
        if (!prediction || prediction.result) return null;

        const priceChange = newPrice - prediction.targetPrice;
        const wasCorrect =
            (prediction.prediction === 'up' && priceChange > 0) ||
            (prediction.prediction === 'down' && priceChange < 0);

        const result = {
            ...prediction,
            result: wasCorrect ? 'correct' : 'wrong',
            actualPrice: newPrice,
            priceChange
        };

        setDailyPrediction(result);
        setPredictionHistory(prev => [...prev, result]);

        return result;
    }, []);

    // Update timer
    useEffect(() => {
        if (!timeUntilNextPrediction) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = timeUntilNextPrediction - now;

            if (diff <= 0) {
                setTimeLeft('Ready!');
                setTimeUntilNextPrediction(null);
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeUntilNextPrediction]);

    return {
        currentSOLPrice,
        previousSOLPrice,
        priceDirection,
        dailyPrediction,
        predictionHistory,
        timeLeft,
        fetchSOLPrice,
        makePrediction,
        checkPredictionResult
    };
}
