import React, { createContext } from "react";

export const TeacherContext = createContext({});

export const TeacherContextProvider = ({ children }) => {
  const contextValue = {
    token: localStorage.getItem("teacherToken"),
    teacher_id: localStorage.getItem("teacher"),
  };

  return <TeacherContext.Provider value={contextValue}>{children}</TeacherContext.Provider>;
};
