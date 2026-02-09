import React from 'react';
import { Section } from './ui/Section';
import { ShieldCheck, Lightbulb, Feather, Users } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const Values: React.FC = () => {
  const { t } = useApp();

  const values = [
      { icon: <ShieldCheck />, title: t('values.v1_title'), desc: t('values.v1_desc') },
      { icon: <Lightbulb />, title: t('values.v2_title'), desc: t('values.v2_desc') },
      { icon: <Feather />, title: t('values.v3_title'), desc: t('values.v3_desc') },
      { icon: <Users />, title: t('values.v4_title'), desc: t('values.v4_desc') }
  ];

  return (
    <Section className="py-20 border-t border-slate-200 dark:border-sleads-slate900 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
                <div key={i} className="flex flex-col items-start p-6 rounded-xl hover:bg-slate-100 dark:hover:bg-sleads-slate900/30 transition-colors">
                    <div className="p-3 bg-white dark:bg-sleads-slate900 rounded-lg text-sleads-blue dark:text-sleads-white mb-4 border border-slate-200 dark:border-sleads-slate700 shadow-sm dark:shadow-none">
                        {v.icon}
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{v.title}</h4>
                    <p className="text-slate-600 dark:text-sleads-slate500 text-sm">{v.desc}</p>
                </div>
            ))}
        </div>
    </Section>
  );
};