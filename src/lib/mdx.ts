import { compileMDX as compileMDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import matter from 'gray-matter';
import * as React from 'react';

export interface FrontMatter {
  title: string;
  excerpt?: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  authorId?: string;
  status?: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  scheduledAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  tags?: string[];
  category?: 'care-guide' | 'styling-tips' | 'trends' | 'lookbook' | 'news';
  readTimeMinutes?: number;
  isFeatured?: boolean;
  description?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  roomType?: 'living-room' | 'bedroom' | 'dining-room' | 'office' | 'outdoor';
  styleTags?: string[];
  featuredProducts?: string[];
  hotspots?: Array<{
    productId: string;
    x: number;
    y: number;
    label: string;
    tooltip: string;
  }>;
}

export interface CompiledMDX {
  content: React.ReactNode;
  frontMatter: FrontMatter;
}

function createComponent(tag: string, className: string): React.ComponentType<React.HTMLAttributes<HTMLElement>> {
  return (props) => React.createElement(tag, { className, ...props });
}

const components: Record<string, React.ComponentType<React.HTMLAttributes<HTMLElement>>> = {
  h1: (props) => React.createElement('h1', { className: 'heading-1 text-gray-900 mb-6 mt-10', ...props }),
  h2: (props) => React.createElement('h2', { className: 'heading-2 text-gray-900 mb-4 mt-10', ...props }),
  h3: (props) => React.createElement('h3', { className: 'heading-3 text-gray-900 mb-3 mt-8', ...props }),
  h4: (props) => React.createElement('h4', { className: 'heading-4 text-gray-900 mb-2 mt-6', ...props }),
  p: (props) => React.createElement('p', { className: 'body text-gray-700 mb-4 leading-relaxed', ...props }),
  ul: (props) => React.createElement('ul', { className: 'list-disc list-inside mb-4 space-y-2 text-gray-700', ...props }),
  ol: (props) => React.createElement('ol', { className: 'list-decimal list-inside mb-4 space-y-2 text-gray-700', ...props }),
  li: (props) => React.createElement('li', { className: 'ml-4', ...props }),
  blockquote: (props) => React.createElement('blockquote', { className: 'border-l-4 border-amber-500 pl-6 italic text-gray-600 my-6', ...props }),
  a: (props) => React.createElement('a', { className: 'text-amber-700 hover:text-amber-900 underline', ...props }),
  strong: (props) => React.createElement('strong', { className: 'font-semibold text-gray-900', ...props }),
  em: (props) => React.createElement('em', { className: 'italic', ...props }),
  code: (props) => React.createElement('code', { className: 'bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-amber-800', ...props }),
  pre: (props) => React.createElement('pre', { className: 'bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4', ...props }),
  img: (props) => React.createElement('img', { className: 'w-full h-auto rounded-xl my-6', loading: 'lazy', ...props }),
  hr: (props) => React.createElement('hr', { className: 'border-gray-200 my-8', ...props }),
  table: (props) => React.createElement('div', { className: 'overflow-x-auto my-6' }, React.createElement('table', { className: 'w-full border-collapse', ...props })),
  th: (props) => React.createElement('th', { className: 'border border-gray-200 px-4 py-2 bg-gray-50 font-semibold text-left', ...props }),
  td: (props) => React.createElement('td', { className: 'border border-gray-200 px-4 py-2', ...props }),
};

export async function compileMDX(source: string): Promise<{ content: React.ReactElement; frontMatter: any }> {
  const { data: frontMatter, content } = matter(source);

  const compiled = await compileMDXRemote({
    source: content,
    components,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        ],
      },
    },
  });

  return {
    content: compiled.content,
    frontMatter: frontMatter as any,
  };
}

export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}