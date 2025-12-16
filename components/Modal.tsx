import React from "react";
import { XIcon } from "./icons"; // Asumiendo que XIcon está definido en icons.tsx

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave: () => void;
  hideSaveButton?: boolean;
  // NUEVA PROP: Permite definir el ancho máximo
  size?: string;
}

const Modal: React.FC<ModalProps> = ({
  title,
  children,
  onClose,
  onSave,
  hideSaveButton = false,
  // Valor por defecto si no se especifica el tamaño
  size = "max-w-2xl",
}) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in-fast"
      onClick={onClose}
    >
      <div
        // APLICACIÓN DE LA CORRECCIÓN: Usar la prop 'size'
        className={`bg-gray-800 rounded-lg shadow-2xl w-full ${size} transform transition-all duration-300 scale-95`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XIcon />
          </button>
        </div>
        <div className="p-6">{children}</div>
        <div className="flex justify-end p-4 bg-gray-800/50 border-t border-gray-700 rounded-b-lg">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg mr-2 transition duration-300"
          >
            {hideSaveButton ? "Cerrar" : "Cancelar"}
          </button>
          {!hideSaveButton && (
            <button
              onClick={onSave}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
