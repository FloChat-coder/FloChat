import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input, Button, Card } from '@components/ui';
import authData from '@data/auth.json';

/**
 * Authentication section for login/register
 */
function AuthSection({ type = 'login' }) {
  const data = authData[type];
  
  // State for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' }); // type: 'success' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // 1. Determine endpoint based on type (login or register)
      const endpoint = type === 'register' 
        ? 'https://flochat-ocya.onrender.com/api/register' 
        : 'https://flochat-ocya.onrender.com/api/login';

      // 2. Send data to your Python Backend
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Something went wrong');

      // 3. Handle Success
      if (type === 'register') {
        setStatus({ 
          type: 'success', 
          message: 'Account created! Please check your email to verify your account.' 
        });
        setEmail('');
        setPassword('');
      } else {
        // Handle Login Success (e.g., save token, redirect)
        window.location.href = '/dashboard'; 
      }

    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="pt-20 lg:pt-24 pb-24">
      <div className="container px-4 mx-auto">
        <div className="flex flex-wrap items-center -m-8">
          <div className="w-full lg:w-1/2 p-8">
            <Card>
              <div className="mb-8 text-center">
                <h1 className="mb-4 text-4xl text-white font-heading tracking-tighter">
                  {data.title}
                </h1>
                <p className="text-gray-300">{data.subtitle}</p>
              </div>

              {/* Status Messages */}
              {status.message && (
                <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
                  status.type === 'success' ? 'bg-green-400/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {status.message}
                </div>
              )}

              {/* Social Login Buttons (Google) */}
              <div className="mb-8 grid space-y-3">
                {data.socialProviders.map((provider, index) => (
                  <a
                    key={index}
                    href={provider.url} // Now uses the URL from JSON
                    className="w-full px-6 py-4 text-white bg-gray-900/30 hover:bg-gray-900/10 rounded-full transition duration-300 flex items-center justify-center gap-3 font-medium"
                  >
                    <img
                      className="w-5 h-5"
                      src={provider.icon}
                      alt={provider.name}
                    />
                    <span>
                      {provider.text || `Sign in with ${provider.name}`}
                    </span>
                  </a>
                ))}
              </div>

              {/* Divider */}
              <div className="mb-8 flex items-center">
                <div className="flex-1 h-px bg-gray-800"></div>
                <span className="px-4 text-gray-400 text-sm">
                  {data.dividerText || 'or sign in with email'}
                </span>
                <div className="flex-1 h-px bg-gray-800"></div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmit}>
                <fieldset className="border-none p-0 m-0" disabled={loading}>
                  <div className="mb-6">
                    <Input 
                      type="email" 
                      placeholder="Email address" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="mb-6">
                    <Input 
                      type="password" 
                      placeholder="Password" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Processing...' : (data.buttonText || 'Sign In')}
                  </Button>
                </fieldset>
              </form>

              {/* Footer Links */}
              {type === 'register' && (
                <div className="mt-6 text-center text-sm">
                  <span className="text-gray-400">{data.footerText} </span>
                  <Link
                    to="/login"
                    className="text-green-400 hover:text-green-300"
                  >
                    {data.linkText}
                  </Link>
                </div>
              )}
              {type === 'login' && (
                <div className="mt-6 text-center text-sm">
                  <span className="text-gray-400">Don't have an account? </span>
                  <Link
                    to="/register"
                    className="text-green-400 hover:text-green-300"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </Card>
          </div>

          {/* Trusted By Section (Unchanged) */}
          <div className="w-full lg:w-1/2 p-8">
            <div className="text-center">
              <h2 className="mb-8 text-2xl text-white font-medium">
                Trusted by
              </h2>
              <div className="flex flex-wrap justify-center items-center -m-4">
                {data.trustedCompanies?.map((company, index) => (
                  <div key={index} className="w-auto p-4">
                    <img
                      className="h-8 opacity-70 hover:opacity-100 transition duration-300"
                      src={company.logo}
                      alt={company.name}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AuthSection;