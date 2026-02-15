import pricingData from '@data/pricing.json';

function FAQSection() {
  const { faqs } = pricingData;

  return (
    <section className="py-24 bg-blueGray-950/20">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-20">
          <h2 className="font-heading text-7xl lg:text-8xl text-white tracking-tighter">
            FAQ
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {faqs.map((faq, index) => (
            <div key={index} className="p-8">
              <div className="mb-8">
                <h3 className="mb-4 text-2xl text-white font-medium">
                  {faq.question}
                </h3>
                <p className="text-gray-300">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
