-- Una base antigua puede tener el tipo sin esta categoria.
-- Fuera de una transaccion por compatibilidad con PostgreSQL anterior a 12.
ALTER TYPE categoria_productos ADD VALUE IF NOT EXISTS 'Verduleria';
