/* =========================================================
   MR11 - ESQUEMA INICIAL
========================================================= */


/* =========================================================
   TIPOS
========================================================= */

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'categoria_productos'
  ) THEN

    CREATE TYPE categoria_productos AS ENUM (
      'Bebidas',
      'Kiosco',
      'Fiambres',
      'Almacen',
      'Regaleria',
      'Verduleria'
    );

  END IF;

END
$$;


DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'tipo_venta_producto'
  ) THEN

    CREATE TYPE tipo_venta_producto AS ENUM (
      'UNIDAD',
      'PESO'
    );

  END IF;

END
$$;


/* =========================================================
   PRODUCTOS
========================================================= */

CREATE TABLE IF NOT EXISTS producto (

  id SERIAL PRIMARY KEY,

  codigo_barra VARCHAR(20)
    UNIQUE,

  stock NUMERIC(12,3),

  categoria categoria_productos,

  precio DECIMAL(10,4),

  nombre VARCHAR(20),

  activo BOOLEAN
    DEFAULT TRUE,

  tipo_venta tipo_venta_producto
    NOT NULL
    DEFAULT 'UNIDAD'

);


/*
  Compatibilidad con una BD vieja.
*/

ALTER TABLE producto
ALTER COLUMN codigo_barra
DROP NOT NULL;


ALTER TABLE producto
ALTER COLUMN stock
TYPE NUMERIC(12,3)
USING stock::NUMERIC;


ALTER TABLE producto
ADD COLUMN IF NOT EXISTS activo
BOOLEAN DEFAULT TRUE;


ALTER TABLE producto
ADD COLUMN IF NOT EXISTS tipo_venta
tipo_venta_producto
NOT NULL
DEFAULT 'UNIDAD';


/* =========================================================
   CLIENTES
========================================================= */

CREATE TABLE IF NOT EXISTS cliente (

  id SERIAL PRIMARY KEY,

  nombre VARCHAR(15)
    NOT NULL,

  apellido VARCHAR(15)
    NOT NULL,

  apodo VARCHAR(15)

);


/* =========================================================
   VENTAS
========================================================= */

CREATE TABLE IF NOT EXISTS venta (

  id SERIAL PRIMARY KEY,

  fecha_venta TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

  cuenta_pendiente BOOLEAN
    DEFAULT FALSE,

  total DECIMAL(10,4),

  cliente_id INT,

  finalizada BOOLEAN
    NOT NULL
    DEFAULT FALSE,

  saldo_pendiente NUMERIC(12,2)
    NOT NULL
    DEFAULT 0,

  FOREIGN KEY (
    cliente_id
  )
  REFERENCES cliente(id)

);


/*
  Compatibilidad con versiones anteriores.
*/

ALTER TABLE venta
ADD COLUMN IF NOT EXISTS finalizada
BOOLEAN NOT NULL
DEFAULT FALSE;


/*
  Si saldo_pendiente todavía no existe,
  lo agregamos y migramos las deudas
  anteriores una sola vez.
*/

DO $$
BEGIN

  IF NOT EXISTS (

    SELECT 1

    FROM information_schema.columns

    WHERE
      table_schema = 'public'
      AND table_name = 'venta'
      AND column_name = 'saldo_pendiente'

  ) THEN

    ALTER TABLE venta
    ADD COLUMN saldo_pendiente
    NUMERIC(12,2)
    NOT NULL
    DEFAULT 0;


    UPDATE venta

    SET saldo_pendiente =
      CASE

        WHEN cuenta_pendiente = TRUE
          THEN COALESCE(
            total,
            0
          )

        ELSE 0

      END;

  END IF;

END
$$;


/* =========================================================
   DETALLE DE VENTA
========================================================= */

CREATE TABLE IF NOT EXISTS detalle_venta (

  id SERIAL PRIMARY KEY,

  venta_id INT NOT NULL,

  producto_id INT NOT NULL,

  cantidad NUMERIC(12,3)
    NOT NULL,

  precio_unitario
    DECIMAL(10,4)
    NOT NULL,

  subtotal
    DECIMAL(10,4)
    NOT NULL,

  FOREIGN KEY (
    venta_id
  )
  REFERENCES venta(id),

  FOREIGN KEY (
    producto_id
  )
  REFERENCES producto(id)

);


ALTER TABLE detalle_venta
ALTER COLUMN cantidad
TYPE NUMERIC(12,3)
USING cantidad::NUMERIC;


/* =========================================================
   PAGOS
========================================================= */

CREATE TABLE IF NOT EXISTS pago (

  id SERIAL PRIMARY KEY,

  cliente_id INT
    NOT NULL,

  fecha_pago TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  total NUMERIC(12,2)
    NOT NULL
    CHECK (
      total > 0
    ),

  FOREIGN KEY (
    cliente_id
  )
  REFERENCES cliente(id)

);


/* =========================================================
   PAGOS / VENTAS
========================================================= */

CREATE TABLE IF NOT EXISTS pago_venta (

  id SERIAL PRIMARY KEY,

  pago_id INT
    NOT NULL,

  venta_id INT
    NOT NULL,

  importe NUMERIC(12,2)
    NOT NULL
    CHECK (
      importe > 0
    ),

  FOREIGN KEY (
    pago_id
  )
  REFERENCES pago(id)
  ON DELETE CASCADE,

  FOREIGN KEY (
    venta_id
  )
  REFERENCES venta(id)

);


/* =========================================================
   ÍNDICES
========================================================= */

CREATE INDEX IF NOT EXISTS
idx_pago_cliente
ON pago(cliente_id);


CREATE INDEX IF NOT EXISTS
idx_pago_fecha
ON pago(fecha_pago);


CREATE INDEX IF NOT EXISTS
idx_pago_venta_venta
ON pago_venta(venta_id);