import React from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate()
  const parent = localStorage.getItem("parent_data");

  let list = JSON.parse(parent || "{}");
  if (list.data) {
    list = list.data;
  }
  return (
    <div className="bg-pink-50 h-full ">
      <div className="text-pink-600 text-xl text-center p-5">
        家长资料
      </div>

      <form className="grid grid-cols-3 gap-4 m-3">
        <input
          className="h-28 rounded-md bg-pink-200 text-pink-600 text-center text-4xl"
          type="text"
          name="FirstName"
          value={list.first_name}
        />
        <input
          className="h-28 rounded-md bg-pink-200 text-pink-600 text-center text-4xl"
          type="text"
          name="LastName"
          value={list.last_name}
        />
        <input
          className="h-28 rounded-md bg-pink-200 text-pink-600 text-center text-4xl"
          type="number"
          name="phonenumber"
          value={list.phone_number}
        />
         <button
         onClick={()=>navigate(-1)}
          className="h-10 rounded-md outline outline-1 hover:bg-pink-600 text-pink-600 hover:text-white text-center text-4xl"
       type="button"
          name="phonenumber"
        > 返回</button>
      </form>
    </div>
  );
}

export default Profile;
