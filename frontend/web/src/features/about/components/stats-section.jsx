import aboutData from '@data/about.json';

function StatsSection() {
  if (!aboutData) {
    return null;
  }

  const stats = aboutData.stats;

  return (
    <section className="py-16 overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="text-center">
          <span className="inline-block mb-8 text-sm text-green-400 font-medium tracking-tighter">Check our stats</span>
          <div className="flex flex-wrap -m-11">
            {stats.map((stat, index) => (
              <div key={index} className="w-full md:w-1/2 lg:w-1/4 p-11">
                <div className="text-center">
                  <h3 className="mb-1.5 text-7xl text-white tracking-4xl">{stat.value}</h3>
                  <p className="text-gray-300">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default StatsSection;