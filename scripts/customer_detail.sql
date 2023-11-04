-- Run a report on a specific customer....
SELECT u.last_name, p.date AS date, p.amount AS amount
FROM auth_user u
JOIN ffcsa_core_payment p ON u.id = p.user_id
WHERE p.date >= '2017-12-01' and u.last_name = 'Scoble'
UNION
SELECT u.last_name, o.time AS date, -o.total AS amount
FROM auth_user u
JOIN shop_order o ON u.id = o.user_id
WHERE o.time >= '2017-12-01' and u.last_name = 'Scoble';
