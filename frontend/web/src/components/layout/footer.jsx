import { Link } from 'react-router-dom';
import { getRouteByName } from '@app/router';

/**
 * Main site footer with links and branding
 */
function Footer() {
  return (
    <>
      {/* DELETED: "Learn to Code" CTA Section was here */}

      <footer className="bg-gray-50 overflow-hidden">
        <div className="py-14 bg-black rounded-b-7xl"></div>
        <div className="py-24">
          <div className="container px-4 mx-auto">
            <div className="flex flex-wrap justify-center -m-8 mb-28">
              <div className="w-full md:w-1/2 lg:w-4/12 p-8">
                <div className="md:max-w-xs">
                  {/* Ensure logo points to correct location if needed */}
                  <img className="mb-7" src="/images/logo-dark.svg" alt="" />
                  <p className="text-gray-400 font-medium">
                    FloChat is the fastest way to turn your Google Sheets into AI Chatbots.
                  </p>
                </div>
              </div>
              <div className="w-full md:w-1/2 lg:w-2/12 p-8">
                <h3 className="mb-6 text-lg text-black font-medium">Product</h3>
                <ul>
                  <li className="mb-2.5">
                    <Link
                      className="inline-block text-lg font-medium text-gray-400 hover:text-black transition duration-300"
                      to="/pricing"
                    >
                      Pricing
                    </Link>
                  </li>
                  <li className="mb-2.5">
                    <Link
                      className="inline-block text-lg font-medium text-gray-400 hover:text-black transition duration-300"
                      to="/demo"
                    >
                      Live Demo
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="w-full md:w-1/2 lg:w-2/12 p-8">
                <h3 className="mb-6 text-lg text-black font-medium">Support</h3>
                <ul>
                  <li className="mb-2.5">
                    <Link
                      className="inline-block text-lg font-medium text-gray-400 hover:text-black transition duration-300"
                      to={getRouteByName('contact')}
                    >
                      Contact
                    </Link>
                  </li>
                  <li className="mb-2.5">
                    <Link
                      className="inline-block text-lg font-medium text-gray-400 hover:text-black transition duration-300"
                      to="/terms"
                    >
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="w-full md:w-1/2 lg:flex-1 p-8">
                <div className="flex flex-wrap -m-2">
                  <div className="w-full p-2">
                    <a className="block py-5 px-8 bg-white rounded-full hover:shadow-lg transition duration-200" href="#">
                      <div className="flex flex-wrap items-center -m-2">
                        <div className="w-auto p-2">
                          <img src="/images/footers/twitter.svg" alt="" />
                        </div>
                        <div className="flex-1 p-2">
                          <p className="text-black font-medium">Follow us on Twitter</p>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-between -m-2">
              <div className="w-auto p-2">
                <p className="inline-block text-sm font-medium text-black/60">© {new Date().getFullYear()} FloChat. All rights reserved.</p>
              </div>
              <div className="w-auto p-2">
                <div className="flex flex-wrap items-center -m-2 sm:-m-7">
                  <div className="w-auto p-2 sm:p-7">
                    <Link className="inline-block text-sm text-black/60 hover:text-black font-medium transition duration-300" to="/terms">
                      Terms of Use
                    </Link>
                  </div>
                  <div className="w-auto p-2 sm:p-7">
                    <Link className="inline-block text-sm text-black/60 hover:text-black font-medium transition duration-300" to="/privacy">
                      Privacy Policy
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;