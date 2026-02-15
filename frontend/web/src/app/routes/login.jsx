import React from 'react';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-body">
      
      {/* --- Background Effects --- */}
      <img
        className="absolute top-0 left-0 w-full h-full object-cover opacity-20 mix-blend-screen pointer-events-none"
        src="/images/fingerprint.svg" 
        alt=""
      />
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-400/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-green-500/20 rounded-full blur-[100px]" />

      {/* --- The Login Card --- */}
      <div className="relative z-10 w-full max-w-md p-8 bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl">
        
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-block mb-4">
            <img src="/images/logo.svg" alt="FloChat" className="h-10 mx-auto" />
          </Link>
          <h2 className="text-3xl font-heading font-bold text-white tracking-tighter">
            Welcome Back
          </h2>
          <p className="mt-2 text-gray-400 text-sm">
            Manage your AI Chatbots from one place.
          </p>
        </div>

        {/* --- The Magic Button --- */}
        <div className="space-y-4">
          {/* CRITICAL: This uses a standard <a> tag, NOT <Link>.
             This forces the browser to hit your Python Backend at /login 
          */}
          <a
            href="https://flochat-ocya.onrender.com/login" // Triggers backend OAuth
            className="flex items-center justify-center w-full py-4 px-6 bg-white hover:bg-gray-50 text-black font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              className="w-6 h-6 mr-3" 
              alt="Google" 
            />
            Continue with Google
          </a>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase">or</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              By clicking continue, you agree to our{' '}
              <Link to="/terms" className="text-green-400 hover:text-green-300">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-green-400 hover:text-green-300">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;