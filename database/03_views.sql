USE electrodb;

CREATE OR REPLACE VIEW v_component_catalogue AS
SELECT c.component_id,
       c.name AS component_name,
       c.slug,
       c.short_description,
       c.is_published,
       c.is_illustrative,
       cat.category_id,
       cat.name AS category_name,
       cat.slug AS category_slug,
       parent.category_id AS parent_category_id,
       parent.name AS parent_category_name
FROM components c
JOIN categories cat ON cat.category_id = c.category_id
LEFT JOIN categories parent ON parent.category_id = cat.parent_category_id;

CREATE OR REPLACE VIEW v_category_component_counts AS
SELECT cat.category_id,
       cat.name AS category_name,
       cat.slug AS category_slug,
       COUNT(c.component_id) AS component_count
FROM categories cat
LEFT JOIN components c ON c.category_id = cat.category_id
GROUP BY cat.category_id, cat.name, cat.slug;
