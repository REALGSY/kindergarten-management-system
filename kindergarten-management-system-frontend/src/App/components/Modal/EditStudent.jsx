import React from 'react'
import "./editstudent.css"
import {useForm} from 'react-hook-form'

const token = localStorage.getItem("teacherToken")

function EditStudent({setEdit, editId, setDisciplanes}) {
    const {register, handleSubmit} = useForm()
    
    function handleEdit(){
        setEdit(false)
}

    function onSubmit(data){
        // handleEdit()
        fetch(`/disciplines/${editId}`,{
            method: "PATCH",
            headers:{
                "Content-Type" : "application/json",
                Authorization : `Bearer ${token}`
            },
            body: JSON.stringify(data),
        }).then((res) => res.json())
          .then(res=> {
            setDisciplanes((items) =>
              items.map((item) => (item.id === res.id ? res : item))
            )
           handleEdit()  
        })
    }

  return (
    <div className='edit-modal'>
        <div className='edit-card'>
        <div className="input-container">
            <form className='input-form' onSubmit={handleSubmit(onSubmit)}>
                <label>标题：</label>
                <input type="text" className='title' {...register('title')}/>
                <label>描述：</label>
                <input type="text" className='description' {...register('description')}/>
                <button className="button-12" type="button" onClick={handleEdit}>返回</button>
                <button className="button-13" type="submit" >编辑</button>
            </form>
        </div>
        </div>
    </div>
  )
}

export default EditStudent
