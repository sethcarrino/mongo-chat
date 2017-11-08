const mongo = require('mongodb').MongoClient;
// require socket.io - set port to listen on
const client = require('socket.io').listen(4000).sockets;

// Conenct to MongoDB
mongo.connect('mongodb://127.0.0.1/mongochat', (err, db) => {
	if(err) {
		throw err;
	}

	console.log('MongoDB connected...');

	// Connect to Socket.io
	client.on('connection', (socket) => {
		let chat = db.collection('chats');

		// Create function to send status
		sendStatus = (s) => {
			socket.emit('status', s);
		}

		// Gets Chats from Mongo Collection
		chat.find().limit(100).sort({_id:1}).toArray((err, res) => {
			if(err) {
				throw err;
			}

			// Emit Messages
			socket.emit('output', res);
		});

		// Handle input events
		socket.on('input', (data) => {
			let name = data.name;
			let message = data.message;

			// Check for name and message
			if(name == '' || message == ''){
				// Send error status
				sendStatus('Please enter a name and message');
			} else {
				// Insert message into the datatbase
				chat.insert({
					name: name,
					message: message
				}, () => {
					client.emit('output', [data]);

					// Send Status object
					sendStatus({
						message: 'Message sent',
						clear: true
					})
				})
			}
		});

		// Handle Clear
		socket.on('clear', (data) => {
			// Remove all chats from collection
			chat.remove({}, () => {
				// Emit Cleared
				socket.emit('cleared');
			});
		});
	});
});