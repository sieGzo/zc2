import Link from 'next/link';
import type { PostMeta } from '@/lib/posts';

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="rounded-2xl border p-4 hover:shadow-md transition">
      <h3 className="text-lg font-semibold">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>
      {post.description && <p className="mt-1 text-sm opacity-80">{post.description}</p>}
      <div className="mt-2 text-xs opacity-60">{new Date(post.date).toLocaleDateString('pl-PL')}</div>
    </article>
  );
}
