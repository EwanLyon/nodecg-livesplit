'use strict';

const ipc = require("node-ipc");

const serverRetries = 5;
var retryCounter = serverRetries;
var _isConnected = false;

ipc.config.silent = true;
ipc.config.rawBuffer = true;
ipc.config.retry = 1000;
ipc.config.maxRetries = serverRetries;

module.exports = function (nodecg) {

	const livesplitConnection = nodecg.Replicant('livesplitConnected', {defaultValue: false, persistent: false});
	var lastData;

	nodecg.listenFor('livesplit:connect', (params) => {
		_connectToLiveSplit(params);
	});

	nodecg.listenFor('livesplit:disconnect', () => {
		_disconnectLiveSplit();
	});

	function _connectToLiveSplit(params) {
		ipc.connectToNet('lsConnection', params.ip, params.port, () => {

			ipc.of.lsConnection.on('connect', () => {
				nodecg.sendMessage('livesplit:connectionSuccess');
				nodecg.log.info("Connected to LiveSplit");
				_isConnected = true;
				livesplitConnection.value = true;
			});

			ipc.of.lsConnection.on('data', (serverData) => {
				var formattedMessage;
				try {
					formattedMessage = serverData.toString().trim();
				} catch (error) {
					nodecg.log.error('Something went wrong formatting the returned data: ' + error);
					return;
				}
				lastData = formattedMessage;
			});

			ipc.of.lsConnection.on('disconnect', () => {
				_isConnected = false;
				livesplitConnection.value = false;
				retryCounter--;

				if (retryCounter < 0) {
					nodecg.log.error('Failed to connect to LiveSplit');
					nodecg.sendMessage('livesplit:connectionFail');
					retryCounter = serverRetries;
				}
			});
		});

	}

	function _disconnectLiveSplit() {
		ipc.disconnect('lsConnection');
		livesplitConnection.value = false;
		nodecg.log.info('Disconnected LiveSplit');
	}

	nodecg.listenFor('livesplit:sendAction', (data) => {
		if (!_isConnected){
			nodecg.log.error('LiveSplit is not connected');
			return;
		}

		var sendingMessage;

		try {
			sendingMessage = data.toString().trim();
			sendingMessage += "\r\n";
		}
		catch(e) {
			nodecg.log.error('Something wrong with data being sent: ', e);
		}
		
		ipc.of.lsConnection.emit(sendingMessage);
	});

	nodecg.listenFor('livesplit:sendData', (data, callback) => {
		if (!_isConnected){
			nodecg.log.error('LiveSplit is not connected');
			return;
		}
		var sendingMessage;
		try {
			sendingMessage = data.toString().trim();
			sendingMessage += "\r\n";
		}
		catch(e) {
			nodecg.log.error('Something wrong with data being sent: ', e);
		}
		
		ipc.of.lsConnection.emit(sendingMessage);

		setTimeout(() => {
			callback(lastData);
		}, 5);
		
	});
};