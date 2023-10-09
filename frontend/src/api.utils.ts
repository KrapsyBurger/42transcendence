import api from "./api";
import { IUser } from "./interfaces/interfaces";

// USERS
export const fetchMyUserData = async () => {
  try {
    const response = await api.get("/users/me");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchUserData = async (userId: number | null) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchAllUsers = async () => {
  console.log("fetchAllUsers");
  try {
    // Make the API call to fetch the user data
    const response = await api.get("/users/");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (updateUser: Partial<IUser>) => {
  console.log("updateUser");
  try {
    const response = await api.patch("/users", updateUser);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// FRIEND REQUESTS
export const fetchFriendRequests = async () => {
  try {
    // Make the API call to fetch the user data
    const response = await api.get("friend/requests/");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const sendFriendRequest = async (receiverId: number) => {
  try {
    // Make the API call to send the friend request
    const response = await api.post(`friend/request/${receiverId}`, {
      // Add request data here if required by the API
      // For example, if the API expects data in the request body, you can include it here:
      // requestDataKey: 'requestDataValue',
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const acceptFriendRequest = async (requestId: number) => {
  try {
    // Make the API call to send the friend request
    const response = await api.post(`friend/request/${requestId}/accept`, {
      // Add request data here if required by the API
      // For example, if the API expects data in the request body, you can include it here:
      // requestDataKey: 'requestDataValue',
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteFriendRequest = async (requestId: number) => {
  try {
    // Make the API call to send the friend request
    const response = await api.delete(`friend/request/${requestId}/`, {
      // Add request data here if required by the API
      // For example, if the API expects data in the request body, you can include it here:
      // requestDataKey: 'requestDataValue',
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// FRIENDS
export const fetchFriends = async () => {
  try {
    // Make the API call to fetch the user data
    const response = await api.get("friend/friends/");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteFriend = async (friendId: number) => {
  try {
    // Make the API call to send the friend request
    const response = await api.delete(`friend/${friendId}/`, {
      // Add request data here if required by the API
      // For example, if the API expects data in the request body, you can include it here:
      // requestDataKey: 'requestDataValue',
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// BLOCKED USERS
export const fetchUserBlocks = async () => {
  try {
    // Make the API call to fetch the user data
    const response = await api.get("chat/block/usersdata");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const blockUser = async (userId: number | null) => {
  try {
    // Make the API call to fetch the user data
    const response = await api.post(`chat/block/user/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const unblockUser = async (userId: number | null) => {
  try {
    // Make the API call to fetch the user data
    const response = await api.delete(`chat/block/user/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// GAME INVITES
export const fetchGameInvites = async () => {
  console.log("fetchGameInvites");
  try {
    // Make the API call to fetch the game invites
    const response = await api.get("game/invites");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const acceptGameInvite = async (gameInviteId: number) => {
  console.log("acceptGameInvite : ", gameInviteId);
  try {
    const response = await api.post(`game/invite/${gameInviteId}/accept`, {
      // Add gameInvite data here if required by the API
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const refuseGameInvite = async (gameInviteId: number) => {
  console.log("refuseGameInvite");
  try {
    const response = await api.delete(`game/invite/${gameInviteId}`, {
      // Add gameInvite data here if required by the API
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const sendGameInvite = async (inviteeId: number) => {
  console.log("sendGameInvite");
  try {
    const response = await api.post(`game/invite/${inviteeId}`, {
      // Add request data here if required by the API
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// GAMES
export const fetchMyGames = async () => {
  console.log("fetchMyGames");
  try {
    const response = await api.get("/game/me");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchUserGames = async (userId: number | null) => {
  try {
    const response = await api.get(`/game/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// CHANNELS

export const fetchMyChannels = async() => {
  console.log("fetchMyChannels");
  try {
    const response = await api.get("/chat/channels/me");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchChannelData = async (channelId: number | null) => {
  try {
    console.log("fetchChannelData");
    const response = await api.get(`/chat/channel/${channelId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};