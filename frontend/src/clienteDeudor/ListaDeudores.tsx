import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CCard, CCardBody, CButton, CFormCheck, CListGroup, CListGroupItem } from '@coreui/react';
import { User, ArrowLeft } from 'lucide-react';

export default function ListaDeudores() {
  const navigate = useNavigate();

  // Estados para la lista de clientes
  const [clientesMorosos, setClientesMorosos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  
  // Estados para las deudas del cliente seleccionado
  const [ventasPendientes, setVentasPendientes] = useState([]);
  const [ventasSeleccionadas, setVentasSeleccionadas] = useState([]);
  const [totalAPagar, setTotalAPagar] = useState(0);

  // Endpoint base según tu archivo venta.js
  const API_URL = "http://localhost:3000/ventas";

  // Busca los clientes morosos
  useEffect(() => {
    cargarClientesMorosos();
  }, []);

  const cargarClientesMorosos = async () => {
    try {
      const res = await fetch(`${API_URL}/deudores`);
      const data = await res.json();
      setClientesMorosos(data);
    } catch (error) {
      console.error("Error al cargar clientes morosos:", error);
    }
  };

  const seleccionarCliente = async (cliente) => {
    setClienteSeleccionado(cliente);
    // Buscamos sus boletas
    try {
      const res = await fetch(`${API_URL}/deudas/${cliente.id}`);
      const data = await res.json();
      setVentasPendientes(data);
      setVentasSeleccionadas([]);
      setTotalAPagar(0);
    } catch (error) {
      console.error("Error al cargar deudas del cliente:", error);
    }
  };

  const toggleSeleccion = (ventaId, total) => {
    setVentasSeleccionadas((prev) => {
      const yaSeleccionado = prev.includes(ventaId);
      if (yaSeleccionado) {
        setTotalAPagar((prevTotal) => prevTotal - Number(total));
        return prev.filter((id) => id !== ventaId);
      } else {
        setTotalAPagar((prevTotal) => prevTotal + Number(total));
        return [...prev, ventaId];
      }
    });
  };


  const confirmarPago = async () => {
    try {
      const res = await fetch(`${API_URL}/pagar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ventas_ids: ventasSeleccionadas })
      });
      
      if (res.ok) {
        alert("Pago registrado correctamente");
        setClienteSeleccionado(null);
        cargarClientesMorosos();
      }
    } catch (error) {
      console.error("Error al pagar:", error);
    }
  };

  //Ver cliente seleccionado
  if (!clienteSeleccionado) {
    return (
      <CCard className="mt-3 shadow-sm border-0">
        <CCardBody>
          <div className="d-flex align-items-center mb-4 gap-3">
            <CButton color="light" onClick={() => navigate(-1)} size="sm">
              <ArrowLeft size={16} /> Volver
            </CButton>
            <h5 className="fw-bold m-0">Clientes con Deuda Activa</h5>
          </div>

          {clientesMorosos.length === 0 ? (
            <p className="text-muted">¡Excelente! Ningun cliente debe dinero.</p>
          ) : (
            <CListGroup>
              {clientesMorosos.map((cliente) => (
                <CListGroupItem 
                  key={cliente.id} 
                  component="button"
                  onClick={() => seleccionarCliente(cliente)}
                  className="d-flex align-items-center justify-content-between p-3"
                  style={{ cursor: "pointer", transition: "0.2s" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <User size={20} className="text-primary" />
                    <div>
                      <h6 className="mb-0 fw-bold">{cliente.apellido}, {cliente.nombre}</h6>
                      {cliente.apodo && <small className="text-muted">Alias: {cliente.apodo}</small>}
                    </div>
                  </div>
                  <CButton color="light" size="sm">Ver deudas</CButton>
                </CListGroupItem>
              ))}
            </CListGroup>
          )}
        </CCardBody>
      </CCard>
    );
  }

  // ver boletas del clietne
  return (
    <CCard className="mt-3 shadow-sm border-0">
      <CCardBody>
        <div className="d-flex align-items-center mb-4 gap-3">
          <CButton color="light" onClick={() => setClienteSeleccionado(null)} size="sm">
            <ArrowLeft size={16} /> Volver a la lista
          </CButton>
          <h5 className="fw-bold m-0">
            Cobrando a: <span className="text-primary">{clienteSeleccionado.apellido}, {clienteSeleccionado.nombre}</span>
          </h5>
        </div>
        
        {ventasPendientes.length === 0 ? (
          <p className="text-muted">Este cliente ya no tiene boletas pendientes.</p>
        ) : (
          <div>
            {ventasPendientes.map((venta) => (
              <div 
                key={venta.id} 
                className="d-flex justify-content-between align-items-center p-3 mb-2 border rounded"
                style={{ backgroundColor: ventasSeleccionadas.includes(venta.id) ? "#eef4ff" : "#fff" }}
              >
                <div>
                  <CFormCheck 
                    id={`venta-${venta.id}`}
                    label={`Ticket #${venta.id} - ${new Date(venta.fecha_venta).toLocaleDateString()}`}
                    checked={ventasSeleccionadas.includes(venta.id)}
                    onChange={() => toggleSeleccion(venta.id, venta.total)}
                  />
                </div>
                <div className="fw-bold text-danger">
                  ${Number(venta.total).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}

        <hr />
        
        <div className="d-flex justify-content-between align-items-center mt-3">
          <h4 className="fw-bold m-0">Total a Pagar: <span className="text-primary">${totalAPagar.toFixed(2)}</span></h4>
          <CButton 
            color="success" 
            disabled={ventasSeleccionadas.length === 0}
            onClick={confirmarPago}
          >
            Confirmar Pago
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  );
}