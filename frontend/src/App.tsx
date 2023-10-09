// Packages
import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";

// Styles
import "./App.css";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./App.styles";
import CssBaseline from "@mui/material/CssBaseline";

// Components
import { AuthContext } from "./AuthContext";
import { Chat, Friends, Game, Profile, Signin, Signup } from "./pages";
import TokenHandler from "./TokenHandler";

function App() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("access_token")
  );
  const [userId, setUserId] = useState<number | null>(
    () => Number(localStorage.getItem("userId")) || null
  );
  const [tokenHasBeenSet, setTokenHasBeenSet] = useState<boolean>(false);


  const handleSignin = (token: string, userId: number) => {
    setToken(token);
    setUserId(userId);
    localStorage.setItem("access_token", token);
    localStorage.setItem("userId", userId.toString());
    setTokenHasBeenSet(true);
  };

  useEffect(() => {
    // Remove the token from the local storage if it is null
    if (token === null && tokenHasBeenSet) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("userId");
    }
  }, [token, tokenHasBeenSet]);

  useEffect(() => {
    // Listen and handle event generated in api.ts when token expired
    const handleTokenExpired = () => {
      setToken(null);
      setUserId(null);
    };

    window.addEventListener('tokenExpired', handleTokenExpired);

    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, []);

  // useEffect(() => {
  //   // Update the active conversation ref when the active conversation changes
  //   activeConversationRef.current = activeConversation;
  // }, [activeConversation]);

  // useEffect(() => {
  //   if (token && userId) {
  //     const socket = connectToConnectionSocket(userId);
  //     connectionSocketRef.current = socket;
  //     connectionSocketRef.current.on("updateConnectionStatus", updateConnectionStatusCallback);
  //     connectionSocketRef.current.on("updateCurrentLocation", updateCurrentLocationCallback);
  //   } else {
  //     if (connectionSocketRef.current) {
  //       connectionSocketRef.current.off("updateConnectionStatus");
  //       connectionSocketRef.current.off("updateCurrentLocation");
  //       connectionSocketRef.current.disconnect();
  //       connectionSocketRef.current = null;
  //     }
  //   }

  //   return () => {
  //     if (connectionSocketRef.current) {
  //       connectionSocketRef.current.off("updateConnectionStatus");
  //       connectionSocketRef.current.off("updateCurrentLocation");
  //       connectionSocketRef.current.disconnect();
  //       connectionSocketRef.current = null;
  //     }
  //   };
  // }, [token, userId, updateConnectionStatusCallback, updateCurrentLocationCallback]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext.Provider value={{ token, setToken, userId, setUserId }}>
        <Router>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/signin"
              element={<Signin onSignin={handleSignin} />}
            />
            <Route
              path="/42token/:URLtoken/:URLuserId"
              element={<TokenHandler onSignin={handleSignin} />}
            />
            <Route
              path="/chat"
              element={token ? <Chat /> : <Navigate to="/signin" />}
            />
            <Route
              path="/"
              element={token ? <Game /> : <Navigate to="/signin" />}
            />
            <Route
              path="/profile"
              element={token ? <Profile /> : <Navigate to="/signin" />}
            />
            <Route
              path="/friends"
              element={token ? <Friends /> : <Navigate to="/signin" />}
            />
          </Routes>
        </Router>
        <ToastContainer />
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
