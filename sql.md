UPDATE product_productmedia
SET image = REPLACE(image, 'http://localhost:8000/', 'http://host.docker.internal:8000/');

UPDATE product_collection
SET background_image = REPLACE(background_image, 'http://localhost:8000/', 'http://host.docker.internal:8000/')
WHERE background_image IS NOT NULL;

-- You might also check other tables if you have custom models or other image fields
-- For example, for category background images if they exist:
UPDATE product_category
SET background_image = REPLACE(background_image, 'http://localhost:8000/', 'http://host.docker.internal:8000/')
WHERE background_image IS NOT NULL;