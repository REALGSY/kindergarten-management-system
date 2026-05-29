import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./components/Signup";
import Home from "./components/Home";
import Login from "./components/Login";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import AdminOverview from "./components/AdminDashboard/Overview";
import AdminTeachers from "./components/AdminDashboard/Teachers";
import AdminClassrooms from "./components/AdminDashboard/Classrooms";
import AdminStudents from "./components/AdminDashboard/Students";
import AdminParents from "./components/AdminDashboard/Parents";
import AdminParentStudents from "./components/AdminDashboard/ParentStudents";
import AdminAttendances from "./components/AdminDashboard/Attendances";
import AdminDisciplines from "./components/AdminDashboard/Disciplines";
import AdminEducationalVideos from "./components/AdminDashboard/EducationalVideos";
import AdminChildChatSessions from "./components/AdminDashboard/ChildChatSessions";
import Dashboard from "./components/Dashboard";
import KidsList from "./components/Dashboard/KidsList";
import Attendance from "./components/Dashboard/Attendance";
import Discipline from "./components/Dashboard/Discipline";
import Classes from "./components/Dashboard/Classes";
import Parents from "./components/Dashboard/Parents";
import Profile from "./components/Dashboard/Profile";
import ProfileP from "./components/ParentDashboard/Profile";
import ParentDashboard from "./components/ParentDashboard";
import MyKids from "./components/ParentDashboard/MyKids";
import SingleKid from "./components/ParentDashboard/MyKids/SingleKid";
import ParentLogin from "./components/ParentLogin";
import ParentSignup from "./components/ParentSignup";
import Welcome from "./components/ParentDashboard/Welcome";
import ParentChatRecords from "./components/ParentDashboard/ChatRecords";
import ChildLogin from "./components/ChildLogin";
import ChildDashboard from "./components/ChildDashboard";
import SingleAttendance from "./components/Dashboard/Attendance/SingleAttendance";
import { TeacherContextProvider } from "./components/Context/teacher-context";
import TeacherWelcome from "./components/Dashboard/Welcome";
import SingleStudent from "./components/Dashboard/KidsList/SingleStudent";
import AddCase from "./components/Modal/AddCase";
import AddKid from "./components/Dashboard/AddKid";
import { configureAxiosUnauthorizedHandling } from "./components/Auth/session";

configureAxiosUnauthorizedHandling();

function App() {
  return (
    <BrowserRouter>
      <TeacherContextProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin_login" element={<AdminLogin />} />
          <Route path="/parent_login" element={<ParentLogin />} />
          <Route path="/parent_signup" element={<ParentSignup />} />
          <Route path="/child_login" element={<ChildLogin />} />
          <Route path="/child_dashboard" element={<ChildDashboard />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="admin_dashboard" element={<AdminDashboard />}>
            <Route index element={<AdminOverview />} />
            <Route path="teachers" element={<AdminTeachers />} />
            <Route path="classrooms" element={<AdminClassrooms />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="parents" element={<AdminParents />} />
            <Route path="parent_students" element={<AdminParentStudents />} />
            <Route path="attendances" element={<AdminAttendances />} />
            <Route path="disciplines" element={<AdminDisciplines />} />
            <Route path="educational_videos" element={<AdminEducationalVideos />} />
            <Route path="child_chat_sessions" element={<AdminChildChatSessions />} />
          </Route>
          <Route path="dashboard" element={<Dashboard />}>
            <Route path="addcase" element={<AddCase />} />
            <Route path="" element={<TeacherWelcome />} />
            <Route path="kids_list">
              <Route index element={<KidsList />} />
              <Route path=":id" element={<SingleStudent />} />
            </Route>

            <Route path="add_kid" element={<AddKid />} />

            <Route path="attendance">
              <Route index element={<Attendance />} />
              <Route path=":date" element={<SingleAttendance />} />
            </Route>
            <Route path="discipline" element={<Discipline />} />
            <Route path="classes" element={<Classes />} />
            <Route path="parents" element={<Parents />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="parent_dashboard" element={<ParentDashboard />}>
            <Route path="" element={<Welcome />} />
            <Route path="profile" element={<ProfileP />} />
            <Route path="chat_records" element={<ParentChatRecords />} />
            <Route path="my_kids">
              <Route index element={<MyKids />} />
              <Route path=":id" element={<SingleKid />} />
            </Route>
          </Route>
        </Routes>
      </TeacherContextProvider>
    </BrowserRouter>
  );
}

export default App;
