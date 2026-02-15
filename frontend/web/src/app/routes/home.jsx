import PageLayout from '@components/layout/page-layout';
import HeroSection from '@features/home/components/hero-section';
import WhyUsSection from '@features/home/components/why-us-section';
import FeaturesSection from '@features/home/components/features-section';
import SecureAccessSection from '@features/home/components/secure-access-section';
import TestimonialsSection from '@features/home/components/testimonials-section';


function HomePage() {
  return (
    <PageLayout title="FloChat Home">
      <HeroSection />
      <WhyUsSection />
      <FeaturesSection />
      <SecureAccessSection />
      <TestimonialsSection />
    </PageLayout>
  );
}

export default HomePage;
