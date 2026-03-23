import axios from 'axios';

const BASE_URL = 'https://eduseat-backend.onrender.com/api';

export const addHall = (hall) => axios.post(`${BASE_URL}/halls`, hall);
export const getHalls = () => axios.get(`${BASE_URL}/halls`);
export const deleteHalls = () => axios.delete(`${BASE_URL}/halls`);

export const addStudentsBulk = (students) => axios.post(`${BASE_URL}/students/bulk`, students);
export const getStudents = () => axios.get(`${BASE_URL}/students`);
export const deleteStudents = () => axios.delete(`${BASE_URL}/students`);

export const generateSeating = () => axios.post(`${BASE_URL}/generate`);
export const getAllSeating = () => axios.get(`${BASE_URL}/seating`);
export const findSeat = (regNo) => axios.get(`${BASE_URL}/seat/${regNo}`);