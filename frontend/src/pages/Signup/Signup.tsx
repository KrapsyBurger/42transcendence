import React, { useState } from "react";
import styles from "./Signup.module.css";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { generateQRCode } from "./generateQrCode";
import { localhost } from "../../api";

function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isTwoFAActivated, set2FA] = useState(false);
  const navigate = useNavigate();
  const [twoFACode, setTwoFACode] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState<number | null>(null);

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
            userId: newUserId,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      // Redirect to signin page after successful 2FA setup
      toast.success("2FA setup successful!", {
        className: "toast-message",
      });
      navigate("/signin");
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

    try {
      let user: Record<string, any> = {
        username,
        password,
        avatar,
        isTwoFAActivated,
      };
      if (email !== "") user.email = email;
      if (firstName !== "") user.firstName = firstName;
      if (lastName !== "") user.lastName = lastName;
      if (avatar !== "") user.avatar = avatar;
      else
        user.avatar =
          "https://sm.ign.com/ign_fr/cover/a/avatar-gen/avatar-generations_bssq.jpg";

      const response = await fetch(`http://${localhost}:3333/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setNewUserId(data.userId);

      // After the user is successfully created
      if (isTwoFAActivated) {
        await generateQRCode(data.userId, setQrCodeUrl);
      } else {
        toast.success("Signup successful!", {
          className: "toast-message",
        });
        // Redirect to signin page after successful signup
        navigate("/signin");
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message, {
          className: "toast-message",
        });
        console.error(error);
      }
    }
  };

  return (
    <div className={styles["signup-container"]}>
      <h1>Signup</h1>
      {qrCodeUrl ? (
        <form onSubmit={handleQrCodeScan} className={styles["signup-form"]}>
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
      ) : (
        <form className={styles["signup-form"]} onSubmit={handleSubmit}>
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
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles["input-field"]}
            />
          </label>
          <label>
            First Name:
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={styles["input-field"]}
            />
          </label>
          <label>
            Last Name:
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={styles["input-field"]}
            />
          </label>
          <label>
            Avatar:
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className={styles["input-field"]}
            />
          </label>
          <div className="toggle">
            <input
              type="checkbox"
              id="toggle-switch"
              checked={isTwoFAActivated}
              onChange={(e) => set2FA(e.target.checked)}
            ></input>
            <label htmlFor="toggle-switch"> Activate 2FA ?</label>
          </div>
          <div>
            <br></br>
          </div>
          <button type="submit" className={styles["submit-btn"]}>
            Signup
          </button>
        </form>
      )}
      <div>
        Already have an account?{" "}
        <Link to="/signin" className={styles.link}>
          Signin
        </Link>
      </div>
    </div>
  );
}

export default Signup;
