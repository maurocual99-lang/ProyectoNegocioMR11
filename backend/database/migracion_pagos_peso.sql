/* =========================================================
   PRODUCTOS POR UNIDAD / PESO
========================================================= */

DO $$
BEGIN
    CREATE TYPE tipo_venta_producto AS ENUM ('UNIDAD', 'PESO');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


/* Código de barras opcional.
   Verduras, frutas, fiambres, etc. pueden no tener código. */
ALTER TABLE producto
ALTER COLUMN codigo_barra DROP NOT NULL;


/* Stock decimal:
   2.500 = 2,5 kg
   0.350 = 350 gramos
*/
ALTER TABLE producto
ALTER COLUMN stock TYPE NUMERIC(12,3)
USING stock::NUMERIC;


/* Cómo se vende el producto */
ALTER TABLE producto
ADD COLUMN IF NOT EXISTS tipo_venta tipo_venta_producto
NOT NULL DEFAULT 'UNIDAD';


/* La cantidad del detalle también debe aceptar kg */
ALTER TABLE detalle_venta
ALTER COLUMN cantidad TYPE NUMERIC(12,3)
USING cantidad::NUMERIC;


/* =========================================================
   DEUDAS
========================================================= */

/*
   reporte.js ya utiliza finalizada,
   así que la dejamos garantizada en la BD.
*/
ALTER TABLE venta
ADD COLUMN IF NOT EXISTS finalizada BOOLEAN
NOT NULL DEFAULT FALSE;


/*
   total = importe original
   saldo_pendiente = lo que todavía debe
*/
ALTER TABLE venta
ADD COLUMN IF NOT EXISTS saldo_pendiente NUMERIC(12,2)
NOT NULL DEFAULT 0;


/* Inicializar las deudas que ya existen */
UPDATE venta
SET saldo_pendiente =
    CASE
        WHEN cuenta_pendiente = TRUE
            THEN total
        ELSE 0
    END
WHERE saldo_pendiente = 0;


/* =========================================================
   PAGOS
========================================================= */

CREATE TABLE IF NOT EXISTS pago (
    id SERIAL PRIMARY KEY,

    cliente_id INT NOT NULL,

    fecha_pago TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    total NUMERIC(12,2)
        NOT NULL
        CHECK (total > 0),

    FOREIGN KEY (cliente_id)
        REFERENCES cliente(id)
);


/*
   Un pago puede cancelar varias ventas.
   Una venta también puede recibir varios pagos.
*/
CREATE TABLE IF NOT EXISTS pago_venta (
    id SERIAL PRIMARY KEY,

    pago_id INT NOT NULL,

    venta_id INT NOT NULL,

    importe NUMERIC(12,2)
        NOT NULL
        CHECK (importe > 0),

    FOREIGN KEY (pago_id)
        REFERENCES pago(id)
        ON DELETE CASCADE,

    FOREIGN KEY (venta_id)
        REFERENCES venta(id)
);


/* Índices */
CREATE INDEX IF NOT EXISTS idx_pago_cliente
ON pago(cliente_id);

CREATE INDEX IF NOT EXISTS idx_pago_fecha
ON pago(fecha_pago);

CREATE INDEX IF NOT EXISTS idx_pago_venta_venta
ON pago_venta(venta_id);