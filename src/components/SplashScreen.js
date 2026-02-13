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
                        <img src="/icon.jpg" alt="Dust Demons" style={{ width: '80px', height: '80px', borderRadius: '50%', boxShadow: '0 0 20px #00ff41' }} />


                        <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', letterSpacing: '4px', textAlign: 'center' }}>
                            DUST DEMONS
                        </h1>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '25px' }}>
                            <span style={{ color: '#666', fontSize: '12px', letterSpacing: '1px' }}>POWERED BY</span>
                            <span style={{ color: '#00c2ff', fontWeight: '900', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                JUPITER MOBILE <img src="/demon-logo.jpg" alt="Demon" style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid #00c2ff' }} />
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
            )
            }
        </AnimatePresence >
    );
}
