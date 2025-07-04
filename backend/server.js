const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors : {
    origin: "*",
    methods: ["GET", "POST"],
  }
})

const rooms = {};

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('join-room', (roomId) => {
    console.log(`Client joined room ${roomId}`);
    socket.roomId = roomId;
    if(!rooms[roomId]) rooms[roomId] = [];

    //send existing user in the room to the new joine user
    const existingUser = rooms[roomId];
    socket.emit('all-users', existingUser);

    //add new user to the room
    rooms[roomId].push(socket.id);
    socket.join(roomId);

    //Tell existing users about the new user
    socket.to(roomId).emit('user-joined', socket.id);

  });

  socket.on('offer', (targetId , offer) => {
      io.to(targetId).emit('offer', socket.id, offer);
  }); 

  socket.on('answer', (targetId, answer) => {
      io.to(targetId).emit('answer', socket.id, answer);
  });

  socket.on('ice-candidate', (targetId, candidate) => {
    io.to(targetId).emit('ice-candidate', socket.id, candidate);
  });

  socket.on('disconnect', () => {
    console.log(`DISCONNECT EVENT FIRED: ${socket.id}`);
    const room = socket.roomId;
    if(room && rooms[room]) {
      rooms[room] = rooms[room].filter(id => id !== socket.id);
      socket.to(room).emit('user-left', socket.id);
    }
  });

  socket.on('leave-room', (roomId) => {
    console.log(`LEAVE ROOM EVENT: ${socket.id}`);
    if (roomId && rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
        socket.to(roomId).emit('user-left', socket.id);
    }
  });

});

server.listen(5000, () => {
  console.log('Server listening on port 5000');
});