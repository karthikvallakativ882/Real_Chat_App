import Navbar from "../components/Navbar";

const Home = () => {

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  return (
    <div className="min-h-screen bg-gray-100">

      <Navbar />

      <div className="flex justify-center items-center h-[80vh]">

        <div className="bg-white p-10 rounded shadow-lg text-center">

          <h1 className="text-4xl font-bold mb-4">
            Welcome {user?.username}
          </h1>

          <p className="text-gray-600">
            Start chatting with online users
          </p>

        </div>

      </div>

    </div>
  );
};

export default Home;