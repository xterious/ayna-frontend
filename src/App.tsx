import "./App.css";
import { RouterProvider } from "react-router-dom";
import Routes from "./Routes";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={Routes} />
    </AuthProvider>
  );
}

export default App;
