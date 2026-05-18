import React from 'react'
import icon from './icon.svg'
import screens from './screens.svg'

function Welcome() {
  return (
  <>
  <div className='flex justify-center'>
    <h1 className='text-[#B124A3] text-xl font-semibold'>家长控制台</h1>
  </div>

  <div className="h-48 m-auto w-4/5 bg-[#B124A3] rounded-md flex flex-row justify-between">
        <div className="m-auto p-5 h-full w-1/2 text-white">
            <div>幼儿园管理门户</div>
            <h1 className="text-5xl">欢迎，家长</h1>
            <p>你好，家长</p>
        </div>
        <div className="bg-white rounded-full h-24 w-24 m-auto flex justify-center items-center">
            <img  src={icon} alt="图标"/>
        </div>
  </div>

  <div className="grid grid-cols-1 pt-14">
        <div className="flex justify-center">
            <img src={screens} alt="家长控制台插图"/>
        </div>
  </div>      
      
 
  </>
    
  )
}

export default Welcome
