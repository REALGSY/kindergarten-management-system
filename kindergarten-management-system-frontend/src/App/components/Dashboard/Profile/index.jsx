import React from 'react';
import { useNavigate } from 'react-router-dom';
import avatar from './images/avatar.svg';
import "./Profile.css";

function Profile() {
  const navigate = useNavigate()
  const teacherInfo= localStorage.getItem("teacher_data");

  const teacherDetails = JSON.parse(teacherInfo || "{}");
  const teacher = teacherDetails.teacher || teacherDetails[0] || {};

  return (
    <div>
      <div className='container2 flex justify-center items-center'> 
        <form className='bg-[#F9FAFE] p-6 mt-6 rounded-lg shadow-md flex flex-col w-3/5'>
          <h1 class='text-center text-2xl' >教师资料</h1>
          <img src={avatar} alt="头像" className="avatar object-contain" />
            <p className='text-gray-500'>姓名：</p>
            <input className="h-10 rounded-md bg-white text-black italic text-xl"
              value={`${teacher.first_name || ""} ${teacher.last_name || ""}`}
              readOnly
            />
            <p className='text-gray-500'>教师称呼：</p>
            <input className="h-10 rounded-md bg-white text-black italic text-xl "
              value={teacher.career_name || ""}
              readOnly
            />
            <p className='text-gray-500'>邮箱：</p>
            <input className="h-10 rounded-md bg-white text-black italic text-xl"
              value={teacher.email || ""}
              readOnly
            />
            <p className='text-gray-500'>电话号码：</p>
            <input className="h-10 rounded-md bg-gray text-black italic text-xl"
              value={teacher.phone_number || ""}
              readOnly
            />
            <p className='text-gray-500 '>性别：</p>
            <input className="h-8 rounded-md bg-white text-black italic text-xl"
              value={teacher.gender || ""}
              readOnly
            />
          <button onClick={()=>navigate("/dashboard")} class="bg-[#B124A3] text-white py-1 px-4 mt-2 rounded-lg ">返回</button>
        </form>
      </div>
  </div>
  );
}
export default Profile;
