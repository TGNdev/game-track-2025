const Modal = ({ title, children }) => {
  return (
    <div className="sm:px-8 py-5">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default Modal;