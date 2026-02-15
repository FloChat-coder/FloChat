import pricingData from '@data/pricing.json';
import PricingCard from './pricing-card';

function PricingSection() {
  if (!pricingData) {
    return null;
  }

  const { plans, pricing } = pricingData;

  return (
    <section className="pt-20 lg:pt-24 pb-24 bg-body">
      <div className="container px-4 mx-auto">
        <div className="mb-20 md:max-w-3xl text-center mx-auto">
          <span className="inline-block mb-4 text-sm text-green-400 font-medium tracking-tighter">
            Lifetime Deals
          </span>
          <h2 className="font-heading mb-8 text-5xl lg:text-7xl text-white tracking-tighter">
            {pricing.title}
          </h2>
          <p className="mb-12 text-gray-300 text-lg mx-auto">
            {pricing.subtitle}
          </p>
        </div>

        {/* Updated Grid for 5 Cards */}
        <div className="flex flex-wrap justify-center -m-4">
          {plans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default PricingSection;