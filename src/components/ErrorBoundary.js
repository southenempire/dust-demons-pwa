// src/components/ErrorBoundary.js
'use client';

import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: '#050505',
                    color: '#e0e0e0',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>💀</div>
                    <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '12px', color: '#ff0055' }}>
                        CRITICAL ERROR
                    </h1>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', maxWidth: '400px' }}>
                        {this.state.error?.message || 'Something went wrong. The demons have escaped.'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            background: '#00ff41',
                            color: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)'
                        }}
                    >
                        RELOAD APP
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
