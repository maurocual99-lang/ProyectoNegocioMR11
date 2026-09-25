/*
 * Permite cargar saldos que existian antes de comenzar a usar MR11.
 * Se guardan en la cuenta corriente, pero se distinguen de una venta real
 * para no alterar la facturacion ni los movimientos de stock.
 */

ALTER TABLE venta
ADD COLUMN IF NOT EXISTS es_saldo_inicial BOOLEAN
NOT NULL DEFAULT FALSE;

ALTER TABLE venta
ADD COLUMN IF NOT EXISTS concepto VARCHAR(160);

