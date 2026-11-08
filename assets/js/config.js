// Supabase ulanish sozlamalari.
// Bu ochiq (public) kalit: u faqat RLS qoidalari ruxsat bergan amallarni bajara oladi.
export const SUPABASE_URL = 'https://uvwcpzanokhxuvmphhox.supabase.co';
export const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2d2NwemFub2toeHV2bXBoaG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwODkxNjYsImV4cCI6MjEwOTY2NTE2Nn0.HdHEDqStD9XWwNCCrS93P1F1oH7RnnwOjAqRDuo7g6o';

export const STORAGE_BUCKET = 'media';

// Tashqi kutubxonalar (CDN)
export const CDN = {
  supabase: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm',
  bgRemoval: [
    'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/+esm',
    'https://esm.sh/@imgly/background-removal@1.4.5',
  ],
};
