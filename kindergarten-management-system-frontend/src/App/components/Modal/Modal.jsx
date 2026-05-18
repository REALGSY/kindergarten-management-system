import React from 'react'
import "./modal.css"
function Modal({setModal, modalData}) {
    
  return (
    
    <div className='modal'>
    {modalData && modalData.map(data => (
    <div className='modal-content' key={data.id}>
    <div modal-header>
      <h2 className='modal-title'>{data.first_name} {data.second_name} {data.surname}</h2>
    </div>
    <div className='modal-body'>
      <h4>学号：{data.admission_number}</h4>
      <h4>年龄：{data.age}</h4>
      <p>{data.description}</p>
    </div>
    <div className='modal-footer'>
    </div>
    </div>
    ))}
    <button className='button-6 animate-bounce'onClick={()=>setModal(false)} >返回</button>
    </div>
  
  )
}

export default Modal  
