import PageLayout from '@components/layout/page-layout';
import AboutHeroSection from '@features/about/components/about-hero-section';
import StatsSection from '@features/about/components/stats-section';
import CompanyStorySection from '@features/about/components/company-story-section';
import TeamSection from '@features/about/components/team-section';
import OpenPositionsSection from '@features/about/components/open-positions-section';

function AboutPage() {
  return (
    <PageLayout title="About Us - FloChat">
      <AboutHeroSection />
      <StatsSection />
      <CompanyStorySection />
      <TeamSection />
      <OpenPositionsSection />
    </PageLayout>
  );
}

export default AboutPage;