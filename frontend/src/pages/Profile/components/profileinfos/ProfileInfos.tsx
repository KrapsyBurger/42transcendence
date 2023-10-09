// Packages
import { useState, useEffect, ChangeEvent } from "react";
import { toast } from "react-toastify";
import "../../../../CustomToast.css";

// Interfaces
import { IUser } from "../../../../interfaces/interfaces";

// Components
import { PBTextField } from "../../../../components/profile/Profile.styles";

// Styles
import {
  Avatar,
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  Typography,
  FormControlLabel,
} from "@mui/material";
import styled from "styled-components";

// Api utils
import { fetchMyUserData, updateUser } from "../../../../api.utils";

// Input validation
import { isEmail, hasNoWhitespace } from "../../../../utils";

const CustomAvatar = styled(Avatar)`
  img {
    crossorigin: "anonymous";
  }
`;

const ProfileInfos = () => {
  const [editedFields, setEditedFields] = useState<Partial<IUser>>({});
  const [editedAvatarURL, setEditedAvatarURL] = useState<string | null>(null);
  const [errorMessages, setErrorMessages] = useState<Partial<IUser>>({});
  const [openModal, setOpenModal] = useState(false);
  const [user, setUser] = useState<IUser | null>(null); // Currently logged in user
  const [isTwoFAEnabled, setIsTwoFAEnabled] = useState<boolean>(false);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleCancel = () => {
    if (user && user.avatar) setEditedAvatarURL(user.avatar);
    else setEditedAvatarURL(null);
    handleCloseModal();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    let inputName = event.target.name;
    let checked = event.target.checked;
    setEditedFields((prevFields) => ({
      ...prevFields,
      [name]: value,
    }));
    if (inputName === "tickableButton") {
      setIsTwoFAEnabled(checked);
    }
  };

  const isValidEditedFields = (fields: Partial<IUser>) => {
    const errors: Partial<IUser> = {};

    // Compare edited fields with original user data
    if (fields.username !== undefined && fields.username === "") {
      errors.username = "Username cannot be empty";
    }
    if (fields.username !== undefined && !hasNoWhitespace(fields.username)) {
      errors.username = "Username must no contain whitespaces";
    }

    if (fields.email !== undefined && fields.email === "") {
      errors.email = "Email cannot be empty";
    } else if (fields.email !== undefined && !isEmail(fields.email)) {
      errors.email = "Invalid email address";
    }

    setErrorMessages(errors);

    // Return true if there are no errors, indicating the fields are valid
    return Object.keys(errors).length === 0;
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newAvatarURL = event.target.value;
    setEditedAvatarURL(newAvatarURL);
  };

  const handleAvatarValidation = () => {
    // setEditedAvatarURL()
    handleCloseModal();
  };

  const handleSaveChanges = () => {
    if (!isValidEditedFields(editedFields)) {
      return;
    }

    if (isTwoFAEnabled === user?.isTwoFactorAuthenticationEnabled)
      setIsTwoFAEnabled(user?.isTwoFactorAuthenticationEnabled);
    else {
      editedFields.isTwoFactorAuthenticationEnabled = isTwoFAEnabled;
      if (isTwoFAEnabled === false) editedFields.isQrCodeScanned = false;
    }

    const updatedUser: Partial<IUser> = { ...editedFields };

    if (isTwoFAEnabled !== user?.isTwoFactorAuthenticationEnabled) {
      updatedUser.isTwoFactorAuthenticationEnabled = isTwoFAEnabled;
      if (!isTwoFAEnabled) {
        updatedUser.isQrCodeScanned = false;
      }
    }

    if (editedAvatarURL && editedAvatarURL !== user?.avatar) {
      updatedUser.avatar = editedAvatarURL;
    }

    if (Object.keys(updatedUser).length === 0) {
      console.log("No changes to save.");
      return;
    }

    updateUser(updatedUser)
      .then(() => {
        toast.success("Changes successfully saved!", {
          className: "toast-message",
        });
        setUser((prevUser) =>
          prevUser ? { ...prevUser, ...updatedUser } : null
        );
      })
      .catch((error) => {
        // setEditedFields({});
        console.log(error.response.data.message);
        console.log(error.response.data.error);
        if (error.response.data.error === "username")
          setErrorMessages({ username: error.response.data.message });
        if (error.response.data.error === "email")
          setErrorMessages({ email: error.response.data.message });
        else setErrorMessages({ username: "username or email already in use" });
      });
  };

  useEffect(() => {
    fetchMyUserData()
      .then((userData: IUser) => {
        setUser(userData);
        setIsTwoFAEnabled(userData.isTwoFactorAuthenticationEnabled);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, []);

  return (
    <>
      {user && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CustomAvatar
              alt={user.username}
              src={editedAvatarURL !== null ? editedAvatarURL : user.avatar}
              sx={{ width: 130, height: 130 }}
            />
            <Button sx={{ margin: 2 }} onClick={handleOpenModal}>
              Change avatar
            </Button>
          </Box>
          <Dialog open={openModal} onClose={handleCloseModal}>
            <DialogTitle>Enter your new avatar URL</DialogTitle>
            <DialogContent>
              <input
                type="text"
                name="avatar"
                value={editedAvatarURL || ""}
                onChange={handleAvatarChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button
                onClick={handleAvatarValidation}
                disabled={!editedAvatarURL}
              >
                Validate
              </Button>
            </DialogActions>
          </Dialog>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <PBTextField
              name="username"
              label="username"
              variant="outlined"
              value={
                editedFields.username !== undefined
                  ? editedFields.username
                  : user.username
              }
              onChange={handleChange}
              error={!!errorMessages.username} // Set error state based on whether there's an error message for the field
              helperText={errorMessages.username}
              autoComplete="username"
            />
            <PBTextField
              name="email"
              label="email"
              variant="outlined"
              value={
                editedFields.email !== undefined
                  ? editedFields.email
                  : user.email
              }
              onChange={handleChange}
              error={!!errorMessages.email} // Set error state based on whether there's an error message for the field
              helperText={errorMessages.email}
              autoComplete="email"
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mt: -7.9,
              marginLeft: "12px",
              border: "1px solid #292929",
              borderRadius: "15px",
              padding: "0px",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  name="tickableButton"
                  checked={isTwoFAEnabled}
                  onChange={handleChange}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "12px",
                    marginTop: "6px",
                    color: "#111",
                  }}
                >
                  Enable/Disable 2FA
                </Typography>
              }
              labelPlacement="top"
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              mt: 9,
              marginLeft: "-150px",
              marginRight: "20px",
            }}
          >
            <Button
              variant="contained"
              sx={{ margin: 2 }}
              onClick={handleSaveChanges}
            >
              Save changes
            </Button>
          </Box>
        </Box>
      )}
    </>
  );
};

export default ProfileInfos;
