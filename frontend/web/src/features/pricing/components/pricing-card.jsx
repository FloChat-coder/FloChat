import React from 'react';

const PricingCard = ({ plan }) => {
  const isEnterprise = plan.id === 'enterprise';
  const isFree = plan.id === 'free';
  
  return (
    // Wrapper: Matches the 5-column layout
    <div className="w-full md:w-1/2 lg:w-1/3 xl:w-1/5 p-3 min-w-[300px]">
      
      {/* CARD CONTAINER 
        - Restored: 'bg-gradient-radial-dark' (The premium dark gradient)
        - Restored: 'rounded-5xl' (The super round corners)
        - Restored: 'border-2 border-gray-900/30' (Subtle border)
        - Added: 'hover:-translate-y-2' (Floating effect)
      */}
      <div 
        className={`relative flex flex-col h-full px-8 pt-12 pb-12 overflow-hidden transition-transform duration-300 hover:-translate-y-2
        ${plan.popular 
          ? 'bg-gradient-radial-dark border-2 border-green-400 shadow-[0_0_40px_rgba(74,222,128,0.15)] rounded-5xl' 
          : 'bg-gradient-radial-dark border-2 border-gray-900/30 rounded-5xl'
        }`}
      >
        
        {/* POPULAR BADGE */}
        {plan.popular && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-green-400 text-black text-xs font-bold px-4 py-1 rounded-b-xl shadow-lg z-20">
            MOST POPULAR
          </div>
        )}

        <div className="relative z-10 mb-auto">
          {/* Title & Description */}
          <p className="mb-2 text-lg text-white font-light">{plan.name}</p>
          <p className="mb-8 text-gray-400 text-sm h-10 leading-relaxed">{plan.description}</p>

          {/* Price Tag */}
          <div className="mb-8">
            {isEnterprise ? (
              <span className="text-4xl text-white font-medium">Contact</span>
            ) : (
              <div className="flex items-baseline">
                <span className="text-5xl text-white font-medium tracking-tight">${plan.price}</span>
                {!isFree && <span className="ml-2 text-gray-400 text-sm font-medium">/ lifetime</span>}
              </div>
            )}
          </div>

          {/* "What's Included" Label */}
          <p className="mb-6 text-xs text-gray-500 font-bold uppercase tracking-widest">What's included</p>

          {/* Feature List (Check vs Strikethrough) */}
          <ul className="space-y-4 mb-10">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start">
                {/* Icon Wrapper */}
                <div className={`flex-shrink-0 w-5 h-5 mr-4 flex items-center justify-center rounded-full border 
                  ${feature.included 
                    ? 'border-green-400 bg-green-400/10 text-green-400' 
                    : 'border-gray-800 bg-transparent text-gray-700'
                  }`}
                >
                  {feature.included ? (
                    <img src="/images/check.svg" alt="Yes" className="w-3 h-3" />
                  ) : (
                    <span className="text-[10px] leading-none">✕</span>
                  )}
                </div>

                {/* Text Logic */}
                <span className={`text-sm leading-tight ${feature.included ? 'text-white' : 'text-gray-600 line-through decoration-gray-700'}`}>
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <div className="relative z-10 mt-auto">
          <a
            className={`block w-full px-8 py-4 text-center font-medium rounded-full transition duration-300 
              ${isEnterprise 
                ? 'bg-transparent border-2 border-gray-700 text-white hover:border-white' 
                : 'bg-green-400 text-black hover:bg-green-500 shadow-lg shadow-green-400/20'
              }`}
            href={plan.ctaLink}
          >
            {plan.ctaText}
          </a>
        </div>

        {/* --- THE RESTORED PREMIUM SHADOW --- */}
        <img 
          className="absolute bottom-0 right-0 pointer-events-none z-0 opacity-80" 
          src="/images/pricing-shadow.svg" 
          alt="" 
        />
      </div>
    </div>
  );
};

export default PricingCard;