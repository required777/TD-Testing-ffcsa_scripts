select p.title,p.description, p.content,p.vendor_price,p.unit_price,p.unit,p.weight,p.sku,p.num_in_stock,v.title as vendor_title
from shop_product p,shop_productvariation pv,shop_vendor v, shop_vendorproductvariation vpv
where vpv.vendor_id = v.id and pv.product_id = p.id  and pv.id = vpv.variation_id
