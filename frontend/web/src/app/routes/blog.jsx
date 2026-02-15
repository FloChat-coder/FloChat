import PageLayout from '@components/layout/page-layout';
import BlogSection from '@features/blog/components/blog-section';

function BlogPage() {
  return (
    <PageLayout title="Blog - FloChat">
      <BlogSection />
    </PageLayout>
  );
}

export default BlogPage;