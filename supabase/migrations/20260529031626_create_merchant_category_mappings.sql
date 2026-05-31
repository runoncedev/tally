
create table merchant_category_mappings (
	id            bigserial primary key,
	household_id  uuid references households(id) on delete cascade not null,
	merchant      text not null,
	category_id   bigint not null references categories(id) on delete restrict,
	created_at    timestamptz not null default now(),
	updated_at    timestamptz not null default now()
);

alter table merchant_category_mappings enable row level security;

create policy "household members can access their merchant_category_mappings"
	on merchant_category_mappings
	for all
	using (
		household_id in (
			select household_id from household_members where user_id = auth.uid()
		)
	);

-- unique index to enforce case-insensitive uniqueness per household
create unique index if not exists merchant_category_mappings_household_merchant_lower_uindex
	on merchant_category_mappings (household_id, lower(merchant));

-- index to speed up plain case-insensitive merchant lookups
create index if not exists merchant_category_mappings_merchant_lower_idx
	on merchant_category_mappings (lower(merchant));

