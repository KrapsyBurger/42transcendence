# Auth

## Signup
### Description:
Create a new user
### URL:
POST /auth/signup
### Parameters:
#### URL parameters:
none
#### Body parameters:
- dto = {
	username: string,
	password: string,
	email: string,
	avatar: string,
	isTwoFAActivated: boolean,
	firstname: string (optional),
	lastname: string (optional)
}
### Responses:
- 201: OK, returns the userId
- 400: Bad request, missing parameters
- 403: Forbidden, username already exists

## Signin
### Description:
Sign in an existing user
### URL:
POST /auth/signin
### Parameters:
#### URL parameters:
none
#### Body parameters:
- dto = {
	username: string,
	password: string
}
### Responses:
- 200: OK, returns the signed token and the userId
- 400: Bad request, missing parameters
- 403: Forbidden, wrong username or password

# User

## GetMe
### Description:
Get the current user's information
### URL:
GET /users/me
### Parameters:
#### URL parameters:
none
#### Body parameters:
none
### Responses:
- 200: OK, returns the user's information
- 401: Unauthorized, missing or invalid token

## GetUser
### Description:
Get a user's information by id
### URL:
GET /users/:id
### Parameters:
#### URL parameters:
- id: string
#### Body parameters:
none
### Responses:
- 200: OK, returns the user's information
- 400: Bad request, the given id is not a number
- 401: Unauthorized, missing or invalid token
- 404: Not found, the user does not exist

## GetUsers
### Description:
Get all users' information
### URL:
GET /users/
### Parameters:
#### URL parameters:
none
#### Body parameters:
none
### Responses:
- 200: OK, returns the user's information
- 401: Unauthorized, missing or invalid token

## EditUser
### Description:
Edit the current user's information.
For security reasons, only the currently signed in user can edit their own information.
### URL:
PATCH /users
### Parameters:
#### URL parameters:
none
#### Body parameters:
- dto = {
	username: string (optional),
	password: string (optional),
	email: string (optional),
	firstname: string (optional),
	lastname: string (optional)
}
### Responses:
- 200: OK, returns the user's information
- 400: Bad request, missing or invalid parameters
- 401: Unauthorized, missing or invalid token

## DeleteUser
### Description:
Delete the current user's account.
For security reasons, only the currently signed in user can delete their own account.
### URL:
DELETE /users
### Parameters:
#### URL parameters:
none
#### Body parameters:
none
### Responses:
- 200: OK, returns the user's information
- 401: Unauthorized, missing or invalid token, or the user is already deleted

# Chat

## GetMessagesBetweenUsers
### Description:
Get all messages between the current user and another user identified by his id.
### URL:
GET /chat/:id
### Parameters:
#### URL parameters:
- id: string
#### Body parameters:
none
### Responses:
- 200: OK, returns the messages between the two users
- 400: Bad request, the given id is not a number
- 401: Unauthorized, missing or invalid token

## readMessage
### Description:
Mark a message as read
### URL:
PATCH /chat/read/:id
### Parameters:
#### URL parameters:
- id: string
#### Body parameters:
none
### Responses:
- 200: OK, returns the message that was marked as read
- 400: Bad request, the given id is not a number
- 401: Unauthorized, missing or invalid token
- 404: Not found, the message does not exist

## createChannel
### Description:
Create a new channel
### URL:
POST /chat/channel
### Parameters:
#### URL parameters:
none
#### Body parameters:
- channelData = {
	name: string,
	isPrivate: boolean,
	ownerId: number,
	password: string (optional),
	description: string (optional)
}
### Responses:
- 200: OK, returns the channel that was created
- 400: Bad request, missing or invalid parameters
- 401: Unauthorized, missing or invalid token

## deleteChannel
### Description:
Delete a channel
### URL:
DELETE /chat/channel/:id
### Parameters:
#### URL parameters:
- id: string
#### Body parameters:
none
### Responses:
- 200: OK, returns the channel that was deleted
- 400: Bad request, missing or invalid parameters, or the user is not the owner of the channel
- 401: Unauthorized, missing or invalid token
- 404: Not found, the channel does not exist

## getChannel
### Description:
Get a channel by id
### URL:
GET /chat/channel/:id
### Parameters:
#### URL parameters:
- id: string
#### Body parameters:
none
### Responses:
- 200: OK, returns the channel with the given id
- 400: Bad request, missing or invalid parameters
- 401: Unauthorized, missing or invalid token
- 404: Not found, the channel does not exist

## getUserChannels
### Description:
Get all channels of the current user
### URL:
GET /chat/channel/me
### Parameters:
#### URL parameters:
none
#### Body parameters:
none
### Responses:
- 200: OK, returns the channels of the current user
- 401: Unauthorized, missing or invalid token
- 404: Not found, the user does not exist

## getPublicChannels
### Description:
Get all public channels
### URL:
GET /chat/channels
### Parameters:
#### URL parameters:
none
#### Body parameters:
none
### Responses:
- 200: OK, returns all public channels
- 401: Unauthorized, missing or invalid token

## getChannelMessages
### Description:
Get all messages of a channel
### URL:
GET /chat/channel/:id/messages
### Parameters:
#### URL parameters:
- id: string
#### Body parameters:
none
### Responses:
- 200: OK, returns all messages of the channel
- 400: Bad request, missing or invalid parameters
- 401: Unauthorized, missing or invalid token

## updateChannel
### Description:
Update the information of a channel
### URL:
PATCH /chat/channel/:id
### Parameters:
#### URL parameters:
- id: string
#### Body parameters:
- channelData = {
	name: string (optional),
	isPrivate: boolean (optional),
	ownerId: number (optional),
	password: string (optional),
	description: string (optional)
}
### Responses:
- 200: OK, returns the channel that was updated
- 400: Bad request, missing or invalid parameters, or the user is not the owner of the channel
- 401: Unauthorized, missing or invalid token
- 404: Not found, the channel does not exist

## addUserToChannel
### Description:
Add a user to a channel
### URL:
POST /chat/channel/:id/members
### Parameters:
#### URL parameters:
- id: string (channel id)
#### Body parameters:
- channelData = {
	userId: number,
	password: string (optional)
}
### Responses:
- 200: OK, returns the channel that was updated
- 400: Bad request, missing or invalid parameters, or the channel is private and the current user is not an admin, or the user to add is already a member of the channel, or he is banned from the channel, or the password is incorrect 
- 401: Unauthorized, missing or invalid token
- 404: Not found, the channel or the user does not exist

## delUserFromChannel
### Description:
Delete a user from a channel
### URL:
DELETE /chat/channel/:id/members
### Parameters:
#### URL parameters:
- id: string (user id)
#### Body parameters:
- channelData = {
	userId: number,
}
### Responses:
- 200: OK, returns the channel that was updated
- 400: Bad request, missing or invalid parameters, or the current user is not an admin, or the user to delete is not a member of the channel, or he is the owner of the channel
- 401: Unauthorized, missing or invalid token
- 404: Not found, the channel or the user does not exist

## addAdminToChannel
### Description:
Promote a user to admin in a channel
### URL:
POST /chat/channel/:id/admins
### Parameters:
#### URL parameters:
- id: string (channel id)
#### Body parameters:
- channelData = {
	userId: number,
}
### Responses:
- 200: OK, returns the channel that was updated
- 400: Bad request, missing or invalid parameters, or the current user is not the owner of the channel, or the user to promote is already an admin, or he is not in the channel
- 401: Unauthorized, missing or invalid token
- 404: Not found, the channel or the user does not exist

## banFromChannel
### Description:
Ban a user from a channel
### URL:
POST /chat/channel/:id/bans
### Parameters:
#### URL parameters:
- id: string (channel id)
#### Body parameters:
- channelData = {
	userId: number,
}
### Responses:
- 200: OK, returns the channel that was updated
- 400: Bad request, missing or invalid parameters, or the current user is not an admin of the channel, or the user to ban is already banned, or he is not in the channel, or he is the owner of the channel
- 401: Unauthorized, missing or invalid token
- 404: Not found, the channel or the user does not exist

## unbanFromChannel
### Description:
Unban a user from a channel
### URL:
DELETE /chat/channel/:id/bans
### Parameters:
#### URL parameters:
- id: string (channel id)
#### Body parameters:
- channelData = {
	userId: number,
}
### Responses:
- 200: OK, returns the channel that was updated
- 400: Bad request, missing or invalid parameters, or the current user is not an admin of the channel, or the user to unban is not banned
- 401: Unauthorized, missing or invalid token
- 404: Not found, the channel or the user does not exist

## muteInChannel
### Description:
Mute a user in a channel
### URL:
POST /chat/channel/:id/mutes
### Parameters:
#### URL parameters:
- id: string (channel id)
#### Body parameters:
- channelData = {
	userId: number,
	muteExpiration: number
}
### Responses:
- 200: OK, returns the channel that was updated
- 400: Bad request, missing or invalid parameters, or the current user is not an admin of the channel, or the user to mute is not in the channel, or he is already muted, or he is the owner of the channel
- 401: Unauthorized, missing or invalid token
- 404: Not found, the channel or the user does not exist

## blockUser
### Description:
Block a user, so that none of his messages will be received by the current user
### URL:
POST /chat/block/user/:id/
### Parameters:
#### URL parameters:
- id: string (user id to block)
#### Body parameters:
none
### Responses:
- 200: OK, returns the block that was created
- 400: Bad request, missing or invalid parameters, or the user to block is already blocked, or he is the current user
- 401: Unauthorized, missing or invalid token
- 404: Not found, the user to block or the current user does not exist

## unblockUser
### Description:
Unblock a user
### URL:
DELETE /chat/block/user/:id/
### Parameters:
#### URL parameters:
- id: string (user id to block)
#### Body parameters:
none
### Responses:
- 200: OK, returns the block that was deleted
- 400: Bad request, missing or invalid parameters, or the user to block is not blocked
- 401: Unauthorized, missing or invalid token

## getBlockedUsers
### Description:
Get all the users blocked by the current user
### URL:
GET /chat/block/users
### Parameters:
#### URL parameters:
none
#### Body parameters:
none
### Responses:
- 200: OK, returns the ids of the blocked users
- 401: Unauthorized, missing or invalid token


# Friend

## sendFriendRequest
### Description:
Send a friend request, from the current user to a receiver user, thus creating a friend request
### URL:
POST /friend/request/:receiverId
### Parameters:
#### URL parameters:
- receiverId: string
#### Body parameters:
none
### Responses:
- 200: OK, returns the created friend request
- 400: Bad request, missing or invalid parameters, or the receiver is already a friend, or a request already exists, or the receiver is the current user
- 401: Unauthorized, missing or invalid token
- 404: Not found, the receiver or the current user does not exist

## getFriendRequests
### Description:
Get all friend requests of the current user
### URL:
GET /friend/requests
### Parameters:
#### URL parameters:
none
#### Body parameters:
none
### Responses:
- 200: OK, returns the friend requests sent or received by the current user
- 401: Unauthorized, missing or invalid token
- 404: Not found, the current user does not exist

## acceptFriendRequest
### Description:
Accept a friend request, thus creating a friendship between the current user and the sender of the request, and deleting the request
### URL:
POST /friend/request/:requestId/accept
### Parameters:
#### URL parameters:
- requestId: string
#### Body parameters:
none
### Responses:
- 200: OK, returns the created friendship
- 400: Bad request, missing or invalid parameters, or the current user is not the receiver of the request, or he is already friend with the sender
- 401: Unauthorized, missing or invalid token
- 404: Not found, the request or the current user does not exist

## refuseFriendRequest
### Description:
Refuse a friend request, thus deleting the request
### URL:
DELETE /friend/request/:requestId
### Parameters:
#### URL parameters:
- requestId: string
#### Body parameters:
none
### Responses:
- 200: OK, returns the deleted request
- 400: Bad request, missing or invalid parameters, or the current user is not the receiver of the request
- 401: Unauthorized, missing or invalid token
- 404: Not found, the request or the current user does not exist

## getFriends
### Description:
Get all friends of the current user
### URL:
GET /friend/friends
### Parameters:
#### URL parameters:
none
#### Body parameters:
none
### Responses:
- 200: OK, returns the friends of the current user
- 401: Unauthorized, missing or invalid token
- 404: Not found, the current user does not exist

## deleteFriend
### Description:
Delete a friend, thus deleting the friendship
### URL:
DELETE /friend/:friendId
### Parameters:
#### URL parameters:
- friendId: string (userId of the friend to delete)
#### Body parameters:
none
### Responses:
- 200: OK, returns the deleted friendship
- 400: Bad request, missing or invalid parameters, or the current user is not friend with the given user
- 401: Unauthorized, missing or invalid token
- 404: Not found, the current user or the friend does not exist
