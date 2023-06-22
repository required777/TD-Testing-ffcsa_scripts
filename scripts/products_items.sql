# report on vendor orders by month.  This script defaults to the previous month
select  monthname(o.time), s.vendor,s.description,sum(s.quantity*v.vendor_price) 
from shop_orderitem s 
	left join shop_productvariation v on v.sku = s.sku  
	left join shop_order o on o.id = s.order_id 
	where 
	    YEAR(o.time) = YEAR(CURDATE() - INTERVAL 1 MONTH) 	group by month(o.time),monthname(o.time),s.vendor,s.description
	order by month(o.time),monthname(o.time),sum(s.quantity*v.vendor_price) DESC;
