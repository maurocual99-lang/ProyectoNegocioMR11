-- Define la estructura de la base de datos.
-- Usar este archivo para instalaciones nuevas.
-- Si la base ya existe, NO vuelvas a ejecutar todo este schema:
-- ejecutá database/migracion_reportes.sql.

CREATE TYPE categoria_productos AS ENUM (
  'Bebidas',
  'Kiosco',
  'Fiambres',
  'Almacen',
  'Regaleria',
  'Verduleria'
);

CREATE TABLE producto (
  id SERIAL PRIMARY KEY,
  codigo_barra varchar(20) UNIQUE NOT NULL,
  stock int,
  categoria categoria_productos,
  precio decimal(10,4),
  nombre varchar(20),
  activo boolean DEFAULT TRUE
);

CREATE TABLE cliente (
  id SERIAL PRIMARY KEY,
  nombre varchar(15) NOT NULL,
  apellido varchar(15) NOT NULL,
  apodo varchar(15)
);

CREATE TABLE venta (
  id SERIAL PRIMARY KEY,
  fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cuenta_pendiente boolean DEFAULT FALSE,
  total decimal(10,4),
  cliente_id int,
  finalizada boolean NOT NULL DEFAULT FALSE,

  FOREIGN KEY (cliente_id) REFERENCES cliente(id)
);

CREATE TABLE detalle_venta (
  id SERIAL PRIMARY KEY,
  venta_id int NOT NULL,
  producto_id int NOT NULL,
  cantidad int NOT NULL,
  precio_unitario decimal(10,4) NOT NULL,
  subtotal decimal(10,4) NOT NULL,

  FOREIGN KEY (venta_id) REFERENCES venta(id),
  FOREIGN KEY (producto_id) REFERENCES producto(id)
);
