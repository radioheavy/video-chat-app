const { PeerServer } = require('peer');
const express = require('express');

const app = express();
const server = PeerServer({ 
  port: 9000, 
  path: '/' 
});

console.log('PeerJS sunucusu 9000 portunda çalışıyor'); 