UPDATE "users"
SET "role" = 'ADMIN'
WHERE LOWER(email) = '3bdullahelsherif@gmail.com';

SELECT id, email, role
FROM "users"
WHERE LOWER(email) = '3bdullahelsherif@gmail.com';
