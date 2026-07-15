import {useEffect, useState} from "react";

interface Producto {
    codigo_barra: string;
    nombre: string;
    precio: number;
    stock: number;
}

function Producto(){
    const [productos, setProductos] = useState<Producto[]>([]);
    const [codigo, setCodigo] = useState("");
    const [nombre, setNombre] = useState("");
    const [precio, setPrecio] = useState(0);
    const [stock, setStock] = useState(0);

    useEffect(() =>{
        cargarProductos();
    },[]);

    async function cargarProductos() {
        const res = await fetch("http://localhost:3000/producto");

        const datos = await res.json();
        
        setProductos(datos);
    }

    function editarProducto(producto: Producto){
        setCodigo(producto.codigo_barra);
        setNombre(producto.nombre);
        setPrecio(producto.precio);
        setStock(producto.stock);
    }

    async function guardarCambios() {
        const producto = {
            codigo_barra: codigo,
            nombre: nombre,
            precio: precio,
            stock: stock
        };

        await fetch("http://localhost:3000/producto",
            {
            method: "PUT",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(producto)
            }
        );
        cargarProductos();
        }
    
    return(
        <>
            <h2>Productos</h2>
            <table>
                <tbody>
                    {
                        productos.map((producto =>(
                            <tr key={producto.codigo_barra}> 
                                <td>{producto.nombre}</td>
                                <td>{producto.precio}</td>
                                <td>{producto.stock}</td>
                                <td>
                                    <button
                                        onClick={()=> editarProducto(producto)}
                                    >
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        )))
                    }
                </tbody>
            </table>
            <hr/>
            <input
                value={nombre}
                onChange={(e)=>setNombre(e.target.value)}
            />
            <input
                type="number"
                value={precio}
                onChange={(e)=>setPrecio(Number(e.target.value))}
            />
            <input
                type="number"
                value={stock}
                onChange={(e)=>setStock(Number(e.target.value))}
            />
            <button onClick={guardarCambios}>
                Guardar Cambios
            </button>
        </>
    );
}
export default Producto;   
