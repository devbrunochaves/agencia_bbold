import { client } from "@/sanity/client";
import { allPostsQuery } from "@/sanity/queries";
import Image from "next/image";
import Link from "next/link";
import imageUrlBuilder from "@sanity/image-url";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Agência BBold",
  description: "Dicas de design, marketing digital, tráfego pago e muito mais.",
};

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

export default async function BlogPage() {
  const posts = await client.fetch(allPostsQuery);

  return (
    <main className="pt-28 pb-24 px-10 max-w-site mx-auto">
      {/* Header */}
      <div className="mb-16">
        <span className="section-tag">Blog BBold</span>
        <h1 className="section-title mt-2">
          Conteúdo que<br /><em>educa</em> e inspira
        </h1>
        <p className="text-offwhite/55 max-w-xl leading-relaxed">
          Design, marketing digital, tráfego pago e posicionamento de marca —
          tudo que você precisa saber para crescer no digital.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-24 border border-offwhite/[0.06] rounded-lg">
          <p className="font-display text-[2rem] text-offwhite/30 tracking-wide mb-3">
            EM BREVE
          </p>
          <p className="text-offwhite/40 text-sm">
            Os primeiros artigos estão chegando. Volte em breve!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: {
            _id: string;
            slug: { current: string };
            coverImage?: object;
            category?: string;
            title: string;
            excerpt?: string;
            publishedAt?: string;
            readTime?: number;
          }) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug.current}`}
              className="group bg-black-light border border-offwhite/[0.07] rounded-lg overflow-hidden hover:border-yellow/30 transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              {/* Cover */}
              <div className="aspect-video bg-black-mid overflow-hidden relative">
                {post.coverImage ? (
                  <Image
                    src={urlFor(post.coverImage)}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-[3rem] text-yellow/20 tracking-widest">
                      BBOLD
                    </span>
                  </div>
                )}
                {post.category && (
                  <span className="absolute top-3 left-3 text-[0.7rem] font-bold tracking-widest uppercase bg-yellow text-black px-2.5 py-1 rounded-sm">
                    {categoryLabels[post.category] || post.category}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <h2 className="font-display text-[1.4rem] tracking-wide text-offwhite mb-3 group-hover:text-yellow transition-colors leading-tight">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-offwhite/50 leading-relaxed mb-4 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between text-[0.75rem] text-offwhite/30 mt-auto pt-4 border-t border-offwhite/[0.06]">
                  {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
                  {post.readTime && <span>{post.readTime} min de leitura</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
