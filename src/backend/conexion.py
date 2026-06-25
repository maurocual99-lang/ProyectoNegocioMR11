
import sqlite3
import os

def conectar_bd():
    # 1. Definimos la ruta donde se guardará la base de datos (subiendo dos niveles desde backend)
    ruta_actual = os.path.dirname(os.path.abspath(__file__))
    ruta_proyecto = os.path.dirname(os.path.dirname(ruta_actual))
    ruta_data = os.path.join(ruta_proyecto, 'data')
    
    # 2. Si la carpeta 'data' no existe, la creamos para que el programa no tire error
    if not os.path.exists(ruta_data):
        os.makedirs(ruta_data)
        
    # 3. Definimos la ruta final del archivo de la base de datos
    ruta_bd = os.path.join(ruta_data, 'negocio.db')
    
    # 4. Nos conectamos a SQLite (si el archivo no existe, SQLite lo crea automáticamente)
    try:
        conexion = sqlite3.connect(ruta_bd)
        print("¡Conexión exitosa a la base de datos local!")
        return conexion
    except sqlite3.Error as e:
        print(f"Error al conectar con la base de datos: {e}")
        return None

# Pequeña prueba para ver si funciona cuando ejecutamos este archivo directamente
if __name__ == "__main__":
    conn = conectar_bd()
    if conn:
        conn.close() # Cerramos la conexión después de probar