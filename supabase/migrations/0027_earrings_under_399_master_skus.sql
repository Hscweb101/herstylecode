-- Earrings Under 399: moves the 18 placeholder products (HSC-U399-001..018) onto the master-sheet SKUs
-- (todaycontent/HerStyleCode_Master_SKU_Earrings_Under_399.xlsx). Names are corrected to the sheet's spelling
-- (slugs/URLs and photos are untouched). Products with several colours get one variant per colour (variant SKU from
-- the sheet); the sheet has no stock figures, so each colour starts at the same 10 units the placeholders had.
-- Skipped sheet rows: HSC-ER-036-SCE-BK (Black: duplicate variant SKU); HSC-ER-036-SCE-BG (White: colour listed as White (same as -WH); needs confirming).
begin;

-- Spiral Sun Earrings  (HSC-ER-024-SS)
update public.products set sku = 'HSC-ER-024-SS', name = 'Spiral Sun Earrings', price = 299, compare_at_price = null, colour = 'Gold', stock_quantity = 10, is_on_sale = false where sku in ('HSC-U399-001', 'HSC-ER-024-SS');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-024-SS');

-- Pearl Floral Earrings  (HSC-ER-025-PF)
update public.products set sku = 'HSC-ER-025-PF', name = 'Pearl Floral Earrings', price = 299, compare_at_price = null, colour = 'Gold', stock_quantity = 10, is_on_sale = false where sku in ('HSC-U399-002', 'HSC-ER-025-PF');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-025-PF');

-- Sculpted Teardrop Earrings  (HSC-ER-026-STE)
update public.products set sku = 'HSC-ER-026-STE', name = 'Sculpted Teardrop Earrings', price = 299, compare_at_price = null, colour = 'Gold', stock_quantity = 10, is_on_sale = false where sku in ('HSC-U399-003', 'HSC-ER-026-STE');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-026-STE');

-- Triangle Accent Earrings  (HSC-ER-027-TAE)
update public.products set sku = 'HSC-ER-027-TAE', name = 'Triangle Accent Earrings', price = 199, compare_at_price = null, colour = 'Red, Purple, Pink, Emerald Green', stock_quantity = 40, is_on_sale = false where sku in ('HSC-U399-004', 'HSC-ER-027-TAE');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-027-TAE');
insert into public.product_variants (product_id, sku, variant_name, colour, price, stock_quantity, is_active, sort_order) values
  ((select id from public.products where sku = 'HSC-ER-027-TAE'), 'HSC-ER-027-TAE-RD', 'Red', 'Red', 199, 10, true, 0),
  ((select id from public.products where sku = 'HSC-ER-027-TAE'), 'HSC-ER-027-TAE-PU', 'Purple', 'Purple', 199, 10, true, 1),
  ((select id from public.products where sku = 'HSC-ER-027-TAE'), 'HSC-ER-027-TAE-PI', 'Pink', 'Pink', 199, 10, true, 2),
  ((select id from public.products where sku = 'HSC-ER-027-TAE'), 'HSC-ER-027-TAE-EG', 'Emerald Green', 'Emerald Green', 199, 10, true, 3);

-- Coral Mosaic Earrings  (HSC-ER-028-CME)
update public.products set sku = 'HSC-ER-028-CME', name = 'Coral Mosaic Earrings', price = 199, compare_at_price = null, colour = 'Multicolour', stock_quantity = 10, is_on_sale = false where sku in ('HSC-U399-005', 'HSC-ER-028-CME');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-028-CME');

-- Square Cascade Earrings  (HSC-ER-029-SCE)
update public.products set sku = 'HSC-ER-029-SCE', name = 'Square Cascade Earrings', price = 249, compare_at_price = null, colour = 'Wine Red, Amber Orange', stock_quantity = 20, is_on_sale = false where sku in ('HSC-U399-006', 'HSC-ER-029-SCE');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-029-SCE');
insert into public.product_variants (product_id, sku, variant_name, colour, price, stock_quantity, is_active, sort_order) values
  ((select id from public.products where sku = 'HSC-ER-029-SCE'), 'HSC-ER-029-SCE-WR', 'Wine Red', 'Wine Red', 249, 10, true, 0),
  ((select id from public.products where sku = 'HSC-ER-029-SCE'), 'HSC-ER-029-SCE-AO', 'Amber Orange', 'Amber Orange', 249, 10, true, 1);

-- The Rosé Cubist  (HSC-ER-030-RC)
update public.products set sku = 'HSC-ER-030-RC', name = 'The Rosé Cubist', price = 199, compare_at_price = null, colour = 'Pink & Lavender, Blue & Pink', stock_quantity = 20, is_on_sale = false where sku in ('HSC-U399-007', 'HSC-ER-030-RC');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-030-RC');
insert into public.product_variants (product_id, sku, variant_name, colour, price, stock_quantity, is_active, sort_order) values
  ((select id from public.products where sku = 'HSC-ER-030-RC'), 'HSC-ER-030-RC-PL', 'Pink & Lavender', 'Pink & Lavender', 199, 10, true, 0),
  ((select id from public.products where sku = 'HSC-ER-030-RC'), 'HSC-ER-030-RC-BP', 'Blue & Pink', 'Blue & Pink', 199, 10, true, 1);

-- Peach Leaf & Pearl Earrings  (HSC-ER-031-PLPE)
update public.products set sku = 'HSC-ER-031-PLPE', name = 'Peach Leaf & Pearl Earrings', price = 199, compare_at_price = null, colour = 'Peach, Green & Pearl', stock_quantity = 10, is_on_sale = false where sku in ('HSC-U399-008', 'HSC-ER-031-PLPE');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-031-PLPE');

-- Floral Oxidised Jhumka Earrings  (HSC-ER-032-FOJE)
update public.products set sku = 'HSC-ER-032-FOJE', name = 'Floral Oxidised Jhumka Earrings', price = 199, compare_at_price = null, colour = 'Oxidised Silver', stock_quantity = 10, is_on_sale = false where sku in ('HSC-U399-009', 'HSC-ER-032-FOJE');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-032-FOJE');

-- Rajwadi Pearl Kundan Jhumka  (HSC-ER-033-RPKJ)
update public.products set sku = 'HSC-ER-033-RPKJ', name = 'Rajwadi Pearl Kundan Jhumka', price = 349, compare_at_price = null, colour = 'Multicolour', stock_quantity = 10, is_on_sale = false where sku in ('HSC-U399-010', 'HSC-ER-033-RPKJ');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-033-RPKJ');

-- Crystal Butterfly Drop Earrings  (HSC-ER-034-CBDE)
update public.products set sku = 'HSC-ER-034-CBDE', name = 'Crystal Butterfly Drop Earrings', price = 249, compare_at_price = null, colour = 'Grey, Pink, Blue, Purple, Green, Red', stock_quantity = 60, is_on_sale = false where sku in ('HSC-U399-011', 'HSC-ER-034-CBDE');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-034-CBDE');
insert into public.product_variants (product_id, sku, variant_name, colour, price, stock_quantity, is_active, sort_order) values
  ((select id from public.products where sku = 'HSC-ER-034-CBDE'), 'HSC-ER-034-CBDE-GY', 'Grey', 'Grey', 249, 10, true, 0),
  ((select id from public.products where sku = 'HSC-ER-034-CBDE'), 'HSC-ER-034-CBDE-PK', 'Pink', 'Pink', 249, 10, true, 1),
  ((select id from public.products where sku = 'HSC-ER-034-CBDE'), 'HSC-ER-034-CBDE-BL', 'Blue', 'Blue', 249, 10, true, 2),
  ((select id from public.products where sku = 'HSC-ER-034-CBDE'), 'HSC-ER-034-CBDE-PU', 'Purple', 'Purple', 249, 10, true, 3),
  ((select id from public.products where sku = 'HSC-ER-034-CBDE'), 'HSC-ER-034-CBDE-GR', 'Green', 'Green', 249, 10, true, 4),
  ((select id from public.products where sku = 'HSC-ER-034-CBDE'), 'HSC-ER-034-CBDE-RD', 'Red', 'Red', 249, 10, true, 5);

-- Marble Glow Earrings  (HSC-ER-035-MGE)
update public.products set sku = 'HSC-ER-035-MGE', name = 'Marble Glow Earrings', price = 249, compare_at_price = null, colour = 'Champagne, Rose Pink, Mint Green & Light blue, Yellow & Coral', stock_quantity = 40, is_on_sale = false where sku in ('HSC-U399-012', 'HSC-ER-035-MGE');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-035-MGE');
insert into public.product_variants (product_id, sku, variant_name, colour, price, stock_quantity, is_active, sort_order) values
  ((select id from public.products where sku = 'HSC-ER-035-MGE'), 'HSC-ER-035-MGE-CH', 'Champagne', 'Champagne', 249, 10, true, 0),
  ((select id from public.products where sku = 'HSC-ER-035-MGE'), 'HSC-ER-035-MGE-RP', 'Rose Pink', 'Rose Pink', 249, 10, true, 1),
  ((select id from public.products where sku = 'HSC-ER-035-MGE'), 'HSC-ER-035-MGE-MGLB', 'Mint Green & Light blue', 'Mint Green & Light blue', 249, 10, true, 2),
  ((select id from public.products where sku = 'HSC-ER-035-MGE'), 'HSC-ER-035-MGE-YC', 'Yellow & Coral', 'Yellow & Coral', 249, 10, true, 3);

-- Sculpted Curve Earrings  (HSC-ER-036-SCE)
update public.products set sku = 'HSC-ER-036-SCE', name = 'Sculpted Curve Earrings', price = 249, compare_at_price = null, colour = 'Black, White', stock_quantity = 20, is_on_sale = false where sku in ('HSC-U399-013', 'HSC-ER-036-SCE');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-036-SCE');
insert into public.product_variants (product_id, sku, variant_name, colour, price, stock_quantity, is_active, sort_order) values
  ((select id from public.products where sku = 'HSC-ER-036-SCE'), 'HSC-ER-036-SCE-BK', 'Black', 'Black', 249, 10, true, 0),
  ((select id from public.products where sku = 'HSC-ER-036-SCE'), 'HSC-ER-036-SCE-WH', 'White', 'White', 249, 10, true, 1);

-- Multicolour Royal Jhumka  (HSC-ER-037-MRJ)
update public.products set sku = 'HSC-ER-037-MRJ', name = 'Multicolour Royal Jhumka', price = 249, compare_at_price = null, colour = 'Multicolour', stock_quantity = 10, is_on_sale = false where sku in ('HSC-U399-014', 'HSC-ER-037-MRJ');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-037-MRJ');

-- Hearline Studs  (HSC-ER-038-HS)
update public.products set sku = 'HSC-ER-038-HS', name = 'Hearline Studs', price = 199, compare_at_price = null, colour = 'Purple, Red, Black, Emerald Green, Blush Pink, Ivory', stock_quantity = 60, is_on_sale = false where sku in ('HSC-U399-015', 'HSC-ER-038-HS');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-038-HS');
insert into public.product_variants (product_id, sku, variant_name, colour, price, stock_quantity, is_active, sort_order) values
  ((select id from public.products where sku = 'HSC-ER-038-HS'), 'HSC-ER-038-HS-PU', 'Purple', 'Purple', 199, 10, true, 0),
  ((select id from public.products where sku = 'HSC-ER-038-HS'), 'HSC-ER-038-HS-RD', 'Red', 'Red', 199, 10, true, 1),
  ((select id from public.products where sku = 'HSC-ER-038-HS'), 'HSC-ER-038-HS-BK', 'Black', 'Black', 199, 10, true, 2),
  ((select id from public.products where sku = 'HSC-ER-038-HS'), 'HSC-ER-038-HS-EG', 'Emerald Green', 'Emerald Green', 199, 10, true, 3),
  ((select id from public.products where sku = 'HSC-ER-038-HS'), 'HSC-ER-038-HS-BP', 'Blush Pink', 'Blush Pink', 199, 10, true, 4),
  ((select id from public.products where sku = 'HSC-ER-038-HS'), 'HSC-ER-038-HS-IV', 'Ivory', 'Ivory', 199, 10, true, 5);

-- Rose Gold Pearl Earrings  (HSC-ER-039-RGPE)
update public.products set sku = 'HSC-ER-039-RGPE', name = 'Rose Gold Pearl Earrings', price = 299, compare_at_price = null, colour = 'Rose Gold', stock_quantity = 10, is_on_sale = false where sku in ('HSC-U399-016', 'HSC-ER-039-RGPE');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-039-RGPE');

-- Classic Bow Studs  (HSC-ER-040-CBS)
update public.products set sku = 'HSC-ER-040-CBS', name = 'Classic Bow Studs', price = 159, compare_at_price = null, colour = 'Champagne & Pearl', stock_quantity = 10, is_on_sale = false where sku in ('HSC-U399-017', 'HSC-ER-040-CBS');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-040-CBS');

-- Bloom Petal Earrings  (HSC-ER-041-BPE)
update public.products set sku = 'HSC-ER-041-BPE', name = 'Bloom Petal Earrings', price = 249, compare_at_price = null, colour = 'Pink & Green, Pink & Blue, Coral & Teal, Champagne & Grey', stock_quantity = 40, is_on_sale = false where sku in ('HSC-U399-018', 'HSC-ER-041-BPE');
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-041-BPE');
insert into public.product_variants (product_id, sku, variant_name, colour, price, stock_quantity, is_active, sort_order) values
  ((select id from public.products where sku = 'HSC-ER-041-BPE'), 'HSC-ER-041-BPE-PG', 'Pink & Green', 'Pink & Green', 249, 10, true, 0),
  ((select id from public.products where sku = 'HSC-ER-041-BPE'), 'HSC-ER-041-BPE-PB', 'Pink & Blue', 'Pink & Blue', 249, 10, true, 1),
  ((select id from public.products where sku = 'HSC-ER-041-BPE'), 'HSC-ER-041-BPE-CT', 'Coral & Teal', 'Coral & Teal', 249, 10, true, 2),
  ((select id from public.products where sku = 'HSC-ER-041-BPE'), 'HSC-ER-041-BPE-CG', 'Champagne & Grey', 'Champagne & Grey', 249, 10, true, 3);

commit;
