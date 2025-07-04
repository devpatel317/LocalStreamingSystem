To run backend -> npm start
To run Frontend -> npm run dev

In Backend , server.js main file

In frontend ,
  main.jsx -> starting of the frontend code
  App.jsx -> I have two important conponents Appbar.jsx and StreamDisplay.jsx 
  socket.js -> To connect socket server
  /src/RemoteVideo.jsx -> to show all video frames when user join
  getStreamStats.js -> To get the stream stats like fps,latency,jitter,frames decoded etc.

For Ui i use Material UI library.

Main task is to implement webrtc , sockets etc.. so that i dont go deepp into ui and how user connect to room i simple make system where if user enter same room id then they enter to that room and connect to each other .

