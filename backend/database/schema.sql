-- Define la estructura de la base de datos.
-- Aquí se crean las tablas, relaciones, claves primarias y foráneas.

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
    nombre varchar (15) NOT NULL,
    apellido varchar (15) NOT NULL,
    apodo varchar (15)
);

CREATE TABLE venta(
    id SERIAL PRIMARY KEY,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cuenta_pendiente boolean, 
    total decimal (10,4),
    cliente_id int,

    FOREIGN KEY (cliente_id) REFERENCES cliente(id)
);

CREATE TABLE detalle_venta (
    id SERIAL PRIMARY KEY,
    venta_id int not null,
    producto_id int not null,
    cantidad int not null,
    precio_unitario decimal (10,4) not NULL,  
    subtotal decimal (10,4) not null,

-- CONEXIONES ENTRE CLASES MUCHOS A MUCHOS
    FOREIGN KEY (venta_id) REFERENCES venta(id),
    FOREIGN KEY (producto_id) REFERENCES producto(id)
);

