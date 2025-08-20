import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

export type PostMeta = {
  title: string;
  description?: string;
  date: string;
  cover?: string;
  tags?: string[];
  slug: string;
  readingTime?: string;
};

export type Post = PostMeta & {
  contentHtml: string;
};

const postsDirectory = path.join(process.cwd(), 'content', 'blog');

export function getPostSlugs(): string[] {
  try {
    return fs.readdirSync(postsDirectory).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
  } catch {
    return [];
  }
}

export function getAllPosts(): PostMeta[] {
  const slugs = getPostSlugs();
  const posts = slugs.map((file) => {
    const fullPath = path.join(postsDirectory, file);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);
    const slug = file.replace(/\.(md|mdx)$/i, '');
    const meta: PostMeta = {
      title: data.title || slug,
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      cover: data.cover || '',
      tags: data.tags || [],
      slug,
      readingTime: data.readingTime || '',
    };
    return meta;
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const mdFile = fs.existsSync(path.join(postsDirectory, slug + '.mdx'))
    ? path.join(postsDirectory, slug + '.mdx')
    : path.join(postsDirectory, slug + '.md');
  if (!fs.existsSync(mdFile)) return null;
  const fileContents = fs.readFileSync(mdFile, 'utf8');
  const { data, content } = matter(fileContents);

  const processed = await remark().use(html).process(content);
  const contentHtml = processed.toString();

  const post: Post = {
    title: data.title || slug,
    description: data.description || '',
    date: data.date || new Date().toISOString(),
    cover: data.cover || '',
    tags: data.tags || [],
    slug,
    readingTime: data.readingTime || '',
    contentHtml,
  };

  return post;
}
