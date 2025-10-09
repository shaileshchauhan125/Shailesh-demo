const Game = require('./game.js');

console.log('Creating Game instance in test mode...');
const game = new Game([], () => {}, { isTest: true });
console.log('Game instance created. Script should now exit.');
