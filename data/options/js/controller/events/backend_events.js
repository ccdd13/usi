"use strict";

/* global language_controller, self */

function backend_events_class() {

	if (typeof self.port !== "undefined") {

		var api = self.port;

		return {
			register_global_events: function () {

				api.on("USI-BACKEND:get-alert", function (text) {
					window.alert(text);
				});

				/**
				 * Wenn das Userscript schon existiert und überschrieben werden kann
				 */
				api.on("USI-BACKEND:same-userscript-was-found",
					/**
					 * 
					 * @param {object} userscript_infos
					 * @returns {void}
					 */
					function (userscript_infos) {

						//wurde gefunden, möchtest du es aktualisieren?")){
						if (window.confirm(language_controller.get("same_userscript_was_found_ask_update_it_1") + userscript_infos.id + language_controller.get("same_userscript_was_found_ask_update_it_2"))) {
							// Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
							api.emit("USI-BACKEND:override-same-userscript", userscript_infos);
							api.emit("USI-BACKEND:request-for---list-all-scripts");
						}
					});
	
				// Speichert ein Userscript!
				api.on("USI-BACKEND:export-userscript-done", function (result) {
					createDownload(result.userscript, "text/plain", encodeURI(result.filename + ".user.js"));
				});
	
			}

		};

	} else {
		return false;
	}

};

var backend_events_controller = backend_events_class();