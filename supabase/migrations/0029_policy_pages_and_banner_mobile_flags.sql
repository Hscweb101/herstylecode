-- Replace Terms, Shipping and Returns/Refunds pages with the new policy text; Cancellation page is merged into Returns / Refunds / Cancellations.
-- Privacy Policy is left unchanged.
update public.static_pages set title = 'Terms & Conditions', content = $html$
<p><em>Last updated: 17 October 2026</em></p>
<p>By visiting or placing an order on the HerStyleCode website, you agree to the following terms and conditions.</p>
<h2>1. About HerStyleCode</h2>
<p>HerStyleCode is an online store offering Contemporary, Stone and fashion jewellery in India. Our products are not made of real gold, silver or precious stones unless specifically mentioned on the product page.</p>
<h2>2. Products &amp; Pricing</h2>
<p>All prices displayed on our website are in Indian Rupees (INR). Product colours and appearance may vary slightly due to lighting, photography and individual screen settings. Prices, offers and product availability may change without prior notice.</p>
<h2>3. Orders &amp; Payments</h2>
<p>We accept payments through UPI, Credit/Debit Cards, Net Banking and Paytm. An order is confirmed only after successful payment.</p>
<h2>4. Order Cancellation</h2>
<p>Orders cannot be cancelled once they have been placed, except where cancellation is accepted by HerStyleCode before dispatch. For further details, please refer to our <a href="/page/returns-refund-policy">Returns / Refunds / Cancellations Policy</a>.</p>
<h2>5. Shipping, Returns &amp; Refunds</h2>
<p>Shipping, returns, and refunds are governed by our <a href="/page/shipping-policy">Shipping Policy</a> and <a href="/page/returns-refund-policy">Returns / Refunds / Cancellations Policy</a>, which form part of these Terms &amp; Conditions.</p>
<h2>6. Product Care</h2>
<p>Please keep jewellery away from water, perfume, lotions, chemicals and excessive sweat. Store your jewellery in a dry place or pouch when not in use. Damage caused by improper use or care may not be covered under our return policy.</p>
<h2>7. Intellectual Property &amp; Commercial Use</h2>
<p>All HerStyleCode intellectual property and brand assets, including the HerStyleCode name, logo, photographs, product images, text, graphics, designs and other website content, are owned by HerStyleCode or are used under applicable licence or with the permission of the respective rights holder.</p>
<p>Such content is provided for personal, non-commercial use only. No part of the website or its content may be copied, reproduced, modified, distributed, published, displayed, republished, sold, licensed or commercially exploited without the prior written permission of HerStyleCode or the applicable rights holder.</p>
<h2>8. Changes to Terms</h2>
<p>HerStyleCode may update these Terms &amp; Conditions from time to time. The latest version published on this page will apply to your use of the website and orders placed after the update.</p>
<h2>9. Governing Law</h2>
<p>These Terms &amp; Conditions are governed by the laws of India. Any dispute will be subject to the applicable courts in India.</p>
$html$ where slug = 'terms-conditions';

update public.static_pages set title = 'Shipping Policy', content = $html$
<p><strong>READY TO REACH YOU</strong>.</p>
<p>At HerStyleCode, we aim to dispatch your orders within 1–2 business days of order confirmation. We deliver across India, and you can expect your order to arrive within 4–7 business days after dispatch, depending on your location.</p>
<p>Please note that orders placed on Sundays or Government/Public Holidays will begin processing on the following business day. During sale periods or high-demand occasions, processing and delivery may take slightly longer.</p>
<p>Once your order has been dispatched, you will receive your tracking details by email or SMS/WhatsApp, so you can easily track your order.</p>
<p>Please record a complete, continuous video while unboxing your parcel as soon as it is delivered to your doorstep. Make sure the video clearly shows the outer packaging, shipping label, parcel condition and the product inside. If the parcel appears damaged, torn, opened or tampered with at the time of delivery, contact us within 24 hours of delivery. Please refer to our <a href="/page/returns-refund-policy">Returns / Refunds / Cancellations Policy</a> for further assistance.</p>
<p>If you have any questions about your order or delivery, please get in touch with our customer support team and we’ll be happy to assist you.</p>
$html$ where slug = 'shipping-policy';

update public.static_pages set title = 'Returns / Refunds / Cancellations', content = $html$
<ul>
<li><strong>Prices mentioned on our products are inclusive of applicable taxes.</strong></li>
<li>All orders are dispatched within <strong>7 working days</strong> from the date of purchase and may take up to <strong>6–7 working days</strong> for domestic delivery.</li>
<li>We do not offer <strong>returns, refunds or cancellations</strong> once an order has been placed, <strong>except in cases where the product is received damaged, defective or incorrect</strong>.</li>
<li><strong>Please record a complete, continuous &amp; clear video while unboxing your parcel as soon as it is delivered to your doorstep.</strong> Make sure the video clearly shows the outer packaging, shipping label, parcel condition and the product inside. If the parcel appears <strong>damaged, torn, opened or tampered with</strong> at the time of delivery, please contact us within <strong>24 hours of delivery</strong>. After verification, we will arrange a replacement or refund, subject to availability.</li>
<li>All payments are accepted through <strong>UPI, Credit/Debit Cards, Net Banking and Paytm</strong>.</li>
</ul>
$html$ where slug = 'returns-refund-policy';

delete from public.static_pages where slug = 'cancellation-policy';

-- Banner: per-element hide flags for mobile
alter table public.banners
  add column if not exists hide_title_mobile boolean not null default false,
  add column if not exists hide_subtitle_mobile boolean not null default false,
  add column if not exists hide_button_mobile boolean not null default false;
