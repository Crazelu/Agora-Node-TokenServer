const express = require('express');
require('dotenv').config()
const {RtcTokenBuilder, RtcRole} = require('agora-access-token');
const server = require('http').createServer()
const io = require('socket.io')(server)

const PORT = process.env.PORT;

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;

const app = express();

const nocache = (req, resp, next) => {
  resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  resp.header('Expires', '-1');
  resp.header('Pragma', 'no-cache');
  next();
}

const generateAccessToken = (req, resp) => {
  // set response header
  resp.header('Acess-Control-Allow-Origin', '*');
  // get caller id
  const callerId = req.query.callerId;

  if (!callerId) {
    return resp.status(500).json({ 'error': 'callerId is required' });
  }
  // get uid 
  let uid = req.query.uid;
  if(!uid || uid == '') {
    uid = 0;
  }
  // get role
  let role = RtcRole.SUBSCRIBER;
  if (req.query.role == 'publisher') {
    role = RtcRole.PUBLISHER;
  }
  // get the expire time
  let expireTime = req.query.expireTime;
  if (!expireTime || expireTime == '') {
    expireTime = 3600;
  } else {
    expireTime = parseInt(expireTime, 10);
  }
  // calculate privilege expire time
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;
  // build the token
  const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, callerId, uid, role, privilegeExpireTime);

  io.emit(callerId, { 'token': token, 'channelName': callerId })

  // return the token
  return resp.json({ 'token': token, 'callerId': callerId});
}

app.get('/access_token', nocache, generateAccessToken);

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});

let server_port = process.env.SERVER_PORT;

server.listen(server_port, function (err) {
  if (err) throw err
  console.log('Listening on port %d', server_port);
});