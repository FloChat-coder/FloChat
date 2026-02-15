import React, { useState } from 'react';
import testimonialsData from '@data/testimonials.json';

function TestimonialsSection() {
  const [showContent, setShowContent] = useState(false);

  if (!testimonialsData) {
    return null;
  }

  const initialTestimonials = testimonialsData.initialTestimonials;
  const hiddenTestimonials = testimonialsData.hiddenTestimonials;

  const HeartIcon = () => (
    <svg
      className="mr-2.5"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M8.41398 13.8731C8.18732 13.9531 7.81398 13.9531 7.58732 13.8731C5.65398 13.2131 1.33398 10.4597 1.33398 5.79307C1.33398 3.73307 2.99398 2.06641 5.04065 2.06641C6.25398 2.06641 7.32732 2.65307 8.00065 3.55974C8.67398 2.65307 9.75398 2.06641 10.9607 2.06641C13.0073 2.06641 14.6673 3.73307 14.6673 5.79307C14.6673 10.4597 10.3473 13.2131 8.41398 13.8731Z"
        stroke="#9F9FA0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const CommentIcon = () => (
    <svg
      className="mr-2.5"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.247 8.07345C12.8137 10.7001 10.8604 12.7201 8.24702 13.2135C6.81369 13.4868 5.45368 13.2735 4.28035 12.7201C4.08701 12.6268 3.77367 12.5868 3.56701 12.6335C3.12701 12.7401 2.38703 12.9201 1.76037 13.0668C1.16037 13.2135 0.78704 12.8401 0.933706 12.2401L1.36702 10.4401C1.42035 10.2335 1.37368 9.91345 1.28035 9.72012C0.747012 8.60012 0.533693 7.30012 0.753693 5.93345C1.18036 3.30678 3.30037 1.18012 5.92703 0.746784C10.2604 0.0467841 13.9537 3.74012 13.247 8.07345Z"
        stroke="#9F9FA0"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const TestimonialCard = ({ testimonial }) => (
    <div className="px-6 py-8 border border-gray-800 rounded-5xl">
      <div className="flex flex-wrap items-center -m-3 mb-3">
        <div className="w-auto p-3">
          <img
            className="w-12 h-12 rounded-full object-cover"
            src={testimonial.avatar}
            alt=""
          />
        </div>
        <div className="w-auto p-3">
          <h2 className="text-2xl text-white">{testimonial.name}</h2>
          <p className="text-sm text-gray-300">{testimonial.username}</p>
        </div>
      </div>
      <p className="mb-4 text-white">{testimonial.content}</p>
      {testimonial.extraContent &&
        testimonial.extraContent.map((content, index) => (
          <p key={index} className="mb-4 text-white">
            {content}
          </p>
        ))}
      <div className="flex flex-wrap items-center -m-2.5 mb-1.5">
        <div className="w-auto p-2.5">
          <p className="text-sm text-gray-300">{testimonial.time}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center -m-2.5">
        <div className="flex flex-wrap items-center w-auto p-2.5">
          <HeartIcon />
          <p className="text-sm text-gray-300">{testimonial.likes}</p>
        </div>
        <div className="flex flex-wrap items-center w-auto p-2.5">
          <CommentIcon />
          <p className="text-sm text-gray-300">{testimonial.comments}</p>
        </div>
      </div>
    </div>
  );

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="text-center">
          <span className="inline-block mb-4 text-sm text-green-400 font-medium tracking-tighter">
            24/7 Security
          </span>
          <h2 className="font-heading mb-6 text-6xl lg:text-7xl text-white tracking-8xl md:max-w-md mx-auto">
            Protecting you and your money
          </h2>
          <p className="mb-20 text-gray-300 md:max-w-md mx-auto">
            Global Bank is a strategic branding agency focused on brand
            creation, rebrands, and brand
          </p>
        </div>
        <div className="flex flex-wrap -m-3">
          {['column1', 'column2', 'column3', 'column4'].map((columnKey) => (
            <div key={columnKey} className="w-full md:w-1/2 lg:w-1/4 p-3">
              <div className="flex flex-wrap -m-3">
                {initialTestimonials[columnKey]?.map((testimonial) => (
                  <div key={testimonial.id} className="w-full p-3">
                    <TestimonialCard testimonial={testimonial} />
                  </div>
                ))}
                {showContent &&
                  hiddenTestimonials[columnKey]?.map((testimonial) => (
                    <div key={testimonial.id} className="w-full p-3">
                      <TestimonialCard testimonial={testimonial} />
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div
          className="absolute bottom-0 left-0 z-10 py-32 lg:py-64 flex items-center justify-center w-full bg-gradient-radial-darker3"
          style={{ display: showContent ? 'none' : 'flex' }}
        >
          <button
            className="inline-block px-8 py-4 font-medium tracking-tighter bg-green-400 hover:bg-green-500 text-black focus:ring-4 focus:ring-green-500/40 rounded-full transition duration-300"
            onClick={() => setShowContent(true)}
          >
            Show more
          </button>
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
