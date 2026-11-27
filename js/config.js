// Connection to the store's Supabase project (the "memory" of the site).
// The publishable key is safe to ship in the page: the database rules in
// supabase/schema.sql decide what visitors may do (read products, place orders).
window.BSO_CONFIG = {
  SUPABASE_URL: 'https://azfcxaxeiuoxxovtvksd.supabase.co',
  SUPABASE_KEY: 'sb_publishable_WZvLIFgGGg3fub5WNGziHg_YtNFnm4m',
  // The owner signs in with this email + the password set in Supabase
  // (Authentication -> Users -> Add user).
  OWNER_EMAIL: '', // optional: pre-fills the email box on owner.html (this repo is public)
};
