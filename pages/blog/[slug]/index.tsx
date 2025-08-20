import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { getAllPosts, getPostBySlug, Post } from '@/lib/posts';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts();
  return {
    paths: posts.map((p) => ({ params: { slug: p.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = String(params?.slug || '');
  const post = await getPostBySlug(slug);
  return { props: { post } };
};

export default function BlogPost({ post }: { post: Post }) {
  return (
    <>
      <Head>
        <title>{post.title} | ZwiedzajChytrze</title>
        <meta name="description" content={post.description || ''} />
      </Head>
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <article>
          <h1 className="text-3xl font-bold">{post.title}</h1>
          <div className="mt-2 text-sm opacity-60">{new Date(post.date).toLocaleDateString('pl-PL')}</div>
          <div className="prose prose-neutral mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
        </article>
      </main>
    </>
  );
}
