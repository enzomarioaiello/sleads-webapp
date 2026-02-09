import React from 'react';
import { motion } from 'framer-motion';
import { Section } from './ui/Section';
import { Box, Layers, Zap } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const SaasPreview: React.FC = () => {
  const { t } = useApp();

  return (
    <Section id="platform" className="py-32 relative overflow-hidden">
        {/* Background Grid - Increased visibility */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-block mb-6 px-4 py-1.5 rounded-full border border-sleads-blue/30 bg-sleads-blue/10 backdrop-blur-sm"
            >
                <span className="text-sleads-blue font-mono text-sm tracking-wider">{t('saas.badge')}</span>
            </motion.div>
            
            <motion.h2 
                className="font-heading text-4xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-white"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                {/* Updated gradient to use blue tones only */}
                {t('saas.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-sleads-blue to-blue-400">{t('saas.title_accent')}</span>
            </motion.h2>
            
            <motion.p 
                className="text-xl text-slate-600 dark:text-sleads-slate300 mb-12 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
            >
                {t('saas.desc')}
            </motion.p>
        </div>

        {/* Modular Cubes Animation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative z-10">
            {[
                // Changed from Aqua to Blue
                { icon: <Box className="text-sleads-blue" />, title: t('saas.feat1_title'), desc: t('saas.feat1_desc') },
                { icon: <Layers className="text-sleads-blue" />, title: t('saas.feat2_title'), desc: t('saas.feat2_desc') },
                { icon: <Zap className="text-sleads-blue" />, title: t('saas.feat3_title'), desc: t('saas.feat3_desc') }
            ].map((feature, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (i * 0.1) }}
                    viewport={{ once: true }}
                    className="p-6 rounded-2xl bg-white dark:bg-sleads-slate900/40 border border-slate-200 dark:border-sleads-slate700 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-sleads-slate900/60 transition-colors shadow-sm dark:shadow-none"
                >
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-sleads-midnight border border-slate-200 dark:border-sleads-slate700 flex items-center justify-center mb-4">
                        {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-500 dark:text-sleads-slate500">{feature.desc}</p>
                </motion.div>
            ))}
        </div>

        <motion.div 
            className="mt-12 text-center relative z-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
        >
            <button className="px-8 py-3 bg-sleads-blue hover:bg-sleads-blue/90 text-white rounded-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-sleads-blue/25">
                {t('saas.cta')}
            </button>
        </motion.div>
    </Section>
  );
};