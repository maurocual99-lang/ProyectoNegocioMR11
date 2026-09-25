/* Nombres extensos y cobro parcial al momento de vender. */

ALTER TABLE producto
ALTER COLUMN nombre TYPE VARCHAR(120);

ALTER TABLE venta
ADD COLUMN IF NOT EXISTS monto_pagado_inicial NUMERIC(12,2)
NOT NULL DEFAULT 0;

/*
  Compatibilidad con ventas anteriores:
  - una venta sin saldo ni pagos posteriores fue cobrada al contado;
  - una venta que tuvo aplicaciones en pago_venta nacio como deuda;
  - una deuda que todavia tiene saldo tampoco tuvo cobro inicial en versiones
    anteriores, porque la pantalla solo permitia contado o deuda completa.
*/
UPDATE venta v
SET monto_pagado_inicial =
  CASE
    WHEN v.finalizada = TRUE
      AND COALESCE(v.saldo_pendiente, 0) = 0
      AND NOT EXISTS (
        SELECT 1
        FROM pago_venta pv
        WHERE pv.venta_id = v.id
      )
    THEN COALESCE(v.total, 0)
    ELSE 0
  END;

ALTER TABLE venta
DROP CONSTRAINT IF EXISTS venta_monto_pagado_inicial_valido;

ALTER TABLE venta
ADD CONSTRAINT venta_monto_pagado_inicial_valido
CHECK (
  monto_pagado_inicial >= 0
  AND monto_pagado_inicial <= COALESCE(total, monto_pagado_inicial)
);
