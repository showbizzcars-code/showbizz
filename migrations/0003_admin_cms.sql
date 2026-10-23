-- Additional Admin CMS Indexes & Constraints migration
-- Appends necessary triggers/indexes if missing or needed for administrative queries.

create index if not exists enquiry_status_updated_idx on enquiry (status, updated_at desc);
create index if not exists vehicle_image_vehicle_idx on vehicle_image (vehicle_id, sort_order asc);
create index if not exists blog_post_slug_status_idx on blog_post (slug, status);
