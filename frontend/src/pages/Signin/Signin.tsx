import React, { useState } from "react";
import styles from "./Signin.module.css";
import { Link, useNavigate } from "react-router-dom";
import { generateQRCode } from "../Signup/generateQrCode";
import { toast } from "react-toastify";
import { localhost } from "../../api";

interface SigninProps {
  onSignin: (token: string, userId: number) => void;
}


function Signin({ onSignin }: SigninProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [twoFACode, setTwoFACode] = useState("");
  const [isTwoFAEnabled, setTwoFAEnabled] = useState(false);
  const [isFirstScanRequired, setFirstScanRequired] = useState(false);
  const [receivedUserId, setReceivedUserId] = useState<number | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | undefined>(undefined);

  const handleQrCodeScan = async (evt: React.FormEvent) => {
    evt.preventDefault();
    try {
      const response = await fetch(
        `http://${localhost}:3333/auth/2fa/firstQrScan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            twoFactorAuthenticationCode: twoFACode,
            userId: receivedUserId,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      // QR code scan successful, ask for the 2FA codeconsole.log("COUCOU ", process.env.LOCALHOST);
      setFirstScanRequired(false);
      setTwoFAEnabled(true);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, {
          className: "toast-message",
        });
        console.error(error);
      }
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://${localhost}:3333/auth/2fa/authenticate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            twoFactorAuthenticationCode: twoFACode,
            userId: receivedUserId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      onSignin(data.access_token, data.userId); // Set the token and userId in the context and local storage
      navigate("/"); // Redirect to the default route, which is the chat page in this case
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, {
          className: "toast-message",
        });
        console.error(error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

	console.log("COUCOU ", process.env.REACT_APP_LOCALHOST);
    try {
      const response = await fetch(`http://${localhost}:3333/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
	  console.log("COUCOU ", process.env.LOCALHOST);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setReceivedUserId(data.userId);
      if (data.isTwoFactorAuthenticationEnabled && !data.isQrCodeScanned) {
        // If 2FA is enabled but the QR code hasn't been scanned yet, ask for the QR code scan
        await generateQRCode(data.userId, setQrCodeUrl);
        setFirstScanRequired(true);
      } else if (data.isTwoFactorAuthenticationEnabled) {
        // If 2FA is enabled and the QR code scan is done, ask for the 2FA code
        setTwoFAEnabled(true);
      } else {
        // If 2FA is not enabled, signin the user
        onSignin(data.access_token, data.userId); // Set the token and userId in the context and local storage
        navigate("/"); // Redirect to the default route, which is the play page in this case
      }
    } catch (error) {
      if (error instanceof Error) {
        // setError(error.message);
        toast.error(error.message, {
          className: "toast-message",
        });
        console.error(error);
      }
    }
  };

  return (
    <div className={styles["signin-container"]}>
      <h1 className="title">Signin</h1>
      {isFirstScanRequired ? (
        <form onSubmit={handleQrCodeScan} className={styles["signin-form"]}>
          <img src={qrCodeUrl} alt="QR Code" />
          <p>
            Scan the QR code with your authenticator app and enter the code
            below
          </p>
          <input
            type="text"
            value={twoFACode}
            onChange={(e) => setTwoFACode(e.target.value)}
            className={styles["input-field"]}
          />
          <button type="submit" className={styles["submit-btn"]}>
            Submit
          </button>
        </form>
      ) : isTwoFAEnabled ? (
        <form onSubmit={handle2FASubmit} className={styles["signin-form"]}>
          <label>
            2FA Code:
            <input
              type="text"
              value={twoFACode}
              className={styles["input-field"]}
              onChange={(e) => setTwoFACode(e.target.value)}
            />
          </label>
          <button type="submit" className={styles["submit-btn"]}>
            Submit
          </button>
        </form>
      ) : (
        <form className={styles["signin-form"]} onSubmit={handleSubmit}>
          <label>
            Username:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles["input-field"]}
            />
          </label>
          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles["input-field"]}
            />
          </label>
          <button type="submit" className={styles["submit-btn"]}>
            Signin
          </button>
        </form>
      )}
      <div>
        Don't have an account?{" "}
        <Link to="/signup" className={styles.link}>
          Register
        </Link>
      </div>
      <div>
        Sign in with <a href={`http://${localhost}:3333/auth/42`}>42</a>
      </div>
    </div>
  );
}

export default Signin;
