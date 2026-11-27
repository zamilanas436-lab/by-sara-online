// Connection to the store's Supabase project (the "memory" of the site).
// The publishable key is safe to ship in the page: the database rules in
// supabase/schema.sql decide what visitors may do (read products, place orders).
window.BSO_CONFIG = {
  SUPABASE_URL: 'https://YOUR-PROJECT.supabase.co',
  SUPABASE_KEY: 'YOUR-PUBLISHABLE-KEY',
  // The owner signs in with this email + the password set in Supabase
  // (Authentication -> Users -> Add user).
  OWNER_EMAIL: 'owner@bysaraonline.app',
};
