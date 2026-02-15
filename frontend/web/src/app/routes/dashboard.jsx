import PageLayout from '@components/layout/page-layout';

const DashboardPage = () => {
  return (
    <PageLayout title="Dashboard - FloChat">
      <section className="py-20 bg-body min-h-screen">
        <div className="container px-4 mx-auto">
          <h1 className="text-4xl text-white font-bold mb-8">My Chatbots</h1>
          <div className="p-8 border border-dashed border-gray-700 rounded-2xl text-center">
            <p className="text-gray-400 mb-4">You haven't created any chatbots yet.</p>
            <button className="px-6 py-3 bg-green-400 text-white font-bold rounded-full hover:bg-green-500 transition">
              + Create New Chatbot
            </button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};
export default DashboardPage;