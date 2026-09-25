-- ============================================================
-- POLICY PAGES (required by Razorpay merchant verification)
-- Terms & Conditions, Privacy Policy, Shipping Policy,
-- Returns & Refund Policy, Cancellation Policy, Contact Us.
--
-- Safe to re-run: upserts on slug. Contact details (email, phone,
-- address) are appended to each page automatically by the storefront
-- from Admin > Settings > store_info, so they are NOT hardcoded here.
-- ============================================================

insert into public.static_pages (slug, title, content) values

('terms-conditions', 'Terms & Conditions', $html$
<p><em>Last updated: 24 September 2026</em></p>
<p>Welcome to HerStyleCode ("we", "us", "our"). By visiting or placing an order on this website you agree to the terms below. Please read them carefully.</p>

<h2>1. About us</h2>
<p>HerStyleCode is an online store selling fashion (artificial) jewellery to customers in India. Our products are fashion jewellery finished to look premium; they are not made of real gold, silver or precious stones unless a product page clearly says so.</p>

<h2>2. Use of the website</h2>
<p>You must be 18 years or older, or use the website under the supervision of a parent or guardian. You agree to provide accurate information when you place an order and not to misuse the website, attempt to gain unauthorised access, or use it for any unlawful purpose.</p>

<h2>3. Products and pricing</h2>
<ul>
  <li>All prices are in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.</li>
  <li>We try to display product colours and details accurately, but slight variations may occur because of screen settings, lighting and the handmade or finished nature of some pieces.</li>
  <li>We may change prices, discounts and product availability at any time without notice. An order is only confirmed once payment is successful (or a Cash on Delivery order is accepted by us).</li>
  <li>If a product is listed at a wrong price because of an obvious error, we may cancel the order and refund any amount paid in full.</li>
</ul>

<h2>4. Orders and payment</h2>
<p>We accept online payments (UPI, cards, net banking and wallets) processed securely through Razorpay, and Cash on Delivery (COD) where available for your pincode and order value. We do not store your card, UPI or bank details; these are handled by the payment gateway. We may cancel or refuse any order, for example in case of suspected fraud, stock unavailability or incorrect pricing, in which case any amount paid will be refunded.</p>

<h2>5. Shipping, cancellation and returns</h2>
<p>Delivery timelines are described in our <a href="/page/shipping-policy">Shipping Policy</a>. Cancellations are covered by our <a href="/page/cancellation-policy">Cancellation Policy</a>, and returns, replacements and refunds by our <a href="/page/returns-refund-policy">Returns &amp; Refund Policy</a>. These policies form part of these Terms.</p>

<h2>6. Care of products</h2>
<p>Fashion jewellery lasts longer with care. Keep it away from water, perfume, lotions and sweat, and store it in a dry pouch. Damage caused by improper use is not covered under our returns policy.</p>

<h2>7. Intellectual property</h2>
<p>All content on this website, including the HerStyleCode name, logo, images, text and designs, belongs to us or is used with permission. You may not copy, reproduce or use it commercially without our written consent.</p>

<h2>8. Limitation of liability</h2>
<p>To the fullest extent permitted by law, HerStyleCode is not liable for any indirect or consequential loss arising from use of the website or products. Our total liability for any order is limited to the amount you paid for that order.</p>

<h2>9. Governing law</h2>
<p>These Terms are governed by the laws of India. Any dispute will be subject to the exclusive jurisdiction of the courts in India.</p>

<h2>10. Changes to these terms</h2>
<p>We may update these Terms from time to time. The version published on this page, with its "last updated" date, is the one that applies.</p>

<h2>11. Contact</h2>
<p>For any questions about these Terms, please reach us using the contact details below or on our <a href="/contact">Contact Us</a> page.</p>
$html$),

('privacy-policy', 'Privacy Policy', $html$
<p><em>Last updated: 24 September 2026</em></p>
<p>HerStyleCode ("we", "us", "our") is an online store selling fashion (artificial) jewellery in India. We respect your privacy, and this policy explains what information we collect, how we use it and the choices you have.</p>

<h2>1. Information we collect</h2>
<ul>
  <li><strong>Details you give us:</strong> name, email address, phone number, delivery and billing address, and messages you send through our contact form.</li>
  <li><strong>Order information:</strong> the products you buy, order value, and payment status. We do <strong>not</strong> collect or store your card number, CVV, UPI PIN or net-banking credentials. Payments are processed by our payment partner Razorpay under its own security standards.</li>
  <li><strong>Account and device data:</strong> a login identifier, cart and wishlist contents, and basic technical data such as browser type, device and pages visited, collected through cookies and similar technologies.</li>
</ul>

<h2>2. How we use your information</h2>
<ul>
  <li>To process and deliver your orders, send order updates, and handle returns, refunds and support requests.</li>
  <li>To verify payments and prevent fraud.</li>
  <li>To improve our website, products and customer experience.</li>
  <li>To send you offers or updates, only where you have opted in. You can unsubscribe at any time.</li>
  <li>To comply with legal and tax obligations.</li>
</ul>

<h2>3. Who we share it with</h2>
<p>We do not sell your personal information. We share it only with service providers needed to run the store, such as the payment gateway (Razorpay), courier and logistics partners who deliver your order, our hosting and database provider, and email or messaging providers. They may use your data only to provide their service to us. We may also disclose information when required by law or a government authority.</p>

<h2>4. Cookies</h2>
<p>We use cookies and local storage to keep you signed in, remember your cart and wishlist, and understand how the site is used. You can control cookies through your browser settings, but some parts of the store may not work properly without them.</p>

<h2>5. Data security and retention</h2>
<p>We use reasonable technical and organisational measures, including encrypted connections (HTTPS) and access controls, to protect your data. We keep information only as long as needed for the purposes above and to meet legal, accounting and tax requirements.</p>

<h2>6. Your rights</h2>
<p>You may ask us to access, correct or delete the personal information we hold about you, or withdraw your consent to marketing messages, by contacting us using the details below. We will respond within a reasonable time, subject to any legal obligation to retain certain records.</p>

<h2>7. Children</h2>
<p>Our website is not directed at children under 18, and we do not knowingly collect their personal information.</p>

<h2>8. Changes to this policy</h2>
<p>We may update this policy from time to time. The latest version, with its "last updated" date, is always available on this page.</p>

<h2>9. Contact</h2>
<p>For privacy questions or requests, please reach us using the contact details below.</p>
$html$),

('shipping-policy', 'Shipping Policy', $html$
<p><em>Last updated: 24 September 2026</em></p>
<p>This policy explains how and when HerStyleCode ships your order. HerStyleCode sells fashion (artificial) jewellery and accessories.</p>

<h2>1. Where we ship</h2>
<p>We currently ship to addresses across India. We do not offer international shipping at this time.</p>

<h2>2. Processing time</h2>
<p>Orders are typically processed and dispatched within <strong>1-2 business days</strong> of confirmation. Orders placed on Sundays or public holidays are processed on the next business day. During sale periods, processing may take slightly longer.</p>

<h2>3. Delivery time</h2>
<p>Once dispatched, most orders are delivered within <strong>4-7 business days</strong>, depending on your location. Remote or hard-to-reach pincodes may take longer. Delivery dates are estimates and not guaranteed, as delays can occur because of courier issues, weather or other events outside our control.</p>

<h2>4. Shipping charges</h2>
<ul>
  <li><strong>Free shipping</strong> on prepaid (online payment) orders above <strong>₹999</strong>.</li>
  <li>A standard shipping fee of <strong>₹59</strong> applies to orders below that amount.</li>
  <li>The exact shipping charge is always shown at checkout before you pay.</li>
</ul>

<h2>5. Cash on Delivery (COD)</h2>
<p>COD is available for eligible pincodes and order values, and is shown at checkout when available. Please keep the exact amount ready at the time of delivery.</p>

<h2>6. Order tracking</h2>
<p>When your order is dispatched, we send you the courier name and tracking details by email or SMS/WhatsApp. You can also track your order any time on our <a href="/track-order">Track Order</a> page using your order number.</p>

<h2>7. Incorrect address or failed delivery</h2>
<p>Please make sure your address and phone number are correct. If the courier cannot deliver because of an incorrect address or because you were unreachable, the parcel may be returned to us. In that case we will contact you to re-ship it (additional shipping charges may apply) or cancel the order and refund the amount paid, less the shipping cost.</p>

<h2>8. Damaged or missing parcels</h2>
<p>If your parcel arrives damaged or tampered with, please record a short unboxing video and contact us within 48 hours of delivery. See our <a href="/page/returns-refund-policy">Returns &amp; Refund Policy</a> for next steps.</p>

<h2>9. Contact</h2>
<p>For shipping questions, please reach us using the contact details below.</p>
$html$),

('returns-refund-policy', 'Returns & Refund Policy', $html$
<p><em>Last updated: 24 September 2026</em></p>
<p>We want you to love your HerStyleCode jewellery. If something is not right, this policy explains how returns, replacements and refunds work.</p>
<p><strong>Please note:</strong> HerStyleCode sells fashion (artificial) jewellery. Our products are not made of real gold, silver or precious stones, and are priced and described accordingly on each product page.</p>

<h2>1. Return window</h2>
<p>You can request a return within <strong>7 days of delivery</strong>.</p>

<h2>2. Eligibility</h2>
<p>To be eligible, the item must be unused, unworn, and in its original packaging with all tags and accessories. For hygiene reasons, earrings that have been worn cannot be returned. Products showing signs of wear, damage after delivery, or damage caused by improper care are not eligible.</p>

<h2>3. Damaged, defective or wrong items</h2>
<p>If you receive a damaged, defective or wrong item, please contact us within <strong>48 hours of delivery</strong> with your order number and clear photos, and where possible an unboxing video. After verification we will send a free replacement or issue a full refund, including shipping charges, at your choice (subject to stock availability).</p>

<h2>4. How to request a return</h2>
<ol>
  <li>Contact us using the details below with your order number and the reason for return.</li>
  <li>Once approved, we will arrange a pickup or share instructions for sending the item back.</li>
  <li>After we receive and inspect the item, we will confirm your refund or replacement.</li>
</ol>

<h2>5. Refunds</h2>
<ul>
  <li>Approved refunds are issued to the <strong>original payment method</strong> (UPI, card, net banking or wallet) within <strong>5-7 business days</strong> after the returned item passes inspection. Your bank may take a few additional days to show the credit.</li>
  <li>For <strong>Cash on Delivery</strong> orders, the refund is sent by bank transfer or UPI to the details you share with us.</li>
  <li>Original shipping charges are refundable only if the return is due to our error (damaged, defective or wrong item). Return shipping for change-of-mind returns is borne by the customer.</li>
</ul>

<h2>6. Exchanges</h2>
<p>If you would like a different size or colour, contact us within the 7-day window and, subject to stock availability, we will arrange an exchange.</p>

<h2>7. Non-returnable items</h2>
<p>Gift cards, items purchased on final-clearance offers where marked "non-returnable", and items returned after the return window are not eligible.</p>

<h2>8. Contact</h2>
<p>To start a return or ask about a refund, please reach us using the contact details below. See also our <a href="/page/cancellation-policy">Cancellation Policy</a>.</p>
$html$),

('cancellation-policy', 'Cancellation Policy', $html$
<p><em>Last updated: 24 September 2026</em></p>
<p>This policy explains how you can cancel an order placed with HerStyleCode.</p>

<h2>1. Cancelling before dispatch</h2>
<p>You can cancel an order <strong>any time before it is shipped</strong> by contacting us with your order number using the details below. We will confirm the cancellation by email or message.</p>

<h2>2. Cancelling after dispatch</h2>
<p>Once an order has been shipped it can no longer be cancelled. You can still refuse delivery, or request a return after delivery under our <a href="/page/returns-refund-policy">Returns &amp; Refund Policy</a>.</p>

<h2>3. Refunds for cancelled orders</h2>
<ul>
  <li>For prepaid orders, the full amount is refunded to the original payment method within <strong>5-7 business days</strong> of the cancellation being confirmed.</li>
  <li>For Cash on Delivery orders no payment has been taken, so no refund is needed.</li>
</ul>

<h2>4. Cancellation by HerStyleCode</h2>
<p>We may cancel an order if an item is out of stock, if there is a pricing or listing error, if we cannot deliver to your pincode, or if we suspect fraud. In these cases you will be notified and any amount paid will be refunded in full within 5-7 business days.</p>

<h2>5. Failed or duplicate payments</h2>
<p>If money was deducted but your order was not confirmed, or you were charged twice, the amount is automatically refunded by the payment gateway to the source account, usually within 5-7 business days. If it is not, please contact us with your payment reference.</p>

<h2>6. Contact</h2>
<p>To cancel an order, please reach us using the contact details below as early as possible.</p>
$html$),

('contact-us', 'Contact Us', $html$
<p>We are happy to help with orders, shipping, returns, or anything else. Reach us using the details on this page or send us a message using the form, and we will get back to you within 1-2 business days.</p>
<p>HerStyleCode sells fashion (artificial) jewellery. Please include your order number when writing to us about an existing order.</p>
$html$)

on conflict (slug) do update
  set title = excluded.title,
      content = excluded.content;

-- Support email shown on the footer, Contact page and every policy page.
-- Merges into the existing store_info so phone/address/etc. are kept.
update public.store_settings
set value = value || '{"support_email":"herstylecodewebsite@gmail.com"}'::jsonb
where key = 'store_info';
