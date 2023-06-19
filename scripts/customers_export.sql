select 
 u.first_name,
 u.last_name,
 u.email,
 p.drop_site,
 p.phone_number,
 a.street,
 a.state,
 a.city,
 a.zip,
 p.home_delivery,
 p.delivery_notes,
 p.notes as customer_notes,
 remaining_budget
from auth_user u
 join ffcsa_core_profile as p on p.user_id = u.id
 left join ffcsa_core_address as a on p.`delivery_address_id` =a.id
 join (select payment_total - order_total as remaining_budget, o.user_id as user_id
    from (select sum(total) as order_total, user_id from `shop_order` where date(time) >= '2017-12-01' group by user_id) as o
    join (select sum(amount) as payment_total, user_id from ffcsa_core_payment group by user_id) as p on o.user_id = p.user_id) as b
    ON b.user_id = u.id
