const RollAdvantageTokenStamp2 = {
	getSavePath: () => {
		return game.settings.get(RollAdvantageTokenStamp2.moduleNamespace, RollAdvantageTokenStamp2.tokenPathSettingsKey);
	},
	createDirectory: async () => {
		let savePath = RollAdvantageTokenStamp2.getSavePath();
		let dir = await FilePicker.browse("data", savePath);
		console.dir(dir);
		if (dir == null || dir.target != savePath) {
			await FilePicker.createDirectory("data", savePath)
		}
	},
	//https://stackoverflow.com/questions/50391422/detect-that-given-element-has-been-removed-from-the-dom-without-sacrificing-perf
	onRemoveHelper: (element, callback) => {
		const parent = element.parentNode;
		if (!parent) throw new Error("The node must already be attached");

		const obs = new MutationObserver(mutations => {
			for (const mutation of mutations) {
				for (const el of mutation.removedNodes) {
					if (el === element) {
						obs.disconnect();
						callback();
					}
				}
			}
		});
		obs.observe(parent, {
			childList: true,
		});
	},
	render: async (config, html) => {
		var subHtml = html.find('.tab[data-tab="image"]').find(".form-group .form-fields").first();
		subHtml.append("<button type='button' id='ra-ts2-open-button' title='Create Token' tabindex='-1'><img src='https://rolladvantage.com/assets/images/logo/default.png' /></button>");
		subHtml.find("#ra-ts2-open-button").click(event => {

			let isStampOpen = Object.keys(ui.windows)
				.map(key => ui.windows[key])
				.some(win => win.options.classes.some(x => x == "ra-ts2-wrapper"));

			if(isStampOpen)
				return;

			event.preventDefault()
			const wrapper = new TokenStampWrapper();
			wrapper.render(true);
			wrapper.exportInputBox = html.find("input.image");

			RollAdvantageTokenStamp2.onRemoveHelper(html[0], ()=>{
				wrapper.close();
			});
		});
	}
};
RollAdvantageTokenStamp2.moduleNamespace = "rolladvantage-token-stamp-2-foundry";
RollAdvantageTokenStamp2.tokenPathSettingsKey = "token-save-path";

class TokenStampWrapper extends Application {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.template = "/modules/rolladvantage-token-stamp-2-foundry/templates/wrapper-template.html";
		options.resizable = false;
		options.width = 841;
		options.height = 678;
		options.classes = ["ra-ts2-wrapper"];
		options.title = "Token Stamp 2 - RollAdvantage.com";
		return options;
	}

	static createTokenFile(data, filename) {
		let blobBin = atob(data.split(',')[1]);
		let array = [];
		for (let i = 0; i < blobBin.length; i++) {
			array.push(blobBin.charCodeAt(i));
		}
		let fileBlob = new Blob([new Uint8Array(array)], { type: 'image/png' });
		return new File([fileBlob], filename);
	}

	static async uploadToken(data, filename) {
		let file = TokenStampWrapper.createTokenFile(data, filename);
		let uploadResponse = await FilePicker.upload("data", RollAdvantageTokenStamp2.getSavePath(), file, {});
		return uploadResponse;
	}

	async close() {
		window.removeEventListener("message", this.boundCallback, false);
		return super.close();
	}

	foundryImportCallback(event) {
		if (event.origin != "https://rolladvantage.com") {
			return;
		}

		if(event.data.action == "sourceRegistered") {
			TokenStampWrapper.sourceRegistered = true;

		}

		if (event.data.action == "importToken") {
			let that = this;
			let timeStamp = Math.floor(Math.floor(((Date.now() / 100000000) - Math.floor(Date.now() / 100000000)) * 100000000) / 100);
			let prom = TokenStampWrapper.uploadToken(event.data.stampData, game.userId + "-" + timeStamp + ".png");
			prom
			.then(x => {
				that.exportInputBox[0].value = x.path;
				that.close();
			});
		}

		if (event.data.action == "importTokenUrl") {
			let that = this;
			that.exportInputBox[0].value = event.data.tokenUrl;
			that.close();
		}
	}

	activateListeners(html) {
		super.activateListeners(html);
		let that = this;

		this.boundCallback = this.foundryImportCallback.bind(this);
		window.addEventListener("message", this.boundCallback, false);

		TokenStampWrapper.sourceRegistered = false;
		let iWindow = document.getElementById('ra-ts2-iframe').contentWindow;
		function waitForTokenStampLoaded() {
			if(TokenStampWrapper.sourceRegistered) {
				console.log("Token Stamp Connected - Source Registered");
				let fp = new FilePicker();
				iWindow.postMessage({
					action: "uploadPermission",
					uploadPermission: fp.canUpload
				}, "*");
				return;
			}

			iWindow.postMessage({
				action: "registerSource"
			}, "*");

			if(that._element.length > 0) {
				console.log("Waiting for TS");
				setTimeout(waitForTokenStampLoaded, 500);
			}
		}
		waitForTokenStampLoaded();
	}
}

Hooks.on('ready', () => {

	game.settings.register(RollAdvantageTokenStamp2.moduleNamespace, RollAdvantageTokenStamp2.tokenPathSettingsKey, {
		name: "Token Stamp 2 Save Path",
		hint: "The path tokens are saved to when imported to Foundry.",
		scope: "world",
		config: true,
		type: String,
		default: "worlds/" + game.world.name + "/rolladvantage",
		onChange: value => RollAdvantageTokenStamp2.createDirectory()
	});

	const renderTokenConfig = `renderTokenConfig${game.system.id === 'pf1' ? 'PF' : ''}`;
	Hooks.on(renderTokenConfig, RollAdvantageTokenStamp2.render);
	RollAdvantageTokenStamp2.createDirectory();
});