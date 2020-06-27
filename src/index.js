const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, getUser, getUserInRoom, removeUser } = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));


io.on("connection", (socket) => {
  console.log("hellooo from socket");

  //----------------------------------------------------------- 

  // // emit an event to the socket (everyone!!!!!!!)
  // socket.emit("message", generateMessage('Welcome!!'))
  // socket.broadcast.emit('message', generateMessage('A new user has joined'))

  //----------------------------------------------------------- 

  socket.on('join', (options, callback) => {

    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error)
    }

    socket.join(user.room);

    // emit an event to the socket (just room!!!!)
    socket.emit("message", generateMessage('Admin', 'Welcome!'))
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`))

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUserInRoom(user.room)
    })

    callback()
  })

  //----------------------------------------------------------- 

  // listen to the event
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id)
    const filter = new Filter()

    if (filter.isProfane(message)) {
      return callback('You are not allowed to say this!!!!')
    }
    // emit an event to all connected sockets
    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });

  //----------------------------------------------------------- 

  // listen to the event
  socket.on('sendLocation', (cords, callback) => {
    const user = getUser(socket.id)

    // emit an event to all connected sockets
    io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${cords.latitude},${cords.longitude}`));
    callback();
  });

  //----------------------------------------------------------- 

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUserInRoom(user.room)
      })
    }
  })

});

// -------------------------------------------------------------------------

server.listen(port, () => {
  console.log(`Server is running on ${port}`);
});

// -------------------------------------------------------------------------
// let count = 0;

// io.on("connection", (socket) => {
//   console.log("hellooo from socket");

//   // emit an event to the socket
//   socket.emit("countUpdated", count);

//   // listen to the event
//   socket.on("increment", () => {
//     count++;

//     // emit an event to all connected sockets
//     io.emit("countUpdated", count);
//   });
// });
