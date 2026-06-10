import { LandingFeatures } from '../components/marketing/LandingFeatures';
import { LandingFinalCta } from '../components/marketing/LandingFinalCta';
import { LandingHero } from '../components/marketing/LandingHero';
import { LandingSecurityTeaser } from '../components/marketing/LandingSecurityTeaser';
import { LandingShowcase } from '../components/marketing/LandingShowcase';
import { LandingSocialProof } from '../components/marketing/LandingSocialProof';
import { LandingStats } from '../components/marketing/LandingStats';
import { LandingWorkflow } from '../components/marketing/LandingWorkflow';
import { MarketingShell } from '../components/MarketingShell';

export function LandingPage() {
  return (
    <MarketingShell title="DialyRounds — Dialysis rounds made simple">
      <LandingHero />
      <LandingSocialProof />
      <LandingStats />
      <LandingFeatures />
      <LandingWorkflow />
      <LandingShowcase />
      <LandingSecurityTeaser />
      <LandingFinalCta />
    </MarketingShell>
  );
}
