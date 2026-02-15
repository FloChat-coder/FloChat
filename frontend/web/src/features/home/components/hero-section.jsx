import { Link } from 'react-router-dom';
import ScrollReveal from '@components/common/scroll';

function HeroSection() {
  return (
    // Added 'z-0' to section to establish stacking context
    <section className="relative pt-32 lg:pt-40 overflow-hidden z-0">
      
      {/* --- BACKGROUND PATTERN (MORPH EFFECT) --- */}
      
      {/* Layer 1: Base Pattern */}
      <div className="absolute inset-0 mix-blend-screen opacity-20 pointer-events-none z-0">
        <img
          className="w-full h-full object-cover animate-drift-1"
          src="/images/topography.svg"
          alt=""
        />
      </div>

      {/* Layer 2: Interference Pattern (Creates the Morph) */}
      <div className="absolute inset-0 mix-blend-screen opacity-10 pointer-events-none z-0">
        <img
          className="w-full h-full object-cover animate-drift-2"
          src="/images/topography.svg"
          alt=""
        />
      </div>

      <div className="relative z-10 container px-4 mx-auto">
        <div className="relative mb-24 text-center md:max-w-5xl mx-auto">
          
          {/* --- 5 BOUNCING STARS (FIXED POSITIONS) --- */}
          
          {/* Star 1: Top Left (Far) */}
          <img className="absolute top-44 -left-36 animate-bounce duration-[2000ms]" src="/images/star2.svg" alt="" />
          
          {/* Star 2: Top Right (Far) */}
          <img className="absolute top-10 -right-36 animate-bounce duration-[2500ms]" src="/images/star2.svg" alt="" />
          
          {/* Star 3: Bottom Left */}
          <img className="absolute bottom-20 left-10 w-8 animate-bounce duration-[3000ms]" src="/images/star2.svg" alt="" />
          
          {/* Star 4: Middle Right */}
          <img className="absolute top-1/2 right-10 w-6 animate-bounce duration-[1500ms]" src="/images/star2.svg" alt="" />
          
          {/* Star 5: MOVED! Was colliding at top-0 left-1/2. Now at top-0 left-[20%] */}
          <img className="absolute top-0 left-[20%] w-4 animate-bounce duration-[1800ms]" src="/images/star2.svg" alt="" />

          {/* --- CONTENT --- */}
          <ScrollReveal>
            <span className="relative z-20 inline-block mb-4 text-sm text-green-400 font-medium tracking-tighter border border-green-400/30 px-4 py-1 rounded-full bg-green-400/10 backdrop-blur-sm">
              🚀 AI Chatbots for AppSumo & Agencies
            </span>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <h1 className="font-heading mb-10 text-6xl lg:text-8xl text-white tracking-tighter">
              Turn your Google Sheet <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                into an AI Chatbot
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <p className="mb-10 text-xl text-gray-300 max-w-2xl mx-auto">
              No complex dashboards. No vector databases. Just update your Google Sheet, 
              and your bot updates instantly.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.6}>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                className="inline-block px-8 py-4 font-bold tracking-tighter bg-green-400 hover:bg-green-500 text-white rounded-full transition duration-300 transform hover:scale-105"
                to="/register"
              >
                Start for Free
              </Link>
              <Link
                className="inline-block px-8 py-4 font-bold tracking-tighter text-white border-2 border-gray-700 hover:border-white rounded-full transition duration-300"
                to="/demo"
              >
                View Live Demo
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* --- DASHBOARD IMAGE --- */}
        <ScrollReveal delay={0.8}>
          <div className="relative max-w-max mx-auto">
            <img 
              src="/images/dashboard.png" 
              alt="FloChat Dashboard" 
              className="w-full relative z-10 rounded-xl shadow-2xl" 
            />
            <img
              className="absolute top-7 -right-64 animate-bounce duration-[3000ms]"
              src="/images/star.svg"
              alt=""
            />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default HeroSection;