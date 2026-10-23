/** Public reads. Every statement filters to published rows and omits enquiry fields. */

export const PUBLIC_VEHICLE_LIST_SQL = `
select id, slug, title, summary, category, seats, model_year, transmission, fuel,
       daily_rate_minor, currency_code, availability, availability_note
from vehicle
where status = 'published'
order by title asc
limit 100
`;

export const PUBLIC_VEHICLE_BY_SLUG_SQL = `
select id, slug, title, summary, description, category, seats, model_year, transmission, fuel,
       daily_rate_minor, currency_code, availability, availability_note
from vehicle
where status = 'published' and slug = $1
limit 1
`;

export const PUBLIC_VEHICLE_IMAGES_SQL = `
select storage_key, alt, sort_order
from vehicle_image
where vehicle_id = $1
order by sort_order asc, created_at asc
`;

export const PUBLIC_FAQ_SQL = `
select question, answer
from faq
where status = 'published'
order by sort_order asc, question asc
limit 100
`;

export const PUBLIC_TESTIMONIAL_SQL = `
select author_name, quote, attribution
from testimonial
where status = 'published'
order by sort_order asc, created_at desc
limit 100
`;

export const PUBLIC_POST_LIST_SQL = `
select slug, title, excerpt, published_at
from blog_post
where status = 'published'
order by published_at desc nulls last, title asc
limit 100
`;

export const PUBLIC_POST_BY_SLUG_SQL = `
select slug, title, excerpt, body_markdown, meta_title, meta_description, published_at
from blog_post
where status = 'published' and slug = $1
limit 1
`;

export const PUBLIC_SITEMAP_VEHICLES_SQL = `
select slug, updated_at
from vehicle
where status = 'published'
order by slug asc
`;

export const PUBLIC_SITEMAP_POSTS_SQL = `
select slug, updated_at
from blog_post
where status = 'published'
order by slug asc
`;

export const PUBLIC_SETTINGS_SQL = `
select key, value
from site_setting
where key in (
  'whatsapp_e164',
  'public_email',
  'public_phone',
  'address',
  'instagram_url',
  'facebook_url',
  'x_url',
  'youtube_url'
)
`;
