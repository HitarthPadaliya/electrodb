USE electrodb;

DELIMITER $$

DROP FUNCTION IF EXISTS fn_sum_component_ids$$
CREATE FUNCTION fn_sum_component_ids()
RETURNS DECIMAL(30,0)
READS SQL DATA
DETERMINISTIC
BEGIN
  DECLARE v_total DECIMAL(30,0);
  SELECT COALESCE(SUM(component_id), 0) INTO v_total FROM components;
  RETURN v_total;
END$$

DELIMITER ;
