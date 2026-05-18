import React, { useEffect, useState } from 'react'
import  icon from "./student.svg";
import "./viewdiscipline.css"
function ViewDiscipline({setView, setAddCase, studentId}) {

 const [singleCase, setSingleCase] = useState()  
 const token = localStorage.getItem("teacherToken");
  function closeModal(){
    setView(false)
  }

  function hideViewModal(){
    setAddCase(true)
    closeModal()
  }

  useEffect(()=>{
    fetch(`/disciplines/${studentId}`,{
        headers:{
          Authorization : `Bearer ${token}`
        }
    }).then((res)=> res.json())
      .then((res)=> setSingleCase(Array.isArray(res) ? res : [res]))
  }, [])
  return (
    <div className='modal'>
           {singleCase && singleCase.map(item=>(
    <div className="kid-card" key={item.id}>
      
        <div className="avatar">
        <img src={icon} alt="学生头像" border="0"/>
        </div>
       
          <h2 className='header-name'>{item.student.first_name} {item.student.surname}</h2>
          <div className="text-card">
        <label>标题：</label>
        <h3 className='h3'>{item.title}</h3>
        <label>详情：</label>
        <p className='details'>日期：{item.date}</p>
        <span>{item.description}</span>
        </div>
       
        <div className='buttonContainer'>
       
        <button className="button-10" type="submit" onClick={hideViewModal}>添加记录</button>
        <button className="button-11" type="submit" onClick={closeModal}>返回</button>
        
        </div>
    </div>
))}

    </div>
  )
}

export default ViewDiscipline
