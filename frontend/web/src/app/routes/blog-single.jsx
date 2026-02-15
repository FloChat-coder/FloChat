import { useParams, Link } from 'react-router-dom';
import PageLayout from '@components/layout/page-layout';
import blogData from '@data/blog.json';

function BlogSinglePage() {
  const { slug } = useParams();

  // Find the blog post by slug
  const post = [...blogData.blogPosts, blogData.featuredPost].find(p => p.slug === slug);

  if (!post) {
    return (
      <PageLayout title="Blog Post Not Found - FloChat" showBanner={false}>
        <section className="pt-20 lg:pt-24 pb-24">
          <div className="container px-4 mx-auto">
            <div className="text-center">
              <h1 className="font-heading text-7xl lg:text-8xl text-white tracking-tighter mb-8">
                Post Not Found
              </h1>
              <p className="text-white text-lg mb-8">The blog post you're looking for doesn't exist.</p>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-8 py-4 text-white hover:text-black font-medium tracking-tighter hover:bg-green-400 border-2 border-white focus:border-green-400/40 hover:border-green-400 focus:ring-4 focus:ring-green-400/40 rounded-full transition duration-300"
              >
                ← Back to Blog
              </Link>
            </div>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`${post.title} - FloChat`} showBanner={false}>
      {/* Hero Section */}
      <section className="pt-20 lg:pt-24 pb-16">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-white/60 mb-8">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>→</span>
              <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
              <span>→</span>
              <span className="text-white">{post.title}</span>
            </nav>

            {/* Category Badge */}
            <div className="inline-block px-4 py-2 bg-green-400/20 text-green-400 text-sm font-medium rounded-full mb-6">
              {post.category}
            </div>

            {/* Title */}
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-white tracking-tighter mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center gap-6 text-white/60 mb-8">
              <div className="flex items-center gap-3">
                <img
                  src="/images/author-avatar.png"
                  alt="Author"
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='%23059669'%3E%3Ccircle cx='20' cy='20' r='20'/%3E%3Ctext x='20' y='28' text-anchor='middle' fill='white' font-size='14' font-family='Arial'%3E%3C/text%3E%3C/svg%3E";
                  }}
                />
                <span>{post.author || 'FloChat Team'}</span>
              </div>
              <span>•</span>
              <span>{post.date}</span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>

            {/* Excerpt */}
            <p className="text-white/80 text-xl leading-relaxed">
              {post.excerpt}
            </p>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="pb-16">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-96 md:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="pb-20">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto">
            <article className="prose prose-lg prose-invert max-w-none">
              <div className="text-white/80 text-lg leading-relaxed space-y-6">
                <p>
                  {post.content?.intro || `Welcome to this comprehensive guide where we dive deep into the topic of ${post.title.toLowerCase()}. In today's fast-paced banking environment, understanding these concepts is crucial for success.`}
                </p>

                <p>
                  {post.excerpt} This article will provide you with actionable insights and practical strategies
                  that you can implement immediately in your financial management.
                </p>

                <h2 className="text-white text-3xl font-bold mt-12 mb-6">Key Takeaways</h2>

                <ul className="space-y-3 text-white/80">
                  {post.content?.keyTakeaways?.map((takeaway, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-3 flex-shrink-0"></div>
                      <span>{takeaway}</span>
                    </li>
                  )) || (
                    <>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-3 flex-shrink-0"></div>
                        <span>Understanding the fundamentals is essential for long-term success</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-3 flex-shrink-0"></div>
                        <span>Implementation of best practices can significantly improve your outcomes</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-3 flex-shrink-0"></div>
                        <span>Regular monitoring and adjustment are key to maintaining effectiveness</span>
                      </li>
                    </>
                  )}
                </ul>

                {post.content?.sections?.map((section, index) => (
                  <div key={index}>
                    <h2 className="text-white text-3xl font-bold mt-12 mb-6">{section.title}</h2>
                    <p>{section.content}</p>
                  </div>
                )) || (
                  <>
                    <h2 className="text-white text-3xl font-bold mt-12 mb-6">Getting Started</h2>
                    <p>
                      The first step in mastering any new concept is to understand its core principles.
                      Whether you're dealing with financial planning, business strategy, or operational efficiency,
                      the same fundamental approach applies: assess, plan, execute, and monitor.
                    </p>
                  </>
                )}

                {post.content?.proTip && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 my-8">
                    <h3 className="text-green-400 text-xl font-semibold mb-4">💡 Pro Tip</h3>
                    <p className="text-white/80 mb-0">
                      {post.content.proTip}
                    </p>
                  </div>
                )}

                <h2 className="text-white text-3xl font-bold mt-12 mb-6">Conclusion</h2>

                <p>
                  {post.content?.conclusion || `Mastering ${post.title.toLowerCase()} requires dedication, proper planning, and consistent execution. By following the strategies outlined in this guide, you'll be well-equipped to achieve your goals and drive meaningful results for your financial future.`}
                </p>

                <p>
                  Remember that success is a journey, not a destination. Continue learning, adapting, and refining
                  your approach based on new insights and changing circumstances.
                </p>
              </div>
            </article>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-green-400/10 to-blue-500/10 border border-green-400/20 rounded-2xl p-8 mt-16">
              <div className="text-center">
                <h3 className="text-white text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-white/80 mb-6">
                  Join thousands of customers who trust FloChat for their financial management needs.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-green-400 text-black px-8 py-4 rounded-full font-medium hover:bg-green-500 transition-colors duration-200"
                >
                  Open Your Account
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </div>

            {/* Back to Blog */}
            <div className="text-center mt-16">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-medium transition-colors duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to All Posts
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

export default BlogSinglePage;