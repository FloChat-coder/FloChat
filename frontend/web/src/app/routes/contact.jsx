import PageLayout from '@components/layout/page-layout';
import ContactFormSection from '@features/contact/components/contact-form-section';

function ContactPage() {
  return (
    <PageLayout title="Contact - FloChat">
      <ContactFormSection />
    </PageLayout>
  );
}

export default ContactPage;