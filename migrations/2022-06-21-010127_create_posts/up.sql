create extension if not exists "uuid-ossp";

create table users (
  id uuid default uuid_generate_v4 (),
  email varchar(320) not null,
  username varchar(16) not null,

  primary key (id)
)
