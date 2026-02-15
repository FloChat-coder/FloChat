import PageLayout from '@components/layout/page-layout';

const PrivacyPage = () => {
  return (
    <PageLayout title="Privacy Policy - FloChat">
      <section className="py-20 bg-body">
        <div className="container px-4 mx-auto text-gray-300">
          <h1 className="text-4xl text-white font-bold mb-8">Privacy Policy</h1>
          <div className="prose prose-invert max-w-none">
            <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <h3 className="text-xl text-white mt-6 mb-2">1. Information We Collect</h3>
            <p>We collect information you provide directly to us when you use FloChat, including your Google Sheet data and email address for account management.</p>
            <h3 className="text-xl text-white mt-6 mb-2">2. How We Use Your Data</h3>
            <p>We use your data strictly to power your chatbots. We do not sell your data to third parties. Your Google Sheets are accessed only when your chatbot needs to answer a query.</p>
            <h3 className="text-xl text-white mt-6 mb-2">3. Google User Data</h3>
            <p>FloChat's use and transfer to any other app of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-green-400">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
export default PrivacyPage;