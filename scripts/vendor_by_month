# report on vendor orders by month
select  monthname(o.time), s.vendor,sum(s.quantity*v.vendor_price) 
from shop_orderitem s 
	left join shop_productvariation v on v.sku = s.sku  
	left join shop_order o on o.id = s.order_id 
	where date(o.time) >= '2023-01-01'  
	group by month(o.time),monthname(o.time),s.vendor 
	order by month(o.time),monthname(o.time),sum(s.quantity*v.vendor_price) DESC;
