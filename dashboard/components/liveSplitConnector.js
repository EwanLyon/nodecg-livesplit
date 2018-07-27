(function () {
	'use strict';

	const livesplitConnection = nodecg.Replicant('livesplitConnected');

	class LiveSplitConnector extends Polymer.Element {
		static get is() {
			return 'nodecg-livesplit';
		}

		static get properties() {
			return {};
		}

		ready() {
			super.ready();

			nodecg.listenFor('livesplit:connectionFail', () => {
				this._toggleInputs(false);
				this._livesplitToast("LiveSplit Connection failed");
			});

			livesplitConnection.on('change', newVal => {
				if (newVal) {
					console.log("Connection is " + newVal + " | Sending connect toast");
					console.log(this.$.livesplitToast.text);
					this._toggleInputs(true);
					this._livesplitToast("Connected to LiveSplit", 2000);
					return;
				}

				console.log("Connection is " + newVal + " | Sending disconnect toast");
				this._toggleInputs(false);
				this._livesplitToast("Disconnected from LiveSplit", 2000);
				console.log(this.$.livesplitToast.text);
			});

			// window.socket.on('reconnect', attempts => {
			// 	if (livesplitConnection.value == true) {
			// 		this._toggleInputs(false);
			// 	} else {
			// 		this._toggleInputs(true);
			// 	}
			// });
		}

		_livesplitConnect() {
			console.log("Attempting LiveSplit connection");
			this._livesplitToast("Connecting to LiveSplit", 0);
			this._toggleInputs(true);
			nodecg.sendMessage(`livesplit:connect`, {
				ip: this.$.ipAddress.value,
				port: this.$.port.value
			});
		}

		_livesplitDisconnect() {
			nodecg.sendMessage(`livesplit:disconnect`);
			this._toggleInputs(false);
		}

		_toggleInputs(settingBool) {
			this.$.disconnect.disabled = !settingBool;
			this.$.connect.disabled = settingBool;
			this.$.ipAddress.disabled = settingBool;
			this.$.port.disabled = settingBool;
		}

		_livesplitToast(message = "", toastDuration = 5000) {
			this.$.livesplitToast.hide();
			this.$.livesplitToast.text = message;
			this.$.livesplitToast.duration = toastDuration;
			this.$.livesplitToast.show();
		}
	}

	customElements.define(LiveSplitConnector.is, LiveSplitConnector);
})();