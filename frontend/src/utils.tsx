import { toast } from "react-toastify";
import { IChannel, IUser } from "./interfaces/interfaces";

let count = 0;

// Check if token is expired, if so, delete token and userId from local storage and context, show toast and redirect to login page
export function checkTokenExpiration(
  response: Response,
  navigate: Function,
  setToken: Function,
  setUserId: Function
) {
  if (response.status === 401) {
    count++;
    localStorage.removeItem("access_token");
    localStorage.removeItem("userId");
    setToken(null);
    setUserId(null);
    if (count === 1)
      toast.error("Your session has expired, please login again.", {
        className: "toast-message",
      });
    navigate("/signin");
    throw new Error("Unauthorized");
  }
}

export function isChannel(conv: IUser | IChannel): conv is IChannel {
  return conv && "isPrivate" in conv;
}

export function isEmail(input: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input);
}

export function hasNoWhitespace(input: string): boolean {
  const whitespaceRegex = /\s/;
  return !whitespaceRegex.test(input);
}
