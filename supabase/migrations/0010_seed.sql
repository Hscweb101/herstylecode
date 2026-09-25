-- ============================================================
-- SEED DATA: categories, static pages, faqs, settings, navigation,
-- and a handful of DEMO products so the storefront is not empty.
-- All of this is fully editable/removable from the admin panel.
-- ============================================================

insert into public.categories (name, slug, sort_order) values
  ('Earrings', 'earrings', 1),
  ('Necklaces', 'necklaces', 2),
  ('Rings', 'rings', 3),
  ('Bracelets & Bangles', 'bracelets-bangles', 4),
  ('Jewellery Sets', 'jewellery-sets', 5),
  ('Hair Accessories', 'hair-accessories', 6),
  ('Other Accessories', 'other-accessories', 7);

insert into public.collections (name, slug, sort_order) values
  ('New Arrivals', 'new-arrivals', 1),
  ('Best Sellers', 'best-sellers', 2),
  ('Trending Now', 'trending', 3),
  ('Sale', 'sale', 4);

insert into public.static_pages (slug, title, content) values
  ('about-us', 'About HerStyleCode', '<p>HerStyleCode believes your style should always be on your own rules. We curate fashion jewellery designed for everyday confidence. (Replace this with your real brand story from the admin panel.)</p>'),
  ('faq', 'Frequently Asked Questions', '<p>See the FAQ list below.</p>'),
  ('shipping-policy', 'Shipping Policy', '<p>We ship across India. Orders are typically dispatched within 1-2 business days. (Edit with your actual shipping timelines and charges.)</p>'),
  ('returns-refund-policy', 'Returns & Refund Policy', '<p>We accept returns within 7 days of delivery for unused items in original packaging. (Edit with your actual policy.)</p>'),
  ('cancellation-policy', 'Cancellation Policy', '<p>Orders can be cancelled before they are shipped. (Edit with your actual policy.)</p>'),
  ('privacy-policy', 'Privacy Policy', '<p>Your privacy matters to us. (Replace with your legal privacy policy text.)</p>'),
  ('terms-conditions', 'Terms & Conditions', '<p>By using this website you agree to our terms. (Replace with your legal terms.)</p>'),
  ('jewellery-care-guide', 'Jewellery Care Guide', '<p>Keep your jewellery away from water, perfume and sweat. Store in a dry, airtight pouch when not in use.</p>'),
  ('contact-us', 'Contact Us', '<p>Reach us via the form below or WhatsApp.</p>');

insert into public.faqs (question, answer, sort_order) values
  ('Is this jewellery real gold or silver?', 'Our pieces are fashion/artificial jewellery finished to look premium - not real precious metal. Details are on every product page.', 1),
  ('Do you offer Cash on Delivery?', 'COD availability is shown at checkout based on your pincode and order value.', 2),
  ('How long does delivery take?', 'Most orders are delivered within 4-7 business days across India.', 3),
  ('What is your return policy?', 'We accept returns within 7 days of delivery for unused items in original packaging. See our Returns & Refund Policy for details.', 4),
  ('How do I track my order?', 'Use the Track Order page with your order number and phone/email, or check My Account > My Orders.', 5);

insert into public.navigation_items (label, url, sort_order) values
  ('Shop All', '/shop', 1),
  ('New Arrivals', '/collections/new-arrivals', 2),
  ('Best Sellers', '/collections/best-sellers', 3),
  ('Trending', '/collections/trending', 4),
  ('Sale', '/collections/sale', 5),
  ('Earrings', '/category/earrings', 6),
  ('Necklaces', '/category/necklaces', 7),
  ('Rings', '/category/rings', 8),
  ('Bracelets & Bangles', '/category/bracelets-bangles', 9),
  ('Jewellery Sets', '/category/jewellery-sets', 10),
  ('Hair Accessories', '/category/hair-accessories', 11),
  ('Other Accessories', '/category/other-accessories', 12);

insert into public.store_settings (key, value) values
  ('store_info', '{"name":"HerStyleCode","tagline":"Your Style. Your Rules.","support_email":"support@herstylecode.com","support_phone":"+91 90000 00000","whatsapp_number":"+91 90000 00000","address":""}'),
  ('social_links', '{"instagram":"","facebook":"","pinterest":""}'),
  ('shipping', '{"free_shipping_threshold":999,"standard_shipping_fee":59,"cod_available":true,"cod_fee":0}'),
  ('tax', '{"gst_percentage":0,"prices_include_tax":true}'),
  ('announcement_bar', '{"enabled":true,"text":"Free shipping on prepaid orders above ₹999 | COD available"}'),
  ('analytics', '{"ga4_id":"","meta_pixel_id":"","gsc_verification":""}');

-- ---------- Demo products (safe to delete from the admin panel) ----------
do $$
declare
  cat_earrings uuid; cat_necklaces uuid; cat_rings uuid; cat_bangles uuid; cat_sets uuid;
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid;
  col_new uuid; col_best uuid; col_trend uuid; col_sale uuid;
begin
  select id into cat_earrings from public.categories where slug = 'earrings';
  select id into cat_necklaces from public.categories where slug = 'necklaces';
  select id into cat_rings from public.categories where slug = 'rings';
  select id into cat_bangles from public.categories where slug = 'bracelets-bangles';
  select id into cat_sets from public.categories where slug = 'jewellery-sets';
  select id into col_new from public.collections where slug = 'new-arrivals';
  select id into col_best from public.collections where slug = 'best-sellers';
  select id into col_trend from public.collections where slug = 'trending';
  select id into col_sale from public.collections where slug = 'sale';

  insert into public.products (category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, material, colour, size, care_instructions, is_active, is_featured, is_new_arrival)
  values (cat_earrings, 'Golden Floral Hoop Earrings', 'golden-floral-hoop-earrings', 'HSC-ER-001-GD', 'Lightweight gold-tone floral hoops for everyday elegance.', 'Lightweight gold-tone floral hoop earrings finished for a premium everyday look. Nickel-free base for sensitive ears.', 999, 1499, 25, 'Fashion jewellery / gold-tone finish', 'Gold', '35 mm', 'Keep away from water, perfume and sweat. Store in a dry pouch.', true, true, true)
  returning id into p1;

  insert into public.products (category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, material, colour, size, care_instructions, is_active, is_bestseller)
  values (cat_necklaces, 'Rose Gold Layered Necklace', 'rose-gold-layered-necklace', 'HSC-NK-001-RG', 'Delicate layered necklace with a modern minimal charm.', 'A delicate layered chain necklace finished in rose gold-tone with a minimal charm pendant.', 1299, 1799, 18, 'Fashion jewellery / rose gold-tone finish', 'Rose Gold', '16-18 inch adjustable', 'Avoid contact with water and perfumes.', true, true)
  returning id into p2;

  insert into public.products (category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, material, colour, size, care_instructions, is_active, is_trending)
  values (cat_rings, 'Silver Stone Studded Ring', 'silver-stone-studded-ring', 'HSC-RG-001-SV', 'Adjustable statement ring with sparkling stone detailing.', 'An adjustable statement ring finished in silver-tone with sparkling stone detailing, suitable for daily wear.', 599, 899, 40, 'Fashion jewellery / silver-tone finish', 'Silver', 'Adjustable', 'Remove before washing hands.', true, true)
  returning id into p3;

  insert into public.products (category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, material, colour, size, care_instructions, is_active, is_on_sale)
  values (cat_bangles, 'Kundan Bangle Set (Pack of 4)', 'kundan-bangle-set-pack-of-4', 'HSC-BN-001-GD', 'Traditional Kundan-style bangle set for festive occasions.', 'A set of 4 traditional Kundan-style bangles finished in gold-tone, perfect for festive and ethnic wear.', 799, 1199, 15, 'Fashion jewellery / Kundan work', 'Gold', '2.6 inch', 'Store separately to avoid scratches.', true, true)
  returning id into p4;

  insert into public.products (category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, material, colour, size, care_instructions, is_active, is_featured, is_new_arrival)
  values (cat_sets, 'Pearl Bridal Jewellery Set', 'pearl-bridal-jewellery-set', 'HSC-JS-001-PL', 'Necklace, earrings & maang tikka set for special occasions.', 'A complete bridal jewellery set including necklace, earrings and maang tikka, finished with pearl detailing.', 2499, 3499, 8, 'Fashion jewellery / pearl finish', 'White/Gold', 'Free size', 'Store flat in a jewellery box.', true, true, true)
  returning id into p5;

  insert into public.products (category_id, name, slug, sku, short_description, description, price, compare_at_price, stock_quantity, material, colour, size, care_instructions, is_active, is_bestseller, is_on_sale)
  values (cat_earrings, 'Pastel Drop Earrings', 'pastel-drop-earrings', 'HSC-ER-002-PS', 'Soft pastel drop earrings for a subtle pop of colour.', 'Soft pastel-toned drop earrings, lightweight enough for all-day wear.', 449, 699, 30, 'Fashion jewellery / enamel finish', 'Pastel Pink', '45 mm', 'Keep away from moisture.', true, true, true)
  returning id into p6;

  insert into public.product_collections (product_id, collection_id) values
    (p1, col_new), (p1, col_best),
    (p2, col_best),
    (p3, col_trend),
    (p4, col_sale),
    (p5, col_new),
    (p6, col_best), (p6, col_sale);

  insert into public.product_images (product_id, url, alt_text, sort_order, is_primary) values
    (p1, 'https://placehold.co/800x800/FCE7EF/D6336C?text=Golden+Floral+Hoops', 'Golden Floral Hoop Earrings', 0, true),
    (p2, 'https://placehold.co/800x800/FCE7EF/D6336C?text=Rose+Gold+Necklace', 'Rose Gold Layered Necklace', 0, true),
    (p3, 'https://placehold.co/800x800/FCE7EF/D6336C?text=Silver+Stone+Ring', 'Silver Stone Studded Ring', 0, true),
    (p4, 'https://placehold.co/800x800/FCE7EF/D6336C?text=Kundan+Bangle+Set', 'Kundan Bangle Set', 0, true),
    (p5, 'https://placehold.co/800x800/FCE7EF/D6336C?text=Pearl+Bridal+Set', 'Pearl Bridal Jewellery Set', 0, true),
    (p6, 'https://placehold.co/800x800/FCE7EF/D6336C?text=Pastel+Drop+Earrings', 'Pastel Drop Earrings', 0, true);
end $$;
