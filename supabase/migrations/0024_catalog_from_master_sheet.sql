-- Catalogue prices, SKUs, colours and stock from HerStyleCode_FINAL_Master_SKU__Vidhi_Corrected.xlsx
-- Selling price = MRP in the sheet, so compare_at_price is cleared (no strike-through price / sale badge).
-- Products with several colours get one variant per colour (variant SKU from the sheet).
-- Products that are not on the site yet are added as inactive drafts (no photos yet).
begin;

-- Royal Purple Statement Ring  (HSC-RG-001)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-RG-101-GD');
update public.products set sku = 'HSC-RG-001-RPS', price = 549, compare_at_price = null, stock_quantity = 6, colour = 'Purple', care_instructions = null, is_on_sale = false where sku = 'HSC-RG-101-GD';

-- Royal Prism Earrings  (HSC-ER-001)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-101-GD');
update public.products set sku = 'HSC-ER-001', price = 650, compare_at_price = null, stock_quantity = 10, colour = 'Champagne, Mint Green, Wine Purple', care_instructions = null, is_on_sale = false where sku = 'HSC-ER-101-GD';
insert into public.product_variants (product_id, sku, variant_name, colour, price, stock_quantity, is_active, sort_order) values
  ((select id from public.products where sku = 'HSC-ER-001'), 'HSC-ER-001-RPE-CH', 'Champagne', 'Champagne', 650, 5, true, 0),
  ((select id from public.products where sku = 'HSC-ER-001'), 'HSC-ER-001-RPE-MG', 'Mint Green', 'Mint Green', 650, 3, true, 1),
  ((select id from public.products where sku = 'HSC-ER-001'), 'HSC-ER-001-RPE-WP', 'Wine Purple', 'Wine Purple', 650, 2, true, 2);

-- Royal Drape Earrings  (HSC-ER-002)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-102-GD');
update public.products set sku = 'HSC-ER-002', price = 549, compare_at_price = null, stock_quantity = 6, colour = 'Champagne, Mint Green', care_instructions = null, is_on_sale = false where sku = 'HSC-ER-102-GD';
insert into public.product_variants (product_id, sku, variant_name, colour, price, stock_quantity, is_active, sort_order) values
  ((select id from public.products where sku = 'HSC-ER-002'), 'HSC-ER-002-RDE-CH', 'Champagne', 'Champagne', 549, 3, true, 0),
  ((select id from public.products where sku = 'HSC-ER-002'), 'HSC-ER-002-RDE-MG', 'Mint Green', 'Mint Green', 549, 3, true, 1);

-- Gold Plated Moon Earcuff  (HSC-ER-003)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-103-GD');
update public.products set sku = 'HSC-ER-003-GPM', price = 299, compare_at_price = null, stock_quantity = 6, colour = 'Gold', care_instructions = null, is_on_sale = false where sku = 'HSC-ER-103-GD';

-- Gold Plated Ganesha Earcuff  (HSC-ER-004)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-104-GD');
update public.products set sku = 'HSC-ER-004-GGE', price = 299, compare_at_price = null, stock_quantity = 6, colour = 'Gold', care_instructions = null, is_on_sale = false where sku = 'HSC-ER-104-GD';

-- Gold Plated Lakshmi Earcuff  (HSC-ER-005)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-105-GD');
update public.products set sku = 'HSC-ER-005-GLE', price = 299, compare_at_price = null, stock_quantity = 6, colour = 'Gold', care_instructions = null, is_on_sale = false where sku = 'HSC-ER-105-GD';

-- Gold Plated Rose Earcuff  (HSC-ER-006)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-106-GD');
update public.products set sku = 'HSC-ER-006-GRE', price = 299, compare_at_price = null, stock_quantity = 5, colour = 'Gold', care_instructions = null, is_on_sale = false where sku = 'HSC-ER-106-GD';

-- Gold Plated Butterfly Earcuff  (HSC-ER-007)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-107-GD');
update public.products set sku = 'HSC-ER-007-GBE', price = 299, compare_at_price = null, stock_quantity = 8, colour = 'Gold', care_instructions = null, is_on_sale = false where sku = 'HSC-ER-107-GD';

-- Gold Plated Floral Earcuff  (HSC-ER-008)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-108-GD');
update public.products set sku = 'HSC-ER-008-GFE', price = 299, compare_at_price = null, stock_quantity = 4, colour = 'Gold', care_instructions = null, is_on_sale = false where sku = 'HSC-ER-108-GD';

-- Celeste Drops  (HSC-ER-009)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-109-GD');
update public.products set sku = 'HSC-ER-009', price = 399, compare_at_price = null, stock_quantity = 14, colour = 'Wine Purple, Champagne, Charcoal Blue, Mint Green, Black', care_instructions = null, is_on_sale = false where sku = 'HSC-ER-109-GD';
insert into public.product_variants (product_id, sku, variant_name, colour, price, stock_quantity, is_active, sort_order) values
  ((select id from public.products where sku = 'HSC-ER-009'), 'HSC-ER-009-CD-WP', 'Wine Purple', 'Wine Purple', 399, 3, true, 0),
  ((select id from public.products where sku = 'HSC-ER-009'), 'HSC-ER-009-CD-CH', 'Champagne', 'Champagne', 399, 3, true, 1),
  ((select id from public.products where sku = 'HSC-ER-009'), 'HSC-ER-009-CD-CB', 'Charcoal Blue', 'Charcoal Blue', 399, 3, true, 2),
  ((select id from public.products where sku = 'HSC-ER-009'), 'HSC-ER-009-CD-MG', 'Mint Green', 'Mint Green', 399, 2, true, 3),
  ((select id from public.products where sku = 'HSC-ER-009'), 'HSC-ER-009-CD-BK', 'Black', 'Black', 399, 3, true, 4);

-- Modern Statement Studs  (HSC-ER-010)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-110-GD');
update public.products set sku = 'HSC-ER-010', price = 399, compare_at_price = null, stock_quantity = 14, colour = 'Wine Purple, Champagne, Deep Blue, Emerald Green, Black', care_instructions = null, is_on_sale = false where sku = 'HSC-ER-110-GD';
insert into public.product_variants (product_id, sku, variant_name, colour, price, stock_quantity, is_active, sort_order) values
  ((select id from public.products where sku = 'HSC-ER-010'), 'HSC-ER-010-MSS-WP', 'Wine Purple', 'Wine Purple', 399, 3, true, 0),
  ((select id from public.products where sku = 'HSC-ER-010'), 'HSC-ER-010-MSS-CH', 'Champagne', 'Champagne', 399, 3, true, 1),
  ((select id from public.products where sku = 'HSC-ER-010'), 'HSC-ER-010-MSS-DB', 'Deep Blue', 'Deep Blue', 399, 3, true, 2),
  ((select id from public.products where sku = 'HSC-ER-010'), 'HSC-ER-010-MSS-EG', 'Emerald Green', 'Emerald Green', 399, 2, true, 3),
  ((select id from public.products where sku = 'HSC-ER-010'), 'HSC-ER-010-MSS-BK', 'Black', 'Black', 399, 3, true, 4);

-- Royal Golden Bloom Earrings  (HSC-ER-011)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-111-GD');
update public.products set sku = 'HSC-ER-011-RGB', price = 499, compare_at_price = null, stock_quantity = 6, colour = 'Gold', care_instructions = null, is_on_sale = false where sku = 'HSC-ER-111-GD';

-- Royal Sculpt Earrings  (HSC-ER-012)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-ER-112-GD');
update public.products set sku = 'HSC-ER-012-RSE', price = 799, compare_at_price = null, stock_quantity = 3, colour = 'Gold', care_instructions = null, is_on_sale = false where sku = 'HSC-ER-112-GD';

-- NEW (draft, inactive): Natural Stone Cluster Drops  (HSC-ER-013)
insert into public.products (category_id, name, slug, sku, price, compare_at_price, stock_quantity, material, colour, is_active, is_on_sale) values ((select id from public.categories where name = 'Earrings' limit 1), 'Natural Stone Cluster Drops', 'natural-stone-cluster-drops', 'HSC-ER-013-NSC', 599, null, 5, 'Gold Plated', 'Multicolour', false, false);

-- Royal Golden Floral Handcuff  (HSC-HC-001)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-BN-101-GD');
update public.products set sku = 'HSC-HC-001-RGFH', price = 899, compare_at_price = null, stock_quantity = 6, colour = 'Gold', care_instructions = null, is_on_sale = false where sku = 'HSC-BN-101-GD';

-- Royal Grace Handcuff (Multi Stone)  (HSC-HC-002)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-BN-102-GD');
update public.products set sku = 'HSC-HC-002-RGH', price = 599, compare_at_price = null, stock_quantity = 6, colour = 'Multicolour', care_instructions = null, is_on_sale = false where sku = 'HSC-BN-102-GD';

-- Royal Cascade Bracelet  (HSC-BR-001)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-BN-103-GD');
update public.products set sku = 'HSC-BR-001', price = 549, compare_at_price = null, stock_quantity = 2, colour = 'Mint Green', care_instructions = null, is_on_sale = false where sku = 'HSC-BN-103-GD';

-- Royal Cascade Bracelet  (HSC-BR-002)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-BN-104-GD');
update public.products set sku = 'HSC-BR-002', price = 549, compare_at_price = null, stock_quantity = 7, colour = 'Multicolour', care_instructions = null, is_on_sale = false where sku = 'HSC-BN-104-GD';

-- Golden Stone Mosaic Set (Multi Stone)  (HSC-JS-001)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-JS-101-GD');
update public.products set sku = 'HSC-JS-001-GSM', price = 799, compare_at_price = null, stock_quantity = 5, colour = 'Multicolour', care_instructions = null, is_on_sale = false where sku = 'HSC-JS-101-GD';

-- Royal Stone Cascade Set  (HSC-JS-002)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-JS-102-GD');
update public.products set sku = 'HSC-JS-002', price = 899, compare_at_price = null, stock_quantity = 8, colour = 'Mint Green, Wine Purple, Champagne', care_instructions = null, is_on_sale = false where sku = 'HSC-JS-102-GD';
insert into public.product_variants (product_id, sku, variant_name, colour, price, stock_quantity, is_active, sort_order) values
  ((select id from public.products where sku = 'HSC-JS-002'), 'HSC-JS-002-RSCS-MG', 'Mint Green', 'Mint Green', 899, 3, true, 0),
  ((select id from public.products where sku = 'HSC-JS-002'), 'HSC-JS-002-RSCS-WP', 'Wine Purple', 'Wine Purple', 899, 2, true, 1),
  ((select id from public.products where sku = 'HSC-JS-002'), 'HSC-JS-002-RSCS-CH', 'Champagne', 'Champagne', 899, 3, true, 2);

-- Aqua Aura Statement Set  (HSC-JS-003)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-JS-103-GD');
update public.products set sku = 'HSC-JS-003-AAS', price = 899, compare_at_price = null, stock_quantity = 3, colour = 'Aqua Green', care_instructions = null, is_on_sale = false where sku = 'HSC-JS-103-GD';

-- Textured Gold Statement Set  (HSC-JS-004)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-JS-104-GD');
update public.products set sku = 'HSC-JS-004-TGSS', price = 2699, compare_at_price = null, stock_quantity = 3, colour = 'Gold', care_instructions = null, is_on_sale = false where sku = 'HSC-JS-104-GD';

-- Textured Gold Ring, Earring & Pendant Set  (HSC-JS-005)
delete from public.product_variants where product_id = (select id from public.products where sku = 'HSC-JS-105-GD');
update public.products set sku = 'HSC-JS-005-TGREPS', price = 1999, compare_at_price = null, stock_quantity = 2, colour = 'Gold', care_instructions = null, is_on_sale = false where sku = 'HSC-JS-105-GD';

-- NEW (draft, inactive): Celeste Links  (HSC-ER-014)
insert into public.products (category_id, name, slug, sku, price, compare_at_price, stock_quantity, material, colour, is_active, is_on_sale) values ((select id from public.categories where name = 'Earrings' limit 1), 'Celeste Links', 'celeste-links', 'HSC-ER-014', 1499, null, 5, 'Gold Plated', 'Champagne, Mint Green', false, false);
insert into public.product_variants (product_id, sku, variant_name, colour, price, stock_quantity, is_active, sort_order) values
  ((select id from public.products where sku = 'HSC-ER-014'), 'HSC-ER-014-CH', 'Champagne', 'Champagne', 1499, 1, true, 0),
  ((select id from public.products where sku = 'HSC-ER-014'), 'HSC-ER-014-MG', 'Mint Green', 'Mint Green', 1499, 4, true, 1);

-- NEW (draft, inactive): The Royal Mosaic Set (Multicolour)  (HSC-JS-006)
insert into public.products (category_id, name, slug, sku, price, compare_at_price, stock_quantity, material, colour, is_active, is_on_sale) values ((select id from public.categories where name = 'Jewellery Sets' limit 1), 'The Royal Mosaic Set (Multicolour)', 'the-royal-mosaic-set-multicolour', 'HSC-JS-006-TRMS', 1699, null, 5, 'Gold Plated', 'Multicolour', false, false);

-- NEW (draft, inactive): Royal Gold Plated Multicolour Hasli Set  (HSC-JS-007)
insert into public.products (category_id, name, slug, sku, price, compare_at_price, stock_quantity, material, colour, is_active, is_on_sale) values ((select id from public.categories where name = 'Jewellery Sets' limit 1), 'Royal Gold Plated Multicolour Hasli Set', 'royal-gold-plated-multicolour-hasli-set', 'HSC-JS-007-RGPMHS', 1199, null, 5, 'Gold Plated', 'Multicolour', false, false);

commit;
