/* Teléfono opcional para abrir el comprobante en WhatsApp. */

ALTER TABLE cliente
ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

