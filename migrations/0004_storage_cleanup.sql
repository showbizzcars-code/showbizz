-- Storage cleanup queue for orphaned objects whose immediate deletion failed.
create table if not exists pending_storage_cleanup (
  id text primary key,
  storage_key text not null unique,
  reason text not null default '',
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pending_storage_cleanup_created_idx on pending_storage_cleanup (created_at asc);
