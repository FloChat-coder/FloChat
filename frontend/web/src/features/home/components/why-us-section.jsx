import featuresData from '@data/features.json';
import ScrollReveal from '@components/common/scroll'; // Let's reuse our animation!

function WhyUsSection() {
  // 1. Safety Check: Ensure data exists
  if (!featuresData || !featuresData.features) {
    return null;
  }

  // 2. Use the correct key: 'features' instead of 'whyUsCards'
  const cards = featuresData.features; 

  return (
    <section className="pt-20 pb-24 bg-blueGray-950/10">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <ScrollReveal>
            <span className="inline-block mb-4 text-sm text-green-400 font-medium tracking-tighter">
              Why FloChat?
            </span>
            <h2 className="font-heading mb-6 text-5xl lg:text-6xl text-white tracking-tighter mx-auto">
              Simplicity is our Superpower
            </h2>
            <p className="mb-8 text-gray-300 max-w-xl mx-auto text-lg">
              Most AI tools are too complicated. We built FloChat for people who just want it to work.
            </p>
          </ScrollReveal>
        </div>

        <div className="flex flex-wrap -m-4 justify-center">
          {cards.map((card, index) => (
            <div key={index} className="w-full md:w-1/3 p-4">
              <ScrollReveal delay={index * 0.1}>
                <div className="h-full p-8 bg-gray-900/40 border border-gray-800 rounded-3xl hover:border-green-400/50 transition duration-300">
                  {/* Icon */}
                  <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-400/10 text-green-400">
                    <img src={card.icon} alt="" className="w-6 h-6 invert" style={{ filter: 'brightness(0) saturate(100%) invert(81%) sepia(34%) saturate(693%) hue-rotate(204deg) brightness(102%) contrast(101%)' }} /> 
                    {/* Note: I added a filter to make black icons purple/white if needed, or just use the img src directly if your icons are colored */}
                  </div>
                  
                  {/* Title */}
                  <h3 className="mb-3 text-2xl font-bold text-white tracking-tight">
                    {card.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </ScrollReveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyUsSection;