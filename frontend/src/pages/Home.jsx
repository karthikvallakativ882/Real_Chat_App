import { useContext } from "react";

import { AuthContext } from "../context/AuthContext";

const Home = () => {

  const { user } = useContext(AuthContext);

  return (
    <div>

      <h1>Home Page</h1>

      {
        user ? (
          <h2>Welcome {user.username}</h2>
        ) : (
          <h2>Please Login</h2>
        )
      }

    </div>
  );
};

export default Home;