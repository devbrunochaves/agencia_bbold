import Link from "next/link";
import Image from "next/image";
import { client } from "@/sanity/client";
import { latestPostsQuery } from "@/sanity/queries";
import imageUrlBuilder from "@sanity/image-url";

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
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

type Post = {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  category?: string;
  publishedAt?: string;
  readTime?: number;
  coverImage?: object;
};

export default async function BlogPreview() {
  const posts: Post[] = await client.fetch(latestPostsQuery).catch(() => []);

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#f0e8d8] border-y border-black/[0.05] py-24 px-10">
      <div className="max-w-site mx-auto">
        <div className="text-center mb-14 reveal">
          <span className="section-tag">Do Blog</span>
          <h2 className="section-title mt-2">
            Conteúdo que <em>gera valor</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug.current}`}
              className="group bg-[#ede6d6] rounded-lg overflow-hidden border border-black/5 hover:border-yellow/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] flex flex-col"
            >
              {/* Cover image */}
              <div className="relative w-full overflow-hidden bg-[#d8cfbf]" style={{ aspectRatio: "16/9" }}>
                {post.coverImage ? (
                  <Image
                    src={urlFor(post.coverImage)}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-[2.5rem] text-yellow/20 tracking-widest">BBOLD</span>
                  </div>
                )}
                {post.category && (
                  <span className="absolute top-2.5 left-2.5 text-[0.65rem] font-bold tracking-widest uppercase bg-yellow text-black px-2 py-0.5 rounded-sm">
                    {categoryLabels[post.category] || post.category}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-black text-[1.05rem] leading-snug mb-2 group-hover:text-yellow transition-colors line-clamp-2">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-black/60 leading-relaxed line-clamp-2 flex-1 mb-4">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-black/[0.06]">
                  {post.publishedAt && (
                    <span className="text-[0.72rem] text-black/40">
                      {formatDate(post.publishedAt)}
                    </span>
                  )}
                  <span className="text-[0.75rem] font-bold text-yellow tracking-wide">
                    Ler artigo →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center reveal">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 border border-black/20 text-black font-bold text-sm tracking-widest uppercase px-8 py-3.5 rounded-sm hover:border-yellow hover:text-yellow transition-all hover:-translate-y-0.5"
          >
            Ver todos os artigos →
          </Link>
        </div>
      </div>
    </section>
  );
}
