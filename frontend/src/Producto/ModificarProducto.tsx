import {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";

interface Producto {
    codigo_barra: string;
    nombre: string;
    precio: number;
    stock: number;
}

function Producto(){
    const navigate = useNavigate();

    const [productos, setProductos] = useState<Producto[]>([]);
    const [codigoViejo, setCodigoViejo] = useState("");
    const [codigoNuevo, setCodigoNuevo] = useState("");
    const [nombre, setNombre] = useState("");
    const [precio, setPrecio] = useState(0);
    const [stock, setStock] = useState(0);
    const [mostrarModal, setMostrarModal] = useState(false);

    useEffect(() =>{
        cargarProductos();
    },[]);

    async function cargarProductos() {
        const res = await fetch("http://localhost:3000/productos");

        const datos = await res.json();
        
        setProductos(datos);
    }

    function editarProducto(producto: Producto){
        setCodigoViejo(producto.codigo_barra);
        setCodigoNuevo(producto.codigo_barra);
        setNombre(producto.nombre);
        setPrecio(producto.precio);
        setStock(producto.stock);
        
        setMostrarModal(true);
    }

    async function guardarCambios() {
        const producto = {
            codigoViejo: codigoViejo,
            codigoNuevo: codigoNuevo,
            nombre: nombre,
            precio: precio,
            stock: stock
        };

        await fetch("http://localhost:3000/productos",
            {
            method: "PUT",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(producto)
            }
        );
        cargarProductos();

        setMostrarModal(false);
        }
    
    return(
        <div className="producto-page">
            <div className="producto-card">
                <h1>Modificar Productos</h1>
                <table className="tabla-productos">
                    <thead>
                        <tr>
                            <th>Codigo De Barras</th>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Accion</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            productos.map((producto =>(
                                <tr key={producto.codigo_barra}>
                                        <td>{producto.codigo_barra}</td> 
                                        <td>{producto.nombre}</td>
                                        <td>{producto.precio}</td>
                                        <td>{producto.stock}</td>
                                    <td>
                                        <button className="btn-editar"
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
                {mostrarModal &&(
                    <div className="modal">
                        <div className="modal-content">
                            <h2>Editar Producto</h2>
                            <label>Codigo De Barras</label>
                            <input
                                value={codigoNuevo}
                                onChange={(e)=>setCodigoNuevo(e.target.value)}
                            />
                            <label>Nombre</label>
                            <input
                                value={nombre}
                                onChange={(e)=>setNombre(e.target.value)}
                            />
                            <label>Precio</label>
                            <input
                                type="number"
                                value={precio}
                                onChange={(e)=>setPrecio(Number(e.target.value))}
                            />
                            <label>Stock</label>
                            <input
                                type="number"
                                value={stock}
                                onChange={(e)=>setStock(Number(e.target.value))}
                            />
                            <div className="modal-botones">
                                <button className="btn-volver"
                                    onClick={()=> setMostrarModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    className="btn-guardar"
                                    onClick={guardarCambios}>
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                        className="btn-volver"
                        type="button"
                        onClick={() => navigate("/menu")}
                        >
                        Volver
                    </button>
                </div>
            </div>
        </div>
        
    );
}
export default Producto;   
