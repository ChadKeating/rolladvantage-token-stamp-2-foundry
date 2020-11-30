import { canvasReady, ready } from "./hooks";

// Hooks.on("canvasReady", canvasReady);
// Hooks.on("ready", ready);

const RollAdvantageTokenStamp2 = {
	getSavePath: () => {
		return "worlds/" + game.world.name + "/rolladvantage";
	},
	createDirectory: async () => {
		var savePath = RollAdvantageTokenStamp2.getSavePath();
		var dir = await FilePicker.browse("data", savePath);
		console.dir(dir);
		if (dir == null || dir.target != savePath) {
			FilePicker.createDirectory("data", savePath)
		}
	},
	render: async (config, html) => {
		var subHtml = html.find('.tab[data-tab="image"]').find(".form-group .form-fields").first();
		subHtml.append("<button type='button' id='ra-ts2-open-button' title='Create Token' tabindex='-1'><img src='https://rolladvantage.com/assets/images/logo/default.png' /></button>");
		subHtml.find("#ra-ts2-open-button").click(event => {
			event.preventDefault()
			const wrapper = new TokenStampWrapper();
			wrapper.render(true);
			wrapper.exportInputBox = html.find("input.image");
		});
	}
};

class TokenStampWrapper extends Application {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.template = "/modules/rolladvantage-token-stamp-2-foundry/templates/wrapper-template.html";
		options.resizable = false;
		options.width = 1263;
		options.height = 937;
		options.classes = ["ts2-wrapper"];
		options.title = "Token Stamp 2 - RollAdvantage.com";
		return options;
	}

	static createTokenFile(data, filename) {
		var blobBin = atob(data.split(',')[1]);
		var array = [];
		for (var i = 0; i < blobBin.length; i++) {
			array.push(blobBin.charCodeAt(i));
		}
		var fileBlob = new Blob([new Uint8Array(array)], { type: 'image/png' });
		return new File([fileBlob], filename);
	}

	static async uploadToken(data, filename) {
		var file = TokenStampWrapper.createTokenFile(data, filename);
		return await FilePicker.upload("data", RollAdvantageTokenStamp2.getSavePath(), file, {});
		/*
		// Create the form data to post
		const fd = new FormData();
		let test = await data;
		fd.set("source", 'data');
		fd.set("target", RollAdvantageTokenStamp2.getSavePath());
		fd.set("upload", test, filename);

		// Dispatch the request
		const request = await fetch('/upload', { method: "POST", body: fd });
		if (request.status === 413) {
			return ui.notifications.error(game.i18n.localize("FILES.ErrorTooLarge"));
		} else if (request.status !== 200) {
			return ui.notifications.error(game.i18n.localize("FILES.ErrorSomethingWrong"));
		}

		// Retrieve the server response
		const response = await request.json();
		if (response.error) {
			ui.notifications.error(response.error);
			return false;
		} else if (response.message) {
			if (/^(modules|systems)/.test(response.path)) {
				ui.notifications.warn(game.i18n.localize("FILES.WarnUploadModules"))
			}
			ui.notifications.info(response.message);
		}
		return response;*/


	}

	async close() {
		window.removeEventListener("message", TokenStampWrapper.foundryImportCallback, false);
		return super.close();
	}

	static foundryImportCallback(event) {
		if (event.origin != "https://rolladvantage.com") {
			return;
		}

		if (event.data.action == "importToken") {
			importToken();
		}
	}

	activateListeners(html) {
		super.activateListeners(html);
		var that = this;

		window.addEventListener("message", TokenStampWrapper.foundryImportCallback, false);
		var importToken = () => {
			var callback = (event) => {
				if (event.origin != "https://rolladvantage.com") {
					return;
				}
				window.removeEventListener("message", callback, false);
				var timeStamp = Math.floor(Math.floor(((Date.now() / 100000000) - Math.floor(Date.now() / 100000000)) * 100000000) / 100);
				var prom = TokenStampWrapper.uploadToken(event.data.stampData, game.userId + "-" + calcTimeStamp + ".png");
				prom.then(x => {
					that.exportInputBox[0].value = x.path;
					that.close();
				})
			};
			window.addEventListener("message", callback, false);

			var iWindow = document.getElementById('ra-ts2-iframe').contentWindow;
			iWindow.postMessage({
				action: "getFoundryData"
			}, "*");
		};
		html.on("click", "#ra-ts2-import-token-button", importToken);
	}

	/*
	 Name 	Type 	Description
baseApplication 	string

A named "base application" which generates an additional hook
width 	number

The default pixel width for the rendered HTML
height 	number

The default pixel height for the rendered HTML
top 	number

The default offset-top position for the rendered HTML
left 	number

The default offset-left position for the rendered HTML
popOut 	boolean

Whether to display the application as a pop-out container
minimizable 	boolean

Whether the rendered application can be minimized (popOut only)
resizable 	boolean

Whether the rendered application can be drag-resized (popOut only)
id 	string

The default CSS id to assign to the rendered HTML
classes 	Array.<string>

An array of CSS string classes to apply to the rendered HTML
title 	string

A default window title string (popOut only)
template 	string

The default HTML template path to render for this Application
scrollY 	Array.<string>

A list of unique CSS selectors which target containers that should have their vertical scroll positions preserved during a re-render.
	**/
}

Hooks.on('ready', () => {
	const renderTokenConfig = `renderTokenConfig${game.system.id === 'pf1' ? 'PF' : ''}`;
	Hooks.on(renderTokenConfig, RollAdvantageTokenStamp2.render);
	RollAdvantageTokenStamp2.createDirectory();
});