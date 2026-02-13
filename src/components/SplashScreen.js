import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

export default function SplashScreen() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 2500); // 2.5s splash
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99999, // Topmost
                        background: '#000',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'monospace'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
                    >
                        <div style={{ position: 'relative' }}>
                            <img src="/icon.jpg" alt="Dust Demons" style={{ width: '80px', height: '80px', borderRadius: '50%', boxShadow: '0 0 20px #00ff41' }} />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{ position: 'absolute', top: -10, right: -10 }}
                            >
                                <img src="/demon-logo.jpg" alt="Demon" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                            </motion.div>
                        </div>

                        <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', letterSpacing: '4px', textAlign: 'center' }}>
                            DUST DEMONS
                        </h1>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                            <span style={{ color: '#666', fontSize: '12px' }}>POWERED BY</span>
                            <span style={{ color: '#00c2ff', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                JUPITER MOBILE <img src="/demon-logo.jpg" alt="Demon" style={{ width: '14px', height: '14px', borderRadius: '50%' }} />
                            </span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '200px' }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        style={{ height: '2px', background: 'linear-gradient(90deg, #00ff41, #00c2ff)', marginTop: '40px' }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
