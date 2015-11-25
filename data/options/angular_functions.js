"use strict";

/* global angular, self, directive, basic_helper */
 
//var usiOptions = angular.module('usiOptions', []);
var usiOptions = angular.module('usiOptions', ["mobile-angular-ui","mobile-angular-ui.gestures"]);

/************************************************************************
 ************************* Übersetzungen holen **************************
 ************************************************************************/

// Overlay Controller
usiOptions.controller("Overlay", ["$scope", "$rootScope", function Overlay($scope, $rootScope){	
	// Version von USI
	$scope.version		=	self.options.version;
	
	$scope.nav_title	=	"Überblick";
	
}]);

//Auflistung der Userscripte
usiOptions.controller("ListUserScripts", ["$scope", "$rootScope", "$q", function ListUserScripts($scope, $rootScope, $q){
	// Var init...
	$scope.all_userscripts	=	{};
	$scope.userscript_count	=	0;
	$scope.lang				=	self.options.language;
	
	
		console.log($rootScope.version);
	
	/**
	 * Userscript aktivieren, bzw deaktivieren
	 * @param {type} userscript
	 * @returns void
	 */
	$scope.toggleActivation = function (userscript){
		// aktiviere oder deaktiviere dieses Userscript!
		self.port.emit("toggle-userscript-state", userscript.id);
	};
	
	$scope.delete = function (userscript){
		// das Skript mit der ID löschen!
		if (!basic_helper.empty(userscript.id)) {
			//zusätzliche Abfrage
			if(window.confirm( $scope.lang.want_to_delete_this_userscript_1 + userscript.id + $scope.lang.want_to_delete_this_userscript_2)){
				
				// @todo erstmal abschalten!!!
				self.port.emit("delete-script-by-id", userscript.id);
				
				self.port.emit("request-for---list-all-scripts");
			}
		}
	};
	
	// Sende es an den Editierungs Controller
	$scope.edit = function (userscript){
		$rootScope.$emit("EditUserscipt_edit", userscript);
		
		// veranlasse den Tab Wechsel!
		$rootScope.tab = 'create';
	};
	
		// Wenn Userscripts gesendet werden, packe sie in die Variable --- all_userscripts
		self.port.on("list-all-scripts", function (data) {
			
			// Daten für alle Userscripts setzen
			$scope.all_userscripts = data;

			// Anzahl der Userscripts - zählen mittels Object.keys
			$scope.userscript_count = Object.keys(data).length;

		});
		
	// Speicherverbrauch anzeigen
	self.port.on("storage-quota", function (quota) {
		var rounded_quota = Math.round(quota * 100) / 100 + "";

		// falls ein Komma enthalten sein sollte ...
		rounded_quota = rounded_quota.replace(".", ",");
		
		$scope.currentMemoryUsage	=	$scope.lang.actual_used_quota + " : " + rounded_quota + "%";
	});

	// Userscripte anfragen
//	self.port.emit("request-for---list-all-scripts");

	// Promise notwendig, damit beim initialen Aufruf die Daten geladen werden, ohne auf den Button klicken zu müssen
//	var promise = asyncPortOn("list-all-scripts");
//		promise.then(function (data) {
//			// Daten für alle Userscripts setzen
//			$scope.all_userscripts = data;
//
//			// Anzahl der Userscripts - zählen mittels Object.keys
//			$scope.userscript_count = Object.keys(data).length;
//		});
		
	// Interne Funktion für die Promise API
	function asyncPortOn(event_name) {
		var deferred = $q.defer();

		self.port.on(event_name, function(data){
			deferred.resolve(data);
		});

		return deferred.promise;
	}
	
}]).directive("listuserscripts", function(){
    return {
		templateUrl : "directive/list_userscripts.html"
    };
});


// Extra Optionen
usiOptions.controller("ExtraOptionsForUSI", ["$scope", "$rootScope" , function ExtraOptionsForUSI($scope, $rootScope){
	// Var init...
//	$scope.all_userscripts = {};
	$scope.lang = self.options.language;
	
	$scope.deleteAll = function (){
		// Doppelte Sicherheitsabfrage, bevor wirklich alles gelöscht wird!
		if(window.confirm($scope.lang.really_reset_all_settings)){
			if(window.confirm($scope.lang.really_really_reset_all_settings)){
				self.port.emit("delete-everything");
				self.port.emit("request-for---list-all-scripts");
			}
		}
	};
	
	// Prüfe ob für die Skripte Updates gefunden wurden!
	$scope.checkForUpdates = function(){
		self.port.emit("check-for-userscript-updates");
	};
	
	// Hört darauf ob Aktualisierungen für die Skripte zur Verfügung stehen ...
	self.port.on("update-for-userscript-available", function (userscript_infos) {
		if (window.confirm($scope.lang.userscript_update_was_found_1 + userscript_infos.id + $scope.lang.userscript_update_was_found_2)) {

			// Nun das Skript aktualisieren!
			self.port.emit("override-same-userscript", userscript_infos);
			
			self.port.emit("request-for---list-all-scripts");
		}
	});
	
	// Wenn das Skript gelöscht wurde
	self.port.on("delete-script-is-now-deleted", function (script_was_deleted) {
		if (script_was_deleted === true) { // script wurde erfolgreich gelöscht
			window.alert($scope.lang.userscript_was_successful_deleted);
		} else { // script konnte nicht gelöscht werden
			window.alert($scope.lang.userscript_could_not_deleted);
		}
	});
	
}]);

// Userscript nachladen
usiOptions.controller("LoadExternalUserScript", ["$scope", "$rootScope" , function LoadExternalUserScript($scope, $rootScope){
	// Var init...
	$scope.url		= "";
	$scope.lang		= self.options.language;
	
	// Userscript nachladen
	$scope.loadExternal = function(){
		$scope.error = "";
		if(typeof $scope.url !== "undefined" && $scope.url.length > 0){
			// sende die URL an das Backend Skript...
			self.port.emit("loadexternal-script_url", {script_url: $scope.url});
			
			self.port.emit("request-for---list-all-scripts");
		}else{
			// Fehler Text anzeigen
			$scope.error = $scope.lang.empty_userscript_url;
		}
	};
	
}]).directive("loadexternaluserscript", function(){
    return {
		templateUrl : "directive/load_external_userscript.html"
    };
});



// Userscript bearbeiten
usiOptions.controller("EditUserScript", ["$scope", "$rootScope" , function EditUserScript($scope, $rootScope){
	// Var init...
	$scope.lang						= self.options.language;
	$scope.userscript_example		= angular.element("#userscript-example").html();
	$scope.textarea_default_size	= angular.element("#script-textarea").css("font-size").split("px")[0];
	$scope.state					=	0;
	
	
	$scope.setTextareaHeight = function(){
		var window_innerHeight	=	parseInt(window.innerHeight),
		size_by_percent			=	65 / 100;
		
		// Textarea höhe berechnen
		var textarea_height		=	Math.floor(window_innerHeight * size_by_percent);
	
		// Größe setzen
		angular.element("#script-textarea").css("height", textarea_height + "px");		
	};
	
	
	/**
	 * Textarea Größe anpassen
	 * @returns {undefined}
	 */
	$scope.changeSize = function(){
		// Setze die Größe der Textarea auf den Wert aus dem Range "Button"
		angular.element("#script-textarea").css("font-size", $scope.textarea_size + "px");
	};
	
	/**
	 * Textarea auf Standard Größe zurücksetzen
	 * @returns {undefined}
	 */
	$scope.defaulltSize = function(){
		// Wert des ZOOM Reglers auf den Standard setzen
		$scope.textarea_size = $scope.textarea_default_size;
		
		// Setze die Größe der Textarea auf den Wert aus dem Range "Button"
		angular.element("#script-textarea").css("font-size", $scope.textarea_default_size + "px");
	};
	
	/**
	 * Userscript aus der Textarea übermitteln
	 * @returns {undefined}
	 */ 
	$scope.save = function(){
		// Textarea nicht leer ...
		if($scope.textarea){
			// sende den Userscript Text an das Addon Skript...
			self.port.emit("new-usi-script_content", {script: $scope.textarea});
			
			self.port.emit("request-for---list-all-scripts");
		}	
	};

	/**
	 * Textarea in einen Vollbild Modus schalten!
	 * @returns {undefined}
	 */
	$scope.textarea_to_fullscreen = function(){
		var window_innerHeight	=	parseInt(window.innerHeight),
		size_by_percent			=	75 / 100;

		// Textarea höhe berechnen
		var textarea_height		=	Math.floor(window_innerHeight * size_by_percent);

		// Größe setzen
		jQuery("#script-textarea").css("height", textarea_height + "px");
	};

	/**
	 * Wenn das Userscript schon existiert und überschrieben werden kann
	 */
	self.port.on("same-userscript-was-found",function (userscript_infos){
	
		//wurde gefunden, möchtest du es aktualisieren?")){
		if(window.confirm($scope.lang.same_userscript_was_found_ask_update_it_1 +  userscript_infos.id + $scope.lang.same_userscript_was_found_ask_update_it_2)){
			// Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
			self.port.emit("override-same-userscript", userscript_infos);
			self.port.emit("request-for---list-all-scripts");
		}
	});

	/**
	 * Events
	 */
	$rootScope.$on("EditUserscipt_edit", function(event,userscript){
		// Nimm das Userscript und schreibe es in die Textarea
		$scope.textarea = userscript.userscript;
		$scope.script_id = userscript.id;
		// Schalte den State um
		$scope.state = "edit";
	});


	// Schalter richtig positionieren lassen ...
	$scope.defaulltSize();
	
	$scope.setTextareaHeight();
	
}]).directive("edituserscript", function(){
    return {
		templateUrl : "directive/edit_userscript.html"
    };
}); 