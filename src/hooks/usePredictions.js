// src/hooks/usePredictions.js
// Manages prediction market state and logic

import { useState, useEffect, useCallback } from 'react';
import { getSOLPrice } from '@/services/jupiter';
import { sendJupiterNotification } from '@/utils/jupiter-mobile';

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
            const { price, direction } = await getSOLPrice();

            setPreviousSOLPrice(currentSOLPrice || price);
            setCurrentSOLPrice(price);
            setPriceDirection(direction);

            return price;
        } catch (error) {
            console.error('Failed to fetch SOL price:', error);
            return currentSOLPrice || 0;
        }
    }, [currentSOLPrice]);

    // Make a prediction (5-minute round)
    const makePrediction = useCallback((direction, currentPrice) => {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

        const prediction = {
            date: now.toISOString(),
            prediction: direction,
            targetPrice: currentPrice,
            startPrice: currentPrice, // UI expects startPrice
            expiresAt: expiresAt.toISOString(),
            result: null
        };

        setDailyPrediction(prediction);
        setTimeUntilNextPrediction(expiresAt.getTime());

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

        setDailyPrediction(null); // Clear active prediction
        setPredictionHistory(prev => [result, ...prev]);

        // 🔔 Send Jupiter Mobile Notification
        if (wasCorrect) {
            sendJupiterNotification(
                'Prophecy Fulfiiled! 🔮',
                `You won! SOL moved ${priceChange > 0 ? 'UP' : 'DOWN'} to $${newPrice.toFixed(2)}`
            );
        } else {
            sendJupiterNotification(
                'Prophecy Failed 💀',
                `You lost. SOL moved ${priceChange > 0 ? 'UP' : 'DOWN'} to $${newPrice.toFixed(2)}`
            );
        }

        return result;
    }, []);

    // Update timer & check result
    useEffect(() => {
        if (!timeUntilNextPrediction || !dailyPrediction) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = timeUntilNextPrediction - now;

            if (diff <= 0) {
                // Round ended! Check result if we have current price
                if (currentSOLPrice > 0) {
                    checkPredictionResult(dailyPrediction, currentSOLPrice);
                }
                setTimeLeft('Round Ended!');
                setTimeUntilNextPrediction(null);
                return;
            }

            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeUntilNextPrediction, dailyPrediction, currentSOLPrice, checkPredictionResult]);

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
