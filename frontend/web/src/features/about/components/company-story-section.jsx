function CompanyStorySection() {
  return (
    <section className="py-20 overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="flex flex-wrap items-center -m-8">
          <div className="w-full md:w-1/2 p-8">
            <div className="md:max-w-md">
              <span className="inline-block mb-4 text-sm text-green-400 font-medium tracking-tighter">Check our stats</span>
              <h2 className="font-heading mb-8 text-6xl md:text-7xl text-white tracking-tighter-xl">Making credit history with nightcard</h2>
              <p className="mb-8 text-lg text-gray-300">It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text.</p>
              <a className="inline-block text-white hover:text-opacity-80 font-medium underline transition duration-500" href="#">Read more</a>
            </div>
          </div>
          <div className="w-full md:w-1/2 p-8">
            <div className="mx-auto max-w-lg md:mr-0">
              <div className="flex flex-wrap -m-4">
                <div className="w-1/2 p-4">
                  <div className="flex flex-wrap">
                    <div className="mb-8 w-full">
                      <img className="w-full" src="/images/img2.png" alt="" />
                    </div>
                    <div className="w-full">
                      <img className="w-full" src="/images/img4.png" alt="" />
                    </div>
                  </div>
                </div>
                <div className="w-1/2 p-4">
                  <div className="flex flex-wrap mt-24">
                    <div className="mb-8 w-full">
                      <img className="w-full" src="/images/img3.png" alt="" />
                    </div>
                    <div className="w-full">
                      <img className="w-full" src="/images/img.png" alt="" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CompanyStorySection;