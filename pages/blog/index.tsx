import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import { getAllPosts, PostMeta } from '@/lib/posts';
import PostCard from '@/components/PostCard';

export const getStaticProps: GetStaticProps = async () => {
  const posts = getAllPosts();
  return { props: { posts } };
};

export default function BlogIndex({ posts }: { posts: PostMeta[] }) {
  return (
    <>
      <Head>
        <title>Blog | ZwiedzajChytrze</title>
        <meta name="description" content="Poradniki podróżnicze, city break, tanie loty." />
      </Head>
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <h1 className="text-3xl font-bold">Blog</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {posts.map((p) => <PostCard key={p.slug} post={p} />)}
        </div>
        {posts.length === 0 && (
          <p className="opacity-70">Brak wpisów. Dodaj pliki .mdx do <code>content/blog</code>.</p>
        )}
        <div className="mt-10">
          <Link className="underline" href="/">← Wróć na stronę główną</Link>
        </div>
      </main>
    </>
  );
}
