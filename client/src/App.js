import './App.css';
import axios from 'axios';
import { useState, useEffect } from 'react';
import jwt_decode from "jwt-decode";

function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(false);
    try {
      const res = await axios.post('/login', {
        username,
        password,
      });
      setUser(res.data);
      setSuccess(true);
    } catch (err) {
      setError(true);
    }
  }

  // if our access token is expired, we can just call this function to refresh it
  const axiosRefresh = axios.create();
  axiosRefresh.interceptors.request.use(
    async (config) => {
      let currentDate = new Date();
      const decoded = jwt_decode(user.accessToken);
      if (decoded.exp < currentDate.getTime() / 1000) {
        const data = await refreshToken();
        config.headers['authorization'] = `Bearer ${data.accessToken}`;
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    }
  )

  const refreshToken = async () => {
    try {
      const res = await axios.post('/refresh_token', {token: user.refreshToken});
      res.data && setUser(...user, res.data);
      return res.data;
    } catch (err) {
      console.log(err);
    }
  }

  const getUsers = async () => {
    try {
      const res = await axiosRefresh.get('/users', {headers: {authorization: `Bearer ${user.accessToken}`}});
      setUsers(res.data);
    } catch (err) {
      console.log(err);
    }
  }


  return (
    <div className="container">
      {user ? (
        <div className="home">
          <span>
            Welcome to the <b>{user.isAdmin ? "admin" : "user"}</b> dashboard{" "}
            <b>{user.username}</b>.
          </span>
          <button onClick={getUsers}>Get Users</button>
          {user?.isAdmin && (
            <>
              <span>List of users</span>
                {users ? (
                  <ul>
                    {users.map((user) => (
                      <li key={user.id}>{user.username}</li>
                    ))}
                  </ul>
                ):null}
            </>
          )}
      </div>
      ) 
      : (
        <div className="login">
          <form onSubmit={handleSubmit}>
            <span className="formTitle">Lama Login</span>
            <input
              type="text"
              placeholder="username"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="submitButton">
              Login
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
