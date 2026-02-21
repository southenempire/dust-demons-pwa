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
                    justifyContent: 'flex-start',
                    minHeight: '100vh',
                    background: '#990000',
                    color: '#e0e0e0',
                    padding: '40px 20px',
                    textAlign: 'left',
                    fontFamily: 'monospace',
                    overflow: 'auto'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>💀 FATAL CRASH</div>
                    <p style={{ fontSize: '14px', color: '#fff', marginBottom: '20px' }}>
                        Please screenshot the text below and send it to the AI:
                    </p>
                    <div style={{ background: '#000', padding: '15px', borderRadius: '4px', width: '100%', wordBreak: 'break-word', marginBottom: '10px' }}>
                        <strong style={{ color: '#ff0055' }}>Error:</strong>
                        <br />
                        {this.state.error && this.state.error.toString()}
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '4px', width: '100%', wordBreak: 'break-word', fontSize: '10px', whiteSpace: 'pre-wrap' }}>
                        <strong style={{ color: '#00c2ff' }}>Component Stack:</strong>
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '30px',
                            padding: '12px 24px',
                            background: '#fff',
                            color: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '900',
                            cursor: 'pointer'
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
