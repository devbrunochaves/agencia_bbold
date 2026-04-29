import { defineField, defineType } from "sanity";

export const post = defineType({
  name: "post",
  title: "Post do Blog",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Resumo",
      type: "text",
      rows: 3,
      validation: (r) => r.required().max(200),
    }),
    defineField({
      name: "coverImage",
      title: "Imagem de capa",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "category",
      title: "Categoria",
      type: "string",
      options: {
        list: [
          { title: "Design", value: "design" },
          { title: "Marketing Digital", value: "marketing" },
          { title: "Tráfego Pago", value: "trafego" },
          { title: "Social Media", value: "social" },
          { title: "Negócios", value: "negocios" },
          { title: "Dicas", value: "dicas" },
        ],
      },
    }),
    defineField({
      name: "publishedAt",
      title: "Data de publicação",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "readTime",
      title: "Tempo de leitura (minutos)",
      type: "number",
    }),
    defineField({
      name: "body",
      title: "Conteúdo",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Texto alternativo", type: "string" }),
            defineField({ name: "caption", title: "Legenda", type: "string" }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: { title: "title", media: "coverImage", subtitle: "category" },
  },
  orderings: [
    { title: "Mais recente", name: "publishedAtDesc", by: [{ field: "publishedAt", direction: "desc" }] },
  ],
});
