import React, { useState } from 'react';
import featuresData from '@data/features.json';

function BillingInfrastructureSection() {
  const [activeTab, setActiveTab] = useState('introduction');

  if (!featuresData) {
    return null;
  }

  const tabs = featuresData.billingTabs;

  return (
    <section className="py-24">
      <div className="container px-4 mx-auto">
        <div className="mb-20 text-center">
          <span className="inline-block mb-4 text-sm text-green-400 font-medium tracking-tighter">
            More about our features
          </span>
          <h2 className="font-heading text-6xl lg:text-7xl text-white tracking-tighter-xl md:max-w-3xl mx-auto">
            Billing infrastructure that keeps up with your business
          </h2>
        </div>
        <div className="flex flex-wrap justify-center -m-3 mb-12">
          {tabs.map((tab) => (
            <div key={tab.id} className="w-auto p-3">
              <button
                className={`inline-block px-6 py-3 text-sm font-medium tracking-tighter rounded-full transition duration-300 ${
                  activeTab === tab.id
                    ? 'bg-green-400 text-black'
                    : 'text-white hover:text-green-400 border border-gray-800 hover:border-green-400'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </div>
          ))}
        </div>
        <div className="text-center">
          <img
            className="mx-auto"
            src={tabs.find((tab) => tab.id === activeTab)?.image}
            alt=""
          />
        </div>
      </div>
    </section>
  );
}

export default BillingInfrastructureSection;
