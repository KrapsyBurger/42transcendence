export interface IMessage {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: Date;
  sender: IUser;
  isChannelMessage: boolean;
  isRead: boolean;
}

export interface IUser {
  id: number;
  username: string;
  unreadCount: number;
  avatar: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  isTwoFactorAuthenticationEnabled: boolean;
  isQrCodeScanned: boolean;
  numberOfGamesPlayed: number;
  numberOfWins: number;
  connectionStatus: ConnectionStatus;
  currentLocation: Location;
}

export interface IAdmin {
  user: IUser;
  userId: number;
}

export interface IMute {
  user: IUser;
  userId: number;
  muteExpiration: Date;
}

export interface IChannel {
  id: number;
  name: string;
  ownerId: number;
  owner: IUser;
  isPrivate: boolean;
  hasPassword: boolean;
  members: IUser[];
  admins: IAdmin[];
  bans: IAdmin[];
  mutes: IMute[];
  unreadCount: number;
}

export interface IFriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  sender: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  receiver: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
}

export interface IGameInvite {
  id: number;
  inviterId: number;
  inviteeId: number;
  inviter: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  invitee: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
}

export interface IFriend {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  connectionStatus: ConnectionStatus;
  currentLocation: Location;
}

export interface IUserBlocks {
  id: number;
  blockerId: number;
  blockedId: number;
  blocker: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  blocked: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
}

export interface IGame {
  id: number;
  createdAt: string;
  firstPlayerId: number;
  firstPlayerUsername: string;
  firstPlayerAvatar: string;
  secondPlayerId: number;
  secondPlayerUsername: string;
  secondPlayerAvatar: string;
  winnerId: number; // Id of the winner
  firstPlayerPoints: number; // Points earned by the first player
  secondPlayerPoints: number; // Points earned by the second player
  gameType: string; // Game type, can be either "challenge" or "matchmaking"
  gameStatus: string; // "paused", "playing", "over"
}

export interface ProfileProps {
  userId: number | null;
}


export enum ConnectionStatus {
  ONLINE,
  OFFLINE
}

export enum Location {
  CHAT,
  GAME,
  INGAME,
  PROFILE,
  FRIENDS,
}