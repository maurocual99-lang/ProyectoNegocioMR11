import {useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";

const categorias = [
  "Bebidas",
  "Kiosco",
  "Fiambres",
  "Almacen",
  "Regaleria",
  "Verduleria",
] as const;

type Categoria = typeof categorias[number];

interface Producto {
    codigo_barra: string;
    nombre: string;
    precio: number;
    stock: number;
    categoria: Categoria;
}

function Producto(){
    const navigate = useNavigate();

    const [productos, setProductos] = useState<Producto[]>([]);
    const [codigoViejo, setCodigoViejo] = useState("");
    const [codigoNuevo, setCodigoNuevo] = useState("");
    const [nombre, setNombre] = useState("");
    const [precio, setPrecio] = useState(0);
    const [ganancia, setGanancia] = useState("63")
    const [stock, setStock] = useState(0);
    const [categoria, setCategoria] = useState("");
    const [mostrarModal, setMostrarModal] = useState(false);

    useEffect(() =>{
        cargarProductos();
    },[]);

    const precioFinal =
        Number(precio || 0) * (1 + Number(ganancia||0)/100);

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
        setCategoria(producto.categoria);
        
        setMostrarModal(true);
    }

    async function guardarCambios() {
        const producto = {
            codigoViejo: codigoViejo,
            codigoNuevo: codigoNuevo,
            nombre: nombre,
            precio: Number(precioFinal.toFixed(2)),
            stock: stock,
            categoria: categoria,
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
                            <th>Categoría</th>
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
                                        <td>{producto.categoria}</td>
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
                    <div className="modal" >
                        <form className="modal-content producto-form">
                            <h2 className="campo-completo" style={{ textAlign: "center" }}>Editar Producto</h2>
                            <div className="campo">
                                <label>Codigo De Barras</label>
                                <input
                                    value={codigoNuevo}
                                    onChange={(e)=>setCodigoNuevo(e.target.value)}
                                />
                            </div>
                            <div className="campo">
                                <label>Nombre</label>
                                <input
                                    value={nombre}
                                    onChange={(e)=>setNombre(e.target.value)}
                                />
                            </div>
                            
                            <div className="campo">
                            <label>Costo del Producto ($)</label>
                                <input
                                    type="number"
                                    value={precio}
                                    onChange={(e)=>setPrecio(Number(e.target.value))}
                                />
                            </div>
                            
                            <div className="campo">
                                <label>Ganancia (%)</label>
                                <input
                                    type="number"
                                    value={ganancia}
                                    onChange={(e)=>setGanancia((e.target.value))}
                                />
                            </div>

                            <div className="campo">
                                <label>Precio de Venta ($)</label>
                                <input
                                    type="number"
                                    value={precioFinal.toFixed(2)}
                                    readOnly
                                    className="precio"
                                />
                            </div>
                            
                            <div className="campo">
                                <label>Stock</label>
                                <input
                                    type="number"
                                    value={stock}
                                    onChange={(e)=>setStock(Number(e.target.value))}
                                />
                            </div>
                            <div className="campo campo-completo">
                                <label>Categoría</label>

                                <select
                                value={categoria}
                                onChange={(e) => setCategoria(e.target.value)}
                                >
                                {categorias.map((cat) => (
                                    <option key={cat} value={cat}>
                                    {cat}
                                    </option>
                                ))}
                                </select>
                            </div>

                            <div className="modal-botones">
                                <button type="button" className="btn-volver"
                                    onClick={()=> setMostrarModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="button"
                                    className="btn-guardar"
                                    onClick={guardarCambios}
                                    >
                                    Guardar
                                </button>
                            </div>
                        </form>    
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
