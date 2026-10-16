# Woosh Biz website — notes for Claude

Static site on GitHub Pages (wooshbiz.com, `CNAME`). Pushing `main` publishes it.

## GitHub account

- Repo: https://github.com/storm-costabir/wooshbiz. Commit and push only as **storm-costabir**,
  never colaborate2022-stack.
- Repo git identity: `Storm Costabir <247120577+storm-costabir@users.noreply.github.com>`.
  Check `git config user.email` before committing.
- A push refused with "denied to colaborate2022-stack" means the old login came back:
  `git credential-manager github logout colaborate2022-stack`, then push and have the
  user sign in as storm-costabir.

## Publishing a new blog post

**Before building a new post, ask the user which template it should use.** Do not pick one.

| Template | `layout` value | What it looks like | First used |
|---|---|---|---|
| Rich Article (standard) | `standard` | Plum hero with blurred cover wash, share rail, sticky contents sidebar, drop cap | most posts |
| Editorial Magazine | `editorial` | Plum hero with the cover photo beside the headline (shown at its real size, never stretched), one centred column, italic lead, big stat, numbered idea cards on a tinted full-width band, pull quote, "No…" points in a row, plum closing band with orange button | no post at present (tried on post 49, which went back to standard) |

Editorial is `assets/blog-editorial.css`; its header comment lists the body blocks
(`ed-lead`, `ed-stat`, `ed-band`, `ed-cards`, `ed-quote`, `ed-nos`, `ed-cta`, `ed-btn`).
Worked example: the `#artBody` of `git show 60d313f:return-to-office-engagement-ideas/index.html`
(post 49 while it was Editorial). A new template = a new sheet
plus an entry in `LAYOUT_SHEETS` in `tools/build-post.js`, and a row in the table above.

The flow:

1. The brief is a public Google Doc: fetch `…/document/d/<id>/export?format=txt`. Images come as
   a local folder of 626x440 Canva PNGs. Check the images' baked-in titles match the text.
2. Copy images to `images/blog/<slug>/`; `cover.png` = the hero image with only the Canva
   title band cut off (find where the photo starts; keep every head in frame). Never stretch a
   626px image across a full-width area: it blurs.
3. Write the row to `wooshbiz_blogs` (Supabase project `ytthcgdsbfagvwcopoaj`) through the REST
   API with the anon key from `blog.html`, as `admin.html` does. The Supabase MCP connector
   cannot see this project. Fields: title, slug, category, author (`Andrea Costabir`),
   cover_image, `layout`, `redirect_url: "/<slug>/"`, is_published, body. The brief's meta
   description is the body's first `<p>`.
4. Brief's title tag → `tools/seo-titles.json` keyed by post id (the H1 keeps the headline).
5. `node tools/build-post.js` (all posts — related-post cards on older posts change), then add the
   page to `sitemap.xml` and bump `lastmod` on the posts whose cards changed.
6. `node tools/build-post.js --check`, `node tools/check-schema.js`, `node tools/sync-partials.js --check`.
   A DRIFT that `git diff --ignore-cr-at-eol` shows as empty is line endings only; restore it.
7. Commit, push, then confirm the page, its images and the sitemap entry on wooshbiz.com.

`build-post.js` refuses unpublished posts. If a post must stay hidden until a push lands,
publish it for the build and hide it again.

Contact address: the site uses team@hti-india.com. A brief may name another address for its
own post (post 49 uses dominic@hti-india.com at the user's request); keep that to the post.
