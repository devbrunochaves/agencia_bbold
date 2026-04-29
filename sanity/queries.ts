import { groq } from "next-sanity";

export const allPostsQuery = groq`
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    category,
    publishedAt,
    readTime,
    coverImage
  }
`;

export const postBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    category,
    publishedAt,
    readTime,
    coverImage,
    body
  }
`;

export const recentPostsQuery = groq`
  *[_type == "post"] | order(publishedAt desc)[0...3] {
    _id,
    title,
    slug,
    excerpt,
    category,
    publishedAt,
    readTime,
    coverImage
  }
`;
