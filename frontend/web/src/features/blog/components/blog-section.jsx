import { Link } from 'react-router-dom';
import blogData from '@data/blog.json';

function BlogSection() {
  const { blogPosts, featuredPost } = blogData;

  const BlogCard = ({ post, featured = false }) => (
    <article className={`w-full ${featured ? 'lg:w-2/3' : 'md:w-1/2 lg:w-1/3'} p-4`}>
      <div className="h-full bg-gradient-radial-dark border border-gray-900/30 rounded-5xl overflow-hidden">
        <div className="mb-6 overflow-hidden">
          <img className={`w-full ${featured ? 'h-80' : 'h-64'} object-cover transform hover:scale-105 transition duration-500`} src={post.image} alt={post.title} />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-center mb-4">
            <span className="text-sm text-green-400 font-medium">{post.category}</span>
            <span className="mx-2 text-gray-500">•</span>
            <span className="text-sm text-gray-300">{post.readTime}</span>
            {featured && <span className="ml-2 px-2 py-1 bg-green-400 text-black text-xs font-medium rounded-full">Featured</span>}
          </div>
          <h3 className={`mb-4 ${featured ? 'text-3xl' : 'text-2xl'} text-white font-medium hover:text-green-400 transition duration-200`}>
            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
          </h3>
          <p className="mb-6 text-gray-300">{post.excerpt}</p>
          <div className="flex flex-wrap -m-1">
            {post.tags.map((tag, index) => (
              <div key={index} className="w-auto p-1">
                <span className="inline-block px-3 py-1 text-xs text-gray-300 bg-gray-800 border border-gray-700 rounded-full">
                  {tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );

  return (
    <section className="pt-20 lg:pt-24 pb-24">
      <div className="container px-4 mx-auto">
        <header className="text-center mb-20">
          <h1 className="font-heading text-7xl lg:text-8xl text-white tracking-tighter">
            Blog
          </h1>
        </header>

        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-16">
            <h2 className="text-3xl text-white font-bold mb-8 text-center">Featured Article</h2>
            <div className="flex flex-wrap -m-4 justify-center">
              <BlogCard post={featuredPost} featured={true} />
            </div>
          </div>
        )}

        {/* Regular Posts */}
        <div className="mb-8">
          <h2 className="text-2xl text-white font-bold mb-8">Latest Articles</h2>
          <div className="flex flex-wrap -m-4">
            {blogPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default BlogSection;