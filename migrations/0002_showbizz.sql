-- Showbizz Cars application schema.
-- Availability is manually administered. Nothing in this schema syncs a live fleet.
-- No business rows are seeded: contact details, vehicles, prices, and posts
-- stay empty until a staff member writes them.
-- Applied files are immutable. Later changes belong in a new migration.

create table if not exists staff_member (
  user_id text primary key references "user" (id) on delete cascade,
  role text not null,
  granted_by text,
  created_at timestamptz not null default now(),
  constraint staff_member_role_chk check (role in ('admin', 'editor'))
);

create table if not exists vehicle (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text not null default '',
  description text not null default '',
  category text,
  seats integer,
  model_year integer,
  transmission text,
  fuel text,
  daily_rate_minor integer,
  currency_code text,
  availability text not null default 'unavailable',
  availability_note text not null default '',
  status text not null default 'draft',
  created_by text not null,
  updated_by text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicle_slug_chk check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  constraint vehicle_title_chk check (char_length(title) between 1 and 120),
  constraint vehicle_summary_chk check (char_length(summary) <= 300),
  constraint vehicle_description_chk check (char_length(description) <= 20000),
  constraint vehicle_category_chk check (category is null or char_length(category) between 1 and 40),
  constraint vehicle_seats_chk check (seats is null or (seats between 1 and 60)),
  constraint vehicle_year_chk check (model_year is null or (model_year between 1980 and 2100)),
  constraint vehicle_transmission_chk check (transmission is null or transmission in ('automatic', 'manual')),
  constraint vehicle_fuel_chk check (fuel is null or char_length(fuel) between 1 and 40),
  constraint vehicle_rate_chk check (daily_rate_minor is null or daily_rate_minor >= 0),
  constraint vehicle_currency_chk check (currency_code is null or currency_code ~ '^[A-Z]{3}$'),
  constraint vehicle_availability_chk check (availability in ('available', 'unavailable', 'on_request')),
  constraint vehicle_availability_note_chk check (char_length(availability_note) <= 300),
  constraint vehicle_status_chk check (status in ('draft', 'published', 'archived'))
);

create index if not exists vehicle_public_idx on vehicle (status, title);
create index if not exists vehicle_availability_idx on vehicle (availability) where status = 'published';

create table if not exists vehicle_image (
  id text primary key,
  vehicle_id text not null references vehicle (id) on delete cascade,
  storage_key text not null,
  alt text not null,
  sort_order integer not null default 0,
  content_type text not null,
  byte_size integer not null,
  created_at timestamptz not null default now(),
  constraint vehicle_image_key_chk check (char_length(storage_key) between 1 and 300),
  constraint vehicle_image_alt_chk check (char_length(alt) between 1 and 180),
  constraint vehicle_image_type_chk check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint vehicle_image_size_chk check (byte_size > 0 and byte_size <= 5000000)
);

create index if not exists vehicle_image_order_idx on vehicle_image (vehicle_id, sort_order);

create table if not exists enquiry (
  id text primary key,
  vehicle_id text references vehicle (id) on delete set null,
  contact_name text not null,
  phone text not null,
  email text,
  message text not null,
  start_on date,
  end_on date,
  status text not null default 'new',
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  handled_by text,
  constraint enquiry_name_chk check (char_length(contact_name) between 2 and 80),
  constraint enquiry_phone_chk check (phone ~ '^\+?[0-9]{8,15}$'),
  constraint enquiry_email_chk check (email is null or char_length(email) <= 120),
  constraint enquiry_message_chk check (char_length(message) between 10 and 2000),
  constraint enquiry_dates_chk check (start_on is null or end_on is null or end_on >= start_on),
  constraint enquiry_status_chk check (status in ('new', 'in_progress', 'closed'))
);

create index if not exists enquiry_queue_idx on enquiry (status, created_at desc);
create index if not exists enquiry_phone_idx on enquiry (phone, created_at desc);
create index if not exists enquiry_ip_idx on enquiry (ip_hash, created_at desc);

create table if not exists faq (
  id text primary key,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  status text not null default 'draft',
  created_by text not null,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint faq_question_chk check (char_length(question) between 5 and 200),
  constraint faq_answer_chk check (char_length(answer) between 5 and 4000),
  constraint faq_status_chk check (status in ('draft', 'published'))
);

create index if not exists faq_public_idx on faq (status, sort_order, question);

create table if not exists testimonial (
  id text primary key,
  author_name text not null,
  quote text not null,
  attribution text,
  sort_order integer not null default 0,
  status text not null default 'draft',
  created_by text not null,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonial_author_chk check (char_length(author_name) between 2 and 80),
  constraint testimonial_quote_chk check (char_length(quote) between 10 and 600),
  constraint testimonial_attribution_chk check (attribution is null or char_length(attribution) <= 80),
  constraint testimonial_status_chk check (status in ('draft', 'published'))
);

create index if not exists testimonial_public_idx on testimonial (status, sort_order);

create table if not exists blog_post (
  id text primary key,
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body_markdown text not null default '',
  status text not null default 'draft',
  meta_title text,
  meta_description text,
  published_at timestamptz,
  created_by text not null,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_post_slug_chk check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  constraint blog_post_title_chk check (char_length(title) between 1 and 140),
  constraint blog_post_excerpt_chk check (char_length(excerpt) <= 300),
  constraint blog_post_body_chk check (char_length(body_markdown) <= 100000),
  constraint blog_post_meta_title_chk check (meta_title is null or char_length(meta_title) <= 70),
  constraint blog_post_meta_description_chk check (meta_description is null or char_length(meta_description) <= 160),
  constraint blog_post_status_chk check (status in ('draft', 'published', 'archived'))
);

create index if not exists blog_post_public_idx on blog_post (status, published_at desc);

create table if not exists site_setting (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text,
  constraint site_setting_key_chk check (
    key in (
      'whatsapp_e164',
      'public_email',
      'public_phone',
      'address',
      'instagram_url',
      'facebook_url',
      'x_url',
      'youtube_url'
    )
  ),
  constraint site_setting_value_chk check (char_length(value) <= 500)
);

create table if not exists audit_event (
  id text primary key,
  actor_user_id text not null,
  action text not null,
  entity text not null,
  entity_id text,
  created_at timestamptz not null default now(),
  constraint audit_event_action_chk check (char_length(action) between 1 and 80),
  constraint audit_event_entity_chk check (char_length(entity) between 1 and 40)
);

create index if not exists audit_event_created_idx on audit_event (created_at desc);
