# report on vendor orders by month.  This script defaults to the previous month
select  o.time,s.vendor,s.description,s.quantity,v.vendor_price,s.quantity * v.vendor_price as amount
from shop_orderitem s 
	left join shop_productvariation v on v.sku = s.sku  
	left join shop_order o on o.id = s.order_id 
	where 
	  (s.vendor = "Camas Swale Farm" OR
	  s.vendor = "Confluence Farm" OR
	  s.vendor = "Gathering Together Farm" OR
	  s.vendor = "Grazier's Garden" OR
	  s.vendor = "Graziers Garden" OR
	  s.vendor = "L'Etoile Farm" OR
	  s.vendor = "Little Wings" OR
	  s.vendor = "OGC" OR
	  s.vendor = "Small is Beautiful Farm" OR
	  s.vendor = "Sweet Leaf Organic Farm") AND
	   o.time > '2022-08-31 00:00:00' AND o.time < '2023-09-01 00:00:00' AND
	   s.quantity > 0
	order by o.time ASC

