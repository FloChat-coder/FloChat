import ScrollReveal from '@components/common/scroll';

function FeaturesSection() {
  const steps = [
    {
      number: "01",
      title: "Connect your Sheet",
      description: "Simply paste your Google Sheet URL. We automatically read your Questions and Answers columns.",
      color: "text-green-400",
      borderColor: "border-green-400/30"
    },
    {
      number: "02",
      title: "Customize the Look",
      description: "Match your brand colors, give your bot a name, and choose a welcome message.",
      color: "text-purple-400",
      borderColor: "border-purple-400/30"
    },
    {
      number: "03",
      title: "Embed Anywhere",
      description: "Copy one line of code and paste it into your website, Wordpress, or Shopify store.",
      color: "text-blue-400",
      borderColor: "border-blue-400/30"
    }
  ];

  return (
    <section className="relative py-24 overflow-hidden bg-body">
      <div className="container px-4 mx-auto">
        
        {/* Section Header */}
        <div className="mb-20 md:max-w-2xl text-center mx-auto">
          <ScrollReveal>
            <span className="inline-block mb-4 text-sm text-green-400 font-medium tracking-tighter border border-green-400/30 px-3 py-1 rounded-full bg-green-400/10">
              How it Works
            </span>
            <h2 className="font-heading text-5xl lg:text-6xl text-white tracking-tighter">
              From Spreadsheet to Chatbot in <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">Minutes</span>
            </h2>
          </ScrollReveal>
        </div>

        {/* Steps Grid */}
        <div className="flex flex-wrap -m-4">
          {steps.map((step, index) => (
            <div key={index} className="w-full md:w-1/3 p-4">
              <ScrollReveal delay={index * 0.2}>
                <div className={`h-full p-8 bg-gray-900/40 border ${step.borderColor} rounded-3xl hover:bg-gray-900/60 transition duration-300 relative overflow-hidden group`}>
                  
                  {/* Big Number Background Effect */}
                  <span className={`absolute -right-4 -bottom-8 text-9xl font-bold opacity-5 ${step.color} group-hover:scale-110 transition duration-500 select-none`}>
                    {step.number}
                  </span>

                  {/* Content */}
                  <div className="relative z-10">
                    <span className={`inline-block mb-6 text-2xl font-bold ${step.color}`}>
                      {step.number}.
                    </span>
                    <h3 className="mb-4 text-3xl font-bold text-white tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-lg leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                </div>
              </ScrollReveal>
            </div>
          ))}
        </div>

      </div>
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-96 bg-green-500/10 blur-[100px] rounded-full pointer-events-none" />
    </section>
  );
}

export default FeaturesSection;