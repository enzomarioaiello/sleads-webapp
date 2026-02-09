
import React from 'react';
import { Hero } from './Hero';
import { Timeline } from './Timeline';
import { Services } from './Services';
import { Dashboard } from './Dashboard';
import { SaasPreview } from './SaasPreview';
import { Portfolio } from './Portfolio';
import { Values } from './Values';

export const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <Timeline />
      <Services />
      <Dashboard />
      <SaasPreview />
      <Portfolio />
      <Values />
    </>
  );
};
