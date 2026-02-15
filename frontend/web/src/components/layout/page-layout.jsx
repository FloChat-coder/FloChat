import React, { useEffect } from 'react';
import Header from './header';
import Footer from './footer';


/**
 * Main page layout component with header, footer, and optional top bar
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} [props.title] - Page title for document.title
 * @param {boolean} [props.showTopBar=true] - Whether to show top bar
 * @param {string} [props.className=''] - Additional CSS classes
 */
function PageLayout({ children, title, showTopBar = true, className = '' }) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  return (
    <div className={`antialiased bg-body text-body font-body ${className}`}>
      <div className="relative">
        <img
          className="absolute -top-20 -left-20 z-0 pointer-events-none"
          src="/images/layer-blur.svg"
          alt=""
        />
        
        <Header />
        <main>
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default PageLayout;
