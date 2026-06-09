import { client } from "@/sanity/client";
import { postBySlugQuery, allPostsQuery } from "@/sanity/queries";
import { PortableText } from "@portabletext/react";
import imageUrlBuilder from "@sanity/image-url";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 60;

const builder = imageUrlBuilder(client);
function urlFor(source: object) {
  return builder.image(source).url();
}

const categoryLabels: Record<string, string> = {
  design: "Design",
  marketing: "Marketing Digital",
  trafego: "Tráfego Pago",
  social: "Social Media",
  negocios: "Negócios",
  dicas: "Dicas",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export async function generateStaticParams() {
  try {
    const posts = await client.fetch(allPostsQuery);
    return posts.map((p: { slug: { current: string } }) => ({ slug: p.slug.current }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await client.fetch(postBySlugQuery, { slug });
  if (!post) return { title: "Post não encontrado" };
  return {
    title: `${post.title} — Blog BBold`,
    description: post.excerpt,
  };
}

const ptComponents = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-black/70 leading-relaxed mb-5">{children}</p>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="font-display text-[2rem] tracking-wide text-black mt-10 mb-4">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="font-display text-[1.5rem] tracking-wide text-black mt-8 mb-3">{children}</h3>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-yellow pl-5 py-2 my-6 text-black/60 italic">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="text-black font-bold">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="text-yellow not-italic font-semibold">{children}</em>
    ),
    link: ({ value, children }: { value?: { href: string }; children?: React.ReactNode }) => (
      <a href={value?.href} target="_blank" rel="noreferrer" className="text-yellow underline underline-offset-2 hover:opacity-75 transition-opacity">
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }: { value: { asset: object; alt?: string; caption?: string } }) => (
      <figure className="my-8">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
          <Image src={urlFor(value.asset)} alt={value.alt || ""} fill className="object-cover" />
        </div>
        {value.caption && (
          <figcaption className="text-center text-sm text-black/35 mt-2">{value.caption}</figcaption>
        )}
      </figure>
    ),
  },
};

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await client.fetch(postBySlugQuery, { slug });
  if (!post) notFound();

  return (
    <main className="pt-28 pb-24 px-10">
      <div className="max-w-[720px] mx-auto">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-black/40 hover:text-yellow transition-colors mb-10">
          ← Voltar para o blog
        </Link>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {post.category && (
            <span className="text-[0.7rem] font-bold tracking-widest uppercase bg-yellow text-black px-2.5 py-1 rounded-sm">
              {categoryLabels[post.category] || post.category}
            </span>
          )}
          {post.publishedAt && <span className="text-sm text-black/35">{formatDate(post.publishedAt)}</span>}
          {post.readTime && <span className="text-sm text-black/35">{post.readTime} min de leitura</span>}
        </div>
        <h1 className="font-display text-[clamp(2.2rem,6vw,3.8rem)] leading-[1.05] tracking-wide text-black mb-6">{post.title}</h1>
        {post.excerpt && (
          <p className="text-lg text-black/55 leading-relaxed mb-8 border-l-4 border-yellow pl-5">{post.excerpt}</p>
        )}
        {post.coverImage && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-10">
            <Image src={urlFor(post.coverImage)} alt={post.title} fill className="object-cover" priority />
          </div>
        )}
        <article>
          {post.body && <PortableText value={post.body} components={ptComponents} />}
        </article>
        <div className="mt-16 p-8 bg-yellow rounded-lg text-center">
          <h3 className="font-display text-[1.8rem] text-black tracking-wide mb-2">Gostou deste conteúdo?</h3>
          <p className="text-black/65 mb-6">Vamos conversar sobre como aplicar isso no seu negócio.</p>
          <Link href="/#contato" className="inline-flex items-center gap-2 bg-black text-yellow font-bold text-sm tracking-widest uppercase px-8 py-3.5 rounded-sm hover:bg-black-mid transition-all">
            Fale com a BBold →
          </Link>
        </div>
      </div>
    </main>
  );
}
