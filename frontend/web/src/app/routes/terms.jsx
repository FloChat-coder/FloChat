import PageLayout from '@components/layout/page-layout';

const TermsPage = () => {
  return (
    <PageLayout title="Terms of Service - FloChat">
      <section className="py-20 bg-body">
        <div className="container px-4 mx-auto text-gray-300">
          <h1 className="text-4xl text-white font-bold mb-8">Terms of Service</h1>
          <div className="prose prose-invert max-w-none">
             <p>By accessing FloChat, you agree to be bound by these Terms of Service.</p>
             <h3 className="text-xl text-white mt-6 mb-2">1. Usage License</h3>
             <p>FloChat grants you a revocable, non-exclusive, non-transferable license to use the chatbot widget on your websites.</p>
             <h3 className="text-xl text-white mt-6 mb-2">2. Disclaimer</h3>
             <p>The materials on FloChat are provided "as is". We make no warranties regarding the accuracy of AI-generated responses.</p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
export default TermsPage;