var json;
var jsonlabels;
var jsondefaultlabels;
var statusindex = 0;
var channeloverride;
var cvarupdateindex;
var editcontrollerid;
var seriesOptions;
var chart;
var names;
var memoryraw = "";
var MemString;
var MemURL;
var memindex;
var mqtt;
var cloudusername;
var cloudpassword;
var dropdownscope;
var parametersscope;
var settingsscope;
var relayscope;
var currentstorage;
var ourtimer;
var currenttimeout;
var updatestring = "";
var internalmemoryrootscope;
var internalmemoryscope;
var localserver;
var reconnectAttempts = 0;
var maxReconnectAttempts = 4;
var attempts = 0;



var rfmodes = ["Constant", "Lagoon", "Reef Crest ", "Short Pulse", "Long Pulse", "Nutrient Transport", "Tidal Swell", "Feeding", "Feeding", "Night", "Storm", "Custom", "Else"];
var rfimages = ["constant.png", "lagoon.png", "reefcrest.png", "shortpulse.png", "longpulse.png", "ntm.png", "tsm.png", "feeding.png", "feeding.png", "night.png", "storm.png", "custom.png", "custom.png"];
var rfmodecolors = ["#00682e", "#ffee00", "#ffee00", "#16365e", "#d99593", "#eb70ff", "#eb70ff", "#000000", "#000000", "#000000", "#000000", "#000000", "#000000"];
var dimmingchannels = ["Daylight Channel", "Actinic Channel", "Dimming Channel 0", "Dimming Channel 1", "Dimming Channel 2", "Dimming Channel 3", "Dimming Channel 4", "Dimming Channel 5", "AI White Channel", "AI Royal Blue Channel", "AI Blue Channel", "Radion White Channel", "Radion Royal Blue Channel", "Radion Red Channel", "Radion Green Channel", "Radion Blue Channel", "Radion Intensity Channel", "Daylight 2 Channel", "Actinic 2 Channel"];
var customvars = ["Custom Var 0", "Custom Var 1", "Custom Var 2", "Custom Var 3", "Custom Var 4", "Custom Var 5", "Custom Var 6", "Custom Var 7"];
var pwmchannels = ["PWMD", "PWMA", "PWME0", "PWME1", "PWME2", "PWME3", "PWME4", "PWME5", "AIW", "AIRB", "AIB", "RFW", "RFRB", "RFR", "RFG", "RFB", "RFI", "PWMD2", "PWMA2"];

var app = angular.module('uapp', ['onsen', 'ngStorage', 'ngAnimate']);


app.controller('DropdownController', function ($rootScope, $scope, $http, $localStorage, $timeout, $window) {
	$scope.rfmodes = [{"name":"Constant","color":"#00682e","id":"0"},{"name":"Lagoon","color":"#ffee00","id":"1"},{"name":"Reef Crest","color":"#ffee00","id":"2"},{"name":"Short Pulse","color":"#16365e","id":"3"},{"name":"Long Pulse","color":"#d99593","id":"4"},{"name":"Nutrient Transport","color":"#eb70ff","id":"5"},{"name":"Tidal Swell","color":"#eb70ff","id":"6"},{"name":"Feeding","color":"#F5C127","id":"7"},{"name":"Night","color":"#90C3D4","id":"9"},{"name":"Storm","color":"black","id":"10"},{"name":"Custom","color":"#72BD4D","id":"11"}];
	$scope.dcmodes = [{"name":"Constant","color":"#00682e","id":"0"},{"name":"Lagoon","color":"#ffee00","id":"1"},{"name":"Reef Crest","color":"#ffee00","id":"2"},{"name":"Short Pulse","color":"#16365e","id":"3"},{"name":"Long Pulse","color":"#d99593","id":"4"},{"name":"Nutrient Transport","color":"#eb70ff","id":"5"},{"name":"Tidal Swell","color":"#eb70ff","id":"6"},{"name":"Feeding","color":"#F5C127","id":"7"},{"name":"Night","color":"#90C3D4","id":"9"},{"name":"Storm","color":"black","id":"10"},{"name":"Custom","color":"#72BD4D","id":"11"},{"name":"Else","color":"#B28DC4","id":"12"},{"name":"Sine","color":"#47ADAC","id":"13"},{"name":"Gyre","color":"#768C8C","id":"14"}];
	$scope.$storage = $localStorage;
	$scope.radatetime = "Never";
	var attempts=0;
	//$localStorage.controllers = null;
	dropdownscope=$scope;
	relayscope=$scope;
	localserver=window.location.href.indexOf("content.html")!=-1;
	loaddefaultvalues();
	loaddefaultlabels();
	if ($localStorage.controllers != null)
	{
		$scope.activecontroller=$localStorage.activecontroller;
		if ($localStorage.activecontroller==null)
			if ($localStorage.controllers.length>0)
			{
				$scope.activecontroller=$localStorage.controllers[0].name;
				$localStorage.activecontrollerid=0;
			}
		if ($localStorage.jsonlabels==null) $localStorage.jsonlabels=jsonlabels;
	}
	else
	{
		$localStorage.json=new Object();
		$localStorage.controllers=[];
		$localStorage.jsonarray=[];
		$localStorage.jsonlabelsarray=[];
		$scope.activecontroller=null;
		$localStorage.activecontroller=null;
		$localStorage.activecontrollerid=null;
	}
    
//	console.log("$localStorage.controllers: " + $localStorage.controllers);
//	console.log("$localStorage.jsonarray: " + $localStorage.jsonarray);
//	console.log("$localStorage.jsonlabelsarray: " + $localStorage.jsonlabelsarray);
//	console.log("$scope.activecontroller: " + $scope.activecontroller);
//	console.log("$localStorage.activecontrollerid: " + $localStorage.activecontrollerid);
	$scope.$on('msg', function(event, msg) {
		//console.log('DropdownController'+msg);
		if (msg=="popoverclose")
		{
			$scope.activecontroller=$localStorage.activecontroller;
			$scope.popover.hide();
		}
	});
	ons.createPopover('popover.html').then(function(popover) {
		$scope.popover = popover;
	});

	$scope.closealert=function(){
		alertDialog.hide();
	}

	$scope.syncdate=function(){
		var d=new Date();
		$scope.getcontrollerdata('d' + d.getHours().padLeft() + d.getMinutes().padLeft() + "," + (d.getMonth()+1).padLeft() + d.getDate().padLeft() + "," + (d.getYear()-100).toString());
        console.log(Date);
	}

	$scope.showforumid=function(){
		ons.notification.alert({message:'Forum username: ' + parametersscope.forumid, title: 'Reef Angel Controller'});
	}

	$scope.getcontrollerdata=function(cmd) {
		if ($localStorage.controllers.length==0 && !localserver) return;
	//	console.log("getcontrollerdata(): " + cmd);
		// This is a cloud request
		if (mqtt!=null)
		{
			getcontrollerdatacloud(cmd);
			return;
		}
		// Check if we should try to connect to cloud
		if (cmd == "r99" && MQTTconnect()) return;
		// This is a non-cloud request
		getcontrollerdatahttp(cmd);
	}

function getcontrollerdatahttp(cmd) {
    modal.show(); // Show modal at the start of the function

    if (!$localStorage.controllers || !$localStorage.controllers[$localStorage.activecontrollerid]) {
        console.error("Controller configuration not found.");
        modal.hide();
        return;
    }

    const controller = $localStorage.controllers[$localStorage.activecontrollerid];
    const userIp = controller.ipaddress;
    const port = controller.port;
    var tempurl;

    if (localserver) {
        tempurl = document.referrer.replace("wifi", "") + cmd;
    } else if (/^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))\./.test(userIp)) {
        tempurl = "http://" + userIp + ":" + port + "/" + cmd; // Local network IP, direct access
    } else {
        tempurl = "https://forum.reefangel.com/px/" + userIp + "/" + port + "/" + cmd; // Non-local IP, use the proxy
    }

   // console.log("Requesting data from:", tempurl);

    $http.get(tempurl, {timeout: 3000})
        .then(function(response) {
            processResponseData(cmd, response.data); // Process all the response data inside this function
        })
        .catch(function(error) {
 //           console.error("Error fetching data:", error);
            if (attempts < 3) {
                attempts++;
                getcontrollerdatahttp(cmd); // Retry logic
            } else {
                ons.notification.alert({message: 'Unable to process controller data!', title: 'Reef Angel Controller'});
                attempts = 0; // Reset attempts after retries are exhausted
            }
        })
        .finally(() => {
            modal.hide(); // Ensure modal is hidden regardless of request outcome
        });
}

function processResponseData(cmd, data) {
   if (cmd.substring(0,1)=='r')
			{
				var x2js = new X2JS();
				json = x2js.xml_str2json( data );
				//console.log(json);
				$localStorage.json=json;
				$localStorage.jsonarray[$localStorage.activecontrollerid]=json;
				$rootScope.$broadcast('msg', 'update');
				//console.log(statusindex);
				if (statusindex==3) tabbar.loadPage('dimming.html');
				if (statusindex==5) tabbar.loadPage('rf.html');
				if (statusindex==7) tabbar.loadPage('dimmingoverride.html');
				if (statusindex==8) tabbar.loadPage('dimmingoverride.html');
			}
			if (cmd=='v')
				ons.notification.alert({message: 'Version: ' + data.replace('<V>','').replace('</V>',''), title: 'Reef Angel Controller'});
			if (cmd=='boot' || cmd=='mf' || cmd=='mw' || cmd=='bp' || cmd=='l1' || cmd=='l0' || cmd=='mt' || cmd=='mo' || cmd=='ml' || cmd=='cal0' || cmd=='cal1' || cmd=='cal2' || cmd=='cal3' || cmd=='cal4')
				ons.notification.alert({message: 'Command result: ' + data.replace('<MODE>','').replace('</MODE>',''), title: 'Reef Angel Controller'});
			if (cmd.substring(0,2)=='po')
			{
				if (data.search("Ok"))
				{
					var channel = cmd.substring(0,cmd.search(",")).replace("po","");
					var value = cmd.substring(cmd.search(",")+1,cmd.length)
					//if (value<=100) setjson(pwmchannels[channel],value);
					setjson(pwmchannels[channel] + 'O',value);
					$rootScope.$broadcast('msg', 'overrideok');
				}
			}
			if (cmd.substring(0,4)=='cvar')
			{
				if (data.search("Ok"))
				{
					var channel = cmd.substring(0,cmd.search(",")).replace("cvar","");
					var value = cmd.substring(cmd.search(",")+1,cmd.length)
					setjson('C'+channel,value);
					$rootScope.$broadcast('msg', 'cvarok');
				}
			}
			if (cmd.substring(0,5)=='mb255' || cmd.substring(0,5)=='mb256' || cmd.substring(0,5)=='mb257')
			{
				if (data.search("Ok"))
				{
					var channel;
					var value = cmd.substring(cmd.search(",")+1,cmd.length)
					if (cmd.substring(0,5)=='mb255') channel="M"
					if (cmd.substring(0,5)=='mb256') channel="S"
					if (cmd.substring(0,5)=='mb257') channel="D"
					setjson('RF'+channel,value);
					$rootScope.$broadcast('msg', 'rfok');
				}
			}
			if (cmd.substring(0,5)=='mb337' || cmd.substring(0,5)=='mb338' || cmd.substring(0,5)=='mb339')
			{
				if (data.search("Ok"))
				{
					var channel;
					var value = cmd.substring(cmd.search(",")+1,cmd.length)
					if (cmd.substring(0,5)=='mb337') channel="M"
					if (cmd.substring(0,5)=='mb338') channel="S"
					if (cmd.substring(0,5)=='mb339') channel="D"
					setjson('DC'+channel,value);
					$rootScope.$broadcast('msg', 'dcok');
				}
			}
			if (cmd.substring(0,2)=='mr')
			{
				memoryraw = data.replace('<MEM>','').replace('</MEM>','');
				memoryraw = memoryraw.split(" ").join("");
				$rootScope.$broadcast('msg', 'memoryrawok');
			}
			if (cmd == 'd')
			{
				var x2js = new X2JS();
				var jsonDateTime = x2js.xml_str2json(data.slice(0, data.lastIndexOf('>') + 1));
				var dateTime = new Date(jsonDateTime.D.YR, jsonDateTime.D.MON - 1, jsonDateTime.D.DAY, jsonDateTime.D.HR, jsonDateTime.D.MIN).toLocaleString();
				ons.notification.alert({message: 'Controller time: ' + dateTime, title: 'Reef Angel Controller'});
			}
    }



	getcontrollerdatacloud=function(cmd) {
		message=null;
		switch (cmd) {
			case "mf":
				if ((json.RA.SF & 1<<2)==1<<2)
					ons.notification.alert({message: 'Already in Water Change Mode', title: 'Reef Angel Controller' });
				else
					if ((json.RA.SF & 1<<1)==1<<1)
						ons.notification.alert({message: 'Already in Feeding Mode', title: 'Reef Angel Controller' });
					else
						message = new Paho.MQTT.Message("mf:1");
				break;
			case "mw":
				if ((json.RA.SF & 1<<1)==1<<1)
					ons.notification.alert({message: 'Already in Feeding Mode', title: 'Reef Angel Controller' });
				else
					if ((json.RA.SF & 1<<2)==1<<2)
						ons.notification.alert({message: 'Already in Water Change Mode', title: 'Reef Angel Controller' });
					else
						message = new Paho.MQTT.Message("mw:1");
				break;
			case "bp":
				if ((json.RA.SF & 1<<1)==0 && (json.RA.SF & 1<<2)==0)
					ons.notification.alert({message: 'Not in Feeding Mode nor Water Change Mode', title: 'Reef Angel Controller' });
				if ((json.RA.SF & 1<<1)==1<<1)
					message = new Paho.MQTT.Message("mf:0");
				if ((json.RA.SF & 1<<2)==1<<2)
					message = new Paho.MQTT.Message("mw:0");
				break;
			case "l0":
				if ((json.RA.SF & 1<<0)==0)
					ons.notification.alert({message: 'Lights on already cancelled', title: 'Reef Angel Controller' });
				else
					message = new Paho.MQTT.Message("l:0");
				break;
			case "l1":
				if ((json.RA.SF & 1<<0)==1<<0)
					ons.notification.alert({message: 'Already in Lights On', title: 'Reef Angel Controller' });
				else
					message = new Paho.MQTT.Message("l:1");
				break;
			case "mt":
				if ((json.RA.AF & 1<<0)==0)
					ons.notification.alert({message: 'No ATO Timeout flag', title: 'Reef Angel Controller' });
				else
					message = new Paho.MQTT.Message("mt:0");
				break;
			case "mo":
				if ((json.RA.AF & 1<<1)==0)
					ons.notification.alert({message: 'No Overheat flag', title: 'Reef Angel Controller' });
				else
					message = new Paho.MQTT.Message("mo:0");
				break;
			case "ml":
				if ((json.RA.AF & 1<<3)==0)
					ons.notification.alert({message: 'No Leak flag', title: 'Reef Angel Controller' });
				else
					message = new Paho.MQTT.Message("ml:0");
				break;
			case "boot":
				message = new Paho.MQTT.Message("boot:0");
				break;
			case "v":
				message = new Paho.MQTT.Message("v:0");
				break;
			case "d":
				message = new Paho.MQTT.Message("date:0");
				break;
             
		}
		if (cmd != 'd' && cmd.substring(0,1)=='d')
			message = new Paho.MQTT.Message("date:1:"+cmd.substring(1,13).split(",").join(""));
		if (cmd.substring(0,4)=='cvar')
		{
			message = new Paho.MQTT.Message(cmd.replace("cvar","cvar:").replace(",",":"));
			updatestring="C"+cmd.substring(4,5)+":";
		}
		if (cmd.substring(0,2)=='po')
		{
			message = new Paho.MQTT.Message(cmd.replace("po","po:").replace(",",":"));
			updatestring=pwmchannels[cmd.substring(2,cmd.indexOf(","))] + "O:";
		}
		if (cmd.substring(0,2)=='mb')
		{
			message = new Paho.MQTT.Message(cmd.replace("mb","mb:").replace(",",":"));
			if (cmd.substring(2,5)=='255')
				updatestring="RFM:";
			if (cmd.substring(2,5)=='256')
				updatestring="RFS:";
			if (cmd.substring(2,5)=='257')
				updatestring="RFD:";
			if (cmd.substring(2,5)=='337')
				updatestring="DCM:";
			if (cmd.substring(2,5)=='338')
				updatestring="DCS:";
			if (cmd.substring(2,5)=='339')
				updatestring="DCD:";
		}
		if (cmd.substring(0,1)=='r' && cmd != "r99")
		{
			message = new Paho.MQTT.Message(cmd.replace("r","r:"));
			if(cmd.substring(cmd.length-1,cmd.length)=='0')
				updatestring="ROFF";
			if(cmd.substring(cmd.length-1,cmd.length)=='1')
				updatestring="RON";
			if(cmd.substring(cmd.length-1,cmd.length)=='2')
			{
				if (cmd.length==4)
					updatestring="RON" + cmd.substring(1,2) + ":ROFF";
				else
					updatestring="RON:ROFF";
			}
			if (cmd.length==4)
				updatestring+=cmd.substring(1,2)+":";
			else
				updatestring+=":";
		}
		if (cmd.substring(0,2)=='mr')
		{
			message = new Paho.MQTT.Message("mr:0");
			updatestring="MR21:";
		}
		if (message!=null)
		{
			modal.show();
			currenttimeout=$timeout;
			ourtimer=$timeout(function() {
				updatestring = "";
				modal.hide();
				ons.notification.alert({message: 'Timeout. Please try again.', title: 'Reef Angel Controller'});
			}, 8000);
			message.destinationName = cloudusername + "/in";
			mqtt.send(message);
		}
	}

	$scope.refresh=function(){
		// console.log("refresh()");
		$scope.getcontrollerdata("r99");
		UpdateParams($scope, $timeout, $localStorage);
	}

$scope.getportallabels = function() {
    var activeControllerId = $localStorage.activecontrollerid;

    // Check if we have controllers and an active controller ID
    if ($localStorage.controllers && activeControllerId != null && $localStorage.controllers.length > activeControllerId) {
        var controller = $localStorage.controllers[activeControllerId];
        // Check for 'cloudusername' first; if it doesn't exist, use 'username'
        var username = controller.cloudusername || controller.username;
    } else {
        ons.notification.alert({message: 'Please login for this feature!', title: 'Reef Angel Controller'});
        return; // Exit if no username is found or active controller ID is not set
    }
    
    var url = "https://forum.reefangel.com/labels/" + username; // Adjusted URL
    $http.get(url, {timeout: 3000})
        .then(function(response) {
            // Success handler
            attempts = 0;
            modal.hide();
            var x2js = new X2JS();
            var jsonlabels = x2js.xml_str2json(response.data); // Note the change to response.data
            $localStorage.jsonlabels = jsonlabels;
            if (typeof $localStorage.jsonlabelsarray === 'undefined') {
                $localStorage.jsonlabelsarray = {};
            }
            $localStorage.jsonlabelsarray[activeControllerId] = jsonlabels; 
            $rootScope.$broadcast('msg', 'labels');
        })
        .catch(function() {
            // Error handler
            modal.hide();
            if (attempts < 1) {
                attempts++;
                $scope.getportallabels(); // Retry fetching labels
            } else {
                attempts = 0;
                ons.notification.alert({message: 'Unable to process controller data!', title: 'Reef Angel Controller'});
            }
        });
};


$scope.changerelay = function(id, mode) {
  //  console.log("Received command with ID:", id, "and Mode:", mode);

    var relayId, portId;

    if (id < 10) {
        // It's a single digit, which means it's a port on the main relay
        relayId = '';  // Assuming main relay has no number in your setup, just 'R'
        portId = id;   // The single digit itself is the portId
    } else {
        // Two digits or more, interpret the first digit(s) as relay and the last as port
        relayId = Math.floor(id / 10);  // Extract relay ID from the number
        portId = id % 10;              // Extract port ID from the number
    }

   //console.log(`Parsed relayId: 'R'${relayId}, portId: ${portId}, mode: ${mode}`);

    // Constructing base keys for 'On' and 'Off' states
    var baseKeyOn = 'RON' + (relayId ? relayId : '');
    var baseKeyOff = 'ROFF' + (relayId ? relayId : '');

    // Calculate bitmask for the specific port
    var mask = (portId > 0 ? (1 << (portId - 1)) : 0xFFFF); // Adjusting mask for specific port

    // Fetch and log the current state from JSON for both 'On' and 'Off'
    var currentValueOn = parseInt(json.RA[baseKeyOn] || "0", 10);
    var currentValueOff = parseInt(json.RA[baseKeyOff] || "0", 10);



    // Determine the action based on the mode
    if (mode === 0) { // Off mode
        if ((currentValueOff & mask) === 0) {
           // console.log("The port is already Off.");
            ons.notification.alert({
                message: `Port ${portId} is already in Off.`,
                title: 'Reef Angel Alert'
            });
        } else {
            //console.log("Port is not in Off mode, changing state...");
            $scope.getcontrollerdata('r' + id + mode);
        }
    } else if (mode === 1) { // On mode
        if ((currentValueOn & mask) !== 0) {
           // console.log("The relay is already in 'On' mode.");
            ons.notification.alert({
                message: `Port ${portId} is already On mode.`,
                title: 'Reef Angel Alert'
            });
        } else {
           // console.log("Port is not in 'On' mode, changing state...");
            $scope.getcontrollerdata('r' + id + mode);
        }
    } else if (mode === 2) { // Auto mode
        if ((currentValueOn & mask) === 0 && (currentValueOff & mask) !== 0) {
           // console.log("The relay is already in 'Auto' mode.");
            ons.notification.alert({
                message: `Port ${portId} is already in Auto mode.`,
                title: 'Reef Angel Alert'
            });
        } else {
            //console.log("Port is not in 'Auto' mode, changing state...");
            $scope.getcontrollerdata('r' + id + mode);
        }
    } else {
       
    }
};

    //activiating modes for app shortcuts
function activateModeFromHash() {
    var hash = $window.location.hash;
    if (hash) {
        hash = hash.substring(1); // Remove the "#" from the hash fragment
        switch (hash) {
            case 'feeding':
                $scope.getcontrollerdata('mf');
                break;
            case 'water-change':
                $scope.getcontrollerdata('mw');
                break;
            case 'exit':
                $scope.getcontrollerdata('bp');
                break;
            case 'lights-on':
                $scope.getcontrollerdata('l1');
                break;
            case 'lights-cancel':
                $scope.getcontrollerdata('l0');
                break;
            // Add more cases for other modes as needed
            default:
                // Handle default case or unsupported modes
                break;
        }
        history.pushState("", document.title, window.location.pathname + window.location.search); // Clear the hash
    }
}

$timeout(function() { activateModeFromHash(); }, 3000);

$rootScope.$on('$locationChangeSuccess', function () {
    activateModeFromHash();
});
    
    $scope.showConfirmDialog=function()
    {
    ons.createDialog('confirm.html', { parentScope: $scope }).then(function(dialog) {
    $scope.dialog = dialog;
    dialog.show();
        });
    }
    $scope.reboot=function(){
        $scope.getcontrollerdata('boot');
        $scope.dialog.hide();
    }
    $scope.rebootCancel=function(){
        $scope.dialog.hide();
    }
    
});

app.controller('Parameters', function($rootScope, $scope, $timeout, $localStorage) {
    

    
    
	$scope.$storage = $localStorage;
	parametersscope=$scope;
	currentstorage=$localStorage;
    // Ensure userVariables is initialized in $localStorage
    if (!$localStorage.userVariables) {
        $localStorage.userVariables = {
            uv1: '0',
            uv2: '0',
            uv3: '0',
            uv4: '0',
            uv5: '0',
            uv6: '0',
            uv7: '0',
            uv8: '0'
        };
    }

    // Correctly assign userVariables from $localStorage to $scope
    $scope.userVariables = $localStorage.userVariables;

    // Function to set null values to '0' in userVariables
    angular.forEach($scope.userVariables, function(value, key) {
        if (value === null) {
            $scope.userVariables[key] = '0';
        }
    });

    $scope.dashboardVisibility = $localStorage.dashboardVisibility;

	$scope.$on('msg', function(event, msg) {
		//console.log('Parameters'+msg);
		if (msg=="update")
		{
			json.RA.lastrefresh=new Date().toLocaleString();
			UpdateParams($scope,$timeout,$localStorage);
			//$scope.loadparameterstab();
		}
		if (msg=="paramsok")
		{
			UpdateParams($scope,$timeout,$localStorage);

		}
		if (msg=="overrideok")
		{
			UpdateParams($scope,$timeout,$localStorage);
			$scope.backoverride();
		}
		if (msg=="cvarok")
		{
			UpdateParams($scope,$timeout,$localStorage);
			$scope.backcvarupdate();
		}
		if (msg=="rfok")
		{
			UpdateParams($scope,$timeout,$localStorage);
			$scope.backrfupdate();
		}
		if (msg=="dcok")
		{
			UpdateParams($scope,$timeout,$localStorage);
			$scope.backdcupdate();
		}
		if (msg=="labels")
		{
			loadlabels($scope);
		}
	});

	$scope.loadparameterstab=function(){
		tabbar.loadPage('parameters.html');
		statusindex=0;
	}

	$scope.loadflagstab=function(){
		tabbar.loadPage('flags.html');
		statusindex=1;
	}

	$scope.loadiotab=function(){
		tabbar.loadPage('io.html');
		statusindex=2;
	}

	$scope.loaddimmingtab=function(){
		tabbar.loadPage('dimming.html');
		statusindex=3;
	}

	$scope.loadcustomvartab=function(){
		tabbar.loadPage('customvar.html');
		statusindex=4;
	}

	$scope.loadrftab=function(){
		tabbar.loadPage('rf.html');
		statusindex=5;
	}

	$scope.loaddcpumptab=function(){
		tabbar.loadPage('dcpump.html');
		statusindex=6;
	}
    
    
    
    $scope.loadUserVarTab= function() {
    // Logic to load the user variables tab
    tabbar.loadPage('userVariables.html'); // Adjust the page name as needed
 
	
    // Any additional logic for setting up the user variables tab
};

	$scope.dimmingoverride=function(channel){
		tabbar.loadPage('dimmingoverride.html');
		channeloverride=channel;
		if (channel<8 || channel==17 || channel==18)
			statusindex=7;
		else if (channel>10 && channel<17)
			statusindex=8;
	}

	$scope.overridechange=function(){
		$scope.pwmoverride=$scope.dimmingoverridechange;
	}

	$scope.backoverride=function(){
		if (statusindex==3 || statusindex==7) tabbar.loadPage('dimming.html');
		if (statusindex==5 || statusindex==8) tabbar.loadPage('rf.html');
		if (statusindex==6) tabbar.loadPage('dcpump.html');
	}

$scope.setoverride = function() {
    var channelMap = {
        0: 'PWMD',
        1: 'PWMA',
        17: 'PWMD2',
        18: 'PWMA2',
        2: 'PWME0',
        3: 'PWME1',
        4: 'PWME2',
        5: 'PWME3',
        6: 'PWME4',
        7: 'PWME5',
        11: 'RFW',
        12: 'RFRB',
        13: 'RFR',
        14: 'RFG',
        15: 'RFB',
        16: 'RFI'
    };

    var channelKey = channelMap[channeloverride]; // Get the corresponding channel key
    var storageData = JSON.parse(localStorage.getItem('ngStorage-json')); // Retrieve and parse the stored JSON object
    var currentOverrideValue = storageData.RA[channelKey + 'O']; // Access the current override value

    //console.log(channelKey + 'O', currentOverrideValue, $scope.dimmingoverridechange); // Debugging to check values being compared

    // Convert both values to integers to ensure correct comparison
    if (parseInt(currentOverrideValue) !== parseInt($scope.dimmingoverridechange)) {
        // Only send the override command if the current value is different from the new value
        $scope.getcontrollerdata('po' + channeloverride + ',' + $scope.dimmingoverridechange);

        if (channeloverride < 8 || channeloverride == 17 || channeloverride == 18) {
            statusindex = 3;
        } else if (channeloverride > 10 && channeloverride < 17) {
            statusindex = 5;
        }
    } else {
        // Optionally, log or alert that the new value is the same as the current value
          ons.notification.alert({
        message: `Override value is already set at ${currentOverrideValue}!`, // Use template literal for variable interpolation
        title: 'Reef Angel Controller'
    });
    }
};

$scope.canceloverride = function() {
    var channelMap = {
        0: 'PWMD',
        1: 'PWMA',
        17: 'PWMD2',
        18: 'PWMA2',
        2: 'PWME0',
        3: 'PWME1',
        4: 'PWME2',
        5: 'PWME3',
        6: 'PWME4',
        7: 'PWME5',
        11: 'RFW',
        12: 'RFRB',
        13: 'RFR',
        14: 'RFG',
        15: 'RFB',
        16: 'RFI'
    };

    var channelKey = channelMap[channeloverride]; // Get the corresponding channel key
    var storageData = JSON.parse(localStorage.getItem('ngStorage-json')); // Retrieve and parse the stored JSON object
    var overrideValue = storageData.RA[channelKey + 'O']; // Access the override value using the constructed key

    // Check if the override value is not 255
    if (parseInt(overrideValue) !== 255) {
        // Only send the cancellation command if the current override is not 255
        $scope.getcontrollerdata('po' + channeloverride + ',255');

        if (channeloverride < 8 || channeloverride == 17 || channeloverride == 18) {
            statusindex = 3;
        } else if (channeloverride > 10 && channeloverride < 17) {
            statusindex = 5;
        }
    } else {
        // Optionally, log or alert that there is no override to cancel
        ons.notification.alert({message: 'No active override to cancel!', title: 'Reef Angel Controller'});
        
    }
};
	$scope.cvarupdate=function(channel){
		tabbar.loadPage('cvarupdate.html');
		cvarupdateindex=channel;
	}

	$scope.setcvarupdate=function(){
		$scope.getcontrollerdata('cvar'+cvarupdateindex+','+$scope.cvarupdatechange);
	}

	$scope.backcvarupdate=function(){
		tabbar.loadPage('customvar.html');
	}

	$scope.rfmodeupdate=function(channel){
		tabbar.loadPage('rfmodeupdate.html');
	}

	$scope.setrfmodeupdate=function(mode){
		$scope.getcontrollerdata('mb255,'+mode);
	}

	$scope.backrfupdate=function(){
		tabbar.loadPage('rf.html');
	}

	$scope.dcmodeupdate=function(){
		tabbar.loadPage('dcmodeupdate.html');
	}

	$scope.setdcmodeupdate=function(mode){
		$scope.getcontrollerdata('mb337,'+mode);
	}

	$scope.backdcupdate=function(){
		tabbar.loadPage('dcpump.html');
	}

	$scope.rfspeedupdate=function(channel){
		$scope.speedupdatechange=$scope.rfs;
		statusindex=8;
		tabbar.loadPage('speedupdate.html');
	}

	$scope.rfdurationupdate=function(channel){
		$scope.durationupdatechange=$scope.rfd;
		statusindex=8;
		tabbar.loadPage('durationupdate.html');
	}

	$scope.setspeedupdate=function(){
		if (statusindex==6)	$scope.getcontrollerdata('mb338,'+$scope.speedupdatechange);
		if (statusindex==8)	$scope.getcontrollerdata('mb256,'+$scope.speedupdatechange);
	}

	$scope.dcspeedupdate=function(channel){
		$scope.speedupdatechange=$scope.dcs;
		statusindex=6;
		tabbar.loadPage('speedupdate.html');
	}

	$scope.dcdurationupdate=function(channel){
		$scope.durationupdatechange=$scope.dcd;
		statusindex=6;
		tabbar.loadPage('durationupdate.html');
	}

	$scope.setdurationupdate=function(){
		if (statusindex==6)	$scope.getcontrollerdata('mb339,'+$scope.durationupdatechange);
		if (statusindex==8)	$scope.getcontrollerdata('mb257,'+$scope.durationupdatechange);
	}

	$scope.invokegraph=function(id){
		names = [];
		names.push(id);
		tabbar.loadPage("singlegraph.html");
		CreateChart($scope,"paramscontainer");
	}

	if (statusindex==7) $scope.dimmingtab=true;
	if (statusindex==8) $scope.rftab=true;
	if (statusindex==6) $scope.dctab=true;
	$scope.dimmingtab=true;
	$scope.dimmingoverridelabel="Dimming Channel";
	$scope.cvarenabled=false;
	$scope.rfimage="spacer.png";
	$scope.dimmingoverrideslider = "{'range': true, 'actinicslider': true}";
	$scope.pwmoverride = "0";
	if ($localStorage.json != null && $localStorage.controllers.length>0) json=$localStorage.json
	if ($localStorage.jsonlabels != null && $localStorage.controllers.length>0) jsonlabels=$localStorage.jsonlabels
	if (json==null) json=new Object();
	if (json.RA==null) json.RA=new Object();
//	console.log(json);
	UpdateParams($scope,$timeout,$localStorage);
          
    if (!$localStorage.dashboardVisibility) {
            $localStorage.dashboardVisibility = {
                // Parameters 
                t1: true,
                t2: true,
                t3: true,
                t4: true,
                t5: true,
                t6: true,
                ph: true,
                sal: true,
                orp: true,
                phe: true,
                wl: true,
                wl1: true,
                wl2: true,
                wl3: true,
                wl4: true,
                hum: true,
                par: true,
                co2: true,
                ozo: true,
                co2hum: true,
                // IO
                atohigh: true,
                atolow: true,
                alarm: true,
                leak: true,
                io0: true,
                io1: true,
                io2: true,
                io3: true,
                io4: true,
                io5: true,
                io6: true,
                io7: true,
                // Dimming
                pwmd1: true,
                pwma1: true,
                pwmd2: true,
                pwma2: true,
                pwme0: true,
                pwme1: true,
                pwme2: true,
                pwme3: true,
                pwme4: true,
                pwme5: true,
                // User variables
                uv1: false,
                uv2: false,
                uv3: false,
                uv4: false,
                uv5: false,
                uv6: false,
                uv7: false,
                uv8: false
            };
        }

    
});
app.controller('Relay', function($rootScope, $scope, $timeout, $localStorage) {
	$scope.$storage = $localStorage;
	relayscope=$scope;
	statusindex=0;
	$scope.$on('msg', function(event, msg) {
		//console.log('Relay'+msg);
		if (msg=="update")
		{
			json.RA.lastrefresh=new Date().toLocaleString();
			UpdateParams($scope,$timeout,$localStorage);
		}
		if (msg=="paramsok")
		{
			UpdateParams($scope,$timeout,$localStorage);
		}
	});
$scope.invokegraph = function(n) {
    var relayId = 'r'; // Default to main relay box

    if (n !== undefined && n !== '') {
        relayId += n; // Append n only if it's provided and not an empty string
    }
    
   // console.log("invokegraph called with id:", relayId);
    names = [];
    names.push(relayId);

    tabbar.loadPage("singlegraph.html");
    
    // Use $timeout to delay the execution of CreateChart
    $timeout(function() {
        createRelayChart($scope, "paramscontainer", relayId);
    }, 500); // Adjust the delay time as needed
};

	$scope.loadmaintab=function(){
	//	console.log("main relay box");
	}

	$scope.loadexp1tab=function(){
		$localStorage.exp1tab=true;
//		console.log("exp1 relay box");
	}

	UpdateParams($scope,$timeout,$localStorage);
});

app.controller('Settings', function($rootScope, $scope, $timeout, $localStorage, $http)  {
	$scope.$storage = $localStorage;
	$scope.controllers=$localStorage.controllers;
	settingsscope=$scope;
	statusindex=0;


	$scope.$on('msg', function(event, msg) {
//		console.log('Settings'+msg);
		if (msg=="update")
		{
			json.RA.lastrefresh=new Date().toLocaleString();
		}
	});
    $scope.isAuthenticated = $localStorage.isAuthenticated || false;
	  // Initialize controller for editing
   if (editcontrollerid != null) {
    var controller = $localStorage.controllers[editcontrollerid];
    $scope.controllername = controller.name;
    $scope.useCloudLogin = !!(controller.cloudusername && controller.cloudpassword);

   
        // Use appropriate credentials based on the type of login
        if ($scope.useCloudLogin) {
            
            $scope.cloudusername = controller.cloudusername;
            $scope.cloudpassword = controller.cloudpassword;
        } else {
    
            $scope.cloudusername = controller.username;
            $scope.cloudpassword = controller.password;
        }
    }


$scope.saveaddcontroller = function() {
    modal.show();
    authenticateUser($scope.cloudusername, $scope.cloudpassword).then(function(result) {
        modal.hide();
        if (result.success) {
            $scope.isAuthenticated = true;
            $localStorage.isAuthenticated = true;
            
            if(result.response.vapidPublicKey) {
                $localStorage.vapidPublicKey = result.response.vapidPublicKey;
            }

            // Capture the token from the response
             var token = result.response.token;

            // Initialize controllerData with token
            var controllerData;
            if ($scope.useCloudLogin) {
                controllerData = createControllerData("", token);  // Pass an empty string for IP as it's not needed
            } else {
                var ipAddress = result.response.ipAddress;
                if (ipAddress && ipAddress !== 'null' && ipAddress !== '') {
                    controllerData = createControllerData(ipAddress, token);
                } else {
                    $scope.cloudenabled = false;
                    $scope.showIpInputDialog();
                    return;  // Exit the function early if there's no IP address
                }
            }
            saveControllerDetails(controllerData);
        } else {
       //     console.log('Authentication Failed:', result.response);
            $scope.message = result.response;
            ons.notification.alert({message: $scope.message, title: 'Login Failed'});
            $scope.isAuthenticated = false;
            $localStorage.isAuthenticated = false;
        }
    }).catch(function(error) {
        console.error('Error during authentication:', error);
        modal.hide();
        ons.notification.alert({message: 'An error occurred. Please try again.', title: 'Reef Angel Controller'});
    });
};

function createControllerData(ipAddress, token) {
    var data = {
        name: $scope.controllername,
        port: $scope.controllerport,  
        token: token  // Store the token in the controller data
    };

    if ($scope.useCloudLogin) {
        data.cloudusername = $scope.cloudusername;
        data.cloudpassword = $scope.cloudpassword;
    } else {
        data.username = $scope.cloudusername;  // Or some other username if different
        data.password = $scope.cloudpassword;  // Or some other password if different
        data.ipaddress = ipAddress;
        data.port = data.port || 2000;
    }

    return data;
}
$scope.refreshController = function(index) {
    var controller = $localStorage.controllers[index];
    modal.show();

    // Check if the controller uses cloud login
    if (controller.cloudusername && controller.cloudpassword) {
        // Controller uses cloud login, no need to update IP
        modal.hide();
        ons.notification.alert({message: 'Controller synced successfully!', title: 'Reef Angel Controller'});
    } else {
        // Controller uses local login, proceed with IP update
        authenticateUser(controller.username, controller.password, function(success, response) {
            if (success) {
                var responseParts = response.data.split(' ');
                var ipAddress = responseParts[responseParts.length - 1];
                if (ipAddress && ipAddress !== 'null' && ipAddress !== '') {
                    controller.ipaddress = ipAddress;
                    $localStorage.controllers[index] = controller;
                    ons.notification.alert({message: 'Controller IP updated successfully!', title: 'Reef Angel Controller'});
                } else {
                    ons.notification.alert({message: 'Unable to retrieve IP address', title: 'Update Failed'});
                }
            } else {
                ons.notification.alert({message: 'Authentication Failed!', title: 'Reef Angel Controller'});
            }
            modal.hide();
        });
    }
};


function saveControllerDetails(details) {
        if (editcontrollerid == null) {
            $localStorage.controllers.push(details);
        } else {
            angular.extend($localStorage.controllers[editcontrollerid], details);
        }
        updateLocalStorageAndReload();
        $scope.isCloudConnection = !!details.cloudusername && !!details.cloudpassword;
    }

function updateLocalStorageAndReload() {
        // Some additional operations related to local storage
        $localStorage.jsonarray.push(null);
        $localStorage.jsonlabelsarray.push(null);
        $localStorage.activecontroller = $scope.controllername;
        $localStorage.activecontrollerid = $localStorage.controllers.length - 1;
        MQTTdisconnect();
        $rootScope.$broadcast('msg', 'paramsok');
        $rootScope.$broadcast('msg', 'popoverclose');
        $scope.loadcontrollertab();
        $scope.getportallabels(); 
        
    }

function authenticateUser(username, password) {
    return $http.post('https://forum.reefangel.com/login', { username, password })
        .then(function(response) {
            // Extract and return the response data specifically
            // Assume response.data contains the server's response
            return { success: true, response: response.data };
        })
        .catch(function(error) {
            // In case of error, you might want to return the error response as well, if available
            let errorResponse = error.data ? error.data : null;
            return { success: false, response: errorResponse };
        });
}

$scope.showIpInputDialog = function() {
    ons.createDialog('ipInput.html', { parentScope: $scope }).then(function(dialog) {
        $scope.dialog = dialog;
        dialog.show();
    });
};
    
$rootScope.enteredIpAddress

$scope.saveEnteredIpAddress = function() {

    if ($rootScope.enteredIpAddress) {
        var controllerData = createControllerData($scope.enteredIpAddress);
        saveControllerDetails(controllerData);
        //console.log($rootScope.enteredIpAddress);
        $scope.dialog.hide();
    } else {
       
        ons.notification.alert({ message: 'Please enter a valid IP address', title: 'Invalid Input' });
    }
};

$scope.closeIpInputDialog = function() {
    $scope.dialog.hide();
};

 
	$scope.loadcontrollertab=function(){
		editcontrollerid=null;
		tabbar.loadPage('settings.html');
	}

	$scope.loadinternalmemorytab=function(){
		tabbar.loadPage('internalmemory.html');
		$scope.getcontrollerdata('mr');
	}

	$scope.addcontroller=function(){
		tabbar.loadPage('addcontroller.html');
	}
    // Load the labels page
    $scope.loadlabelstab=function() {
    tabbar.loadPage('labels.html');
    }
    // Load the labels page
    $scope.loademailstab=function() {
    tabbar.loadPage('emailalerts.html');
    }


	$scope.editcontroller=function(id){
		editcontrollerid=id;
		tabbar.loadPage('addcontroller.html');
	}

	$scope.deletecontroller=function(id){
		ons.notification.confirm({
		  message: 'Are you sure you want to delete ' + $localStorage.controllers[id].name + " controller?",
		  callback: function(idx) {
			switch (idx) {
			  case 1:
                
			    MQTTdisconnect();
				delete $localStorage.controllers[id];
				$localStorage.controllers = $localStorage.controllers.filter(function(n){ return n != null });
				delete $localStorage.jsonarray[id];
                $scope.reefangelconnected = false;
                 // Set isAuthenticated to false
                $scope.isAuthenticated = false;
                delete $localStorage.isAuthenticated; // If using localStorage to track auth status    
                    
				$localStorage.jsonarray = $localStorage.jsonarray.filter(function(n){ return n != null });
				if ($localStorage.jsonarray==null) $localStorage.jsonarray=[];
				delete $localStorage.jsonlabelsarray[id];
                delete $localStorage.userVariables;
                
				$localStorage.jsonlabelsarray = $localStorage.jsonlabelsarray.filter(function(n){ return n != null });
				if ($localStorage.jsonlabelsarray==null) $localStorage.jsonlabelsarray=[];
				if ($localStorage.controllers.length==0)
				{
					json=null;
					$localStorage.json=null;
					jsonlabels=null;
					$localStorage.jsonlabels=null;
					$scope.activecontroller=null;
					$localStorage.activecontroller=null;
					$localStorage.activecontrollerid=null;
					editcontrollerid=null;
					$rootScope.$broadcast('msg', 'paramsok');
				}
				if ($localStorage.activecontrollerid==id)
				{
					changeactivecontroller($scope, $localStorage, $rootScope, 0);
				}
				$rootScope.$broadcast('msg', 'popoverclose');
				tabbar.loadPage('settings.html');
				break;
			}
		  }
		});
	}
});

app.controller('PopoverController', function($rootScope, $scope, $http, $localStorage){
	$scope.$storage = $localStorage;
	$scope.controllers=$localStorage.controllers;
	if ($localStorage.controllers == null) $localStorage.controllers=[];
	$scope.$on('msg', function(event, msg) {
	//	console.log('PopoverController'+msg);
		if (msg=="popoverclose")
		{
			$scope.controllers=$localStorage.controllers;
		}
	});
	$scope.controllerselected=function(id){
		changeactivecontroller($scope, $localStorage, $rootScope, id);
	}
});

app.controller('Graph', function($rootScope, $scope, $http, $timeout, $localStorage){

	$scope.$storage = $localStorage;
	$scope.showgraphlist=true;
	UpdateParams($scope,$timeout,$localStorage);
	$scope.$on('msg', function(event, msg) {
	//	console.log('Graph'+msg);
		if (msg=="update")
		{
			json.RA.lastrefresh=new Date().toLocaleString();
		}
		if (msg=="paramsok")
		{
			UpdateParams($scope,$timeout,$localStorage);
		}
	});

	$scope.buildgraph=function(){
		names = [];
		if ($scope.grapht1==true) names.push("T1");
		if ($scope.grapht2==true) names.push("T2");
		if ($scope.grapht3==true) names.push("T3");
		if ($scope.grapht4==true) names.push("T4");
		if ($scope.grapht5==true) names.push("T5");
		if ($scope.grapht6==true) names.push("T6");
		if ($scope.graphph==true) names.push("PH");
		if ($scope.graphsal==true) names.push("SAL");
		if ($scope.graphorp==true) names.push("ORP");
		if ($scope.graphphe==true) names.push("PHE");
		if ($scope.graphwl==true) names.push("WL");
		if ($scope.graphwl1==true) names.push("WL1");
		if ($scope.graphwl2==true) names.push("WL2");
		if ($scope.graphwl3==true) names.push("WL3");
		if ($scope.graphwl4==true) names.push("WL4");
		if ($scope.graphpar==true) names.push("PAR");
		if ($scope.graphhum==true) names.push("HUM");
        if ($scope.graphozo==true) names.push("OZO");
        if ($scope.graphco2==true) names.push("CO2");
        if ($scope.graphco2hum==true) names.push("CO2HUM");
		if ($scope.graphcustom==true)
		{
			var items = $scope.graphcustomitems.split(",");
			console.log(items.length);
			for (a=0; a<items.length; a++)
			{
				names.push(items[a].toUpperCase());
			}
		}
		CreateChart($scope,"container");
	}
});

app.controller('InternalMemory', function($rootScope, $scope, $http, $timeout, $localStorage){
	var attempts=0;
	$scope.$storage = $localStorage;
	internalmemoryrootscope=$rootScope;
	internalmemoryscope=$scope;
	currenttimeout=$timeout;
	$scope.showim=true;
	CheckExpansion($scope);
	memoryraw="";
	$scope.$on('msg', function(event, msg) {
		//console.log('Parameters'+msg);
		if (msg=="memoryrawok")
		{
			memoryraw = memoryraw.split(" ").join("");
			$scope.daylighton=new Date("01/01/01 " + getbytevalue(memoryraw,4).pad() + ":" + getbytevalue(memoryraw,5).pad());
			$scope.daylightoff=new Date("01/01/01 " + getbytevalue(memoryraw,6).pad() + ":" + getbytevalue(memoryraw,7).pad());
			$scope.daylightdelayed=getbytevalue(memoryraw,35);
			console.log(memoryraw);
			$scope.actinicoffset=getbytevalue(memoryraw,84);
			$scope.heateron=parseFloat(getintvalue(memoryraw,22)/10);
			$scope.heateroff=parseFloat(getintvalue(memoryraw,24)/10);
			$scope.chilleron=parseFloat(getintvalue(memoryraw,26)/10);
			$scope.chilleroff=parseFloat(getintvalue(memoryraw,28)/10);
			$scope.overheat=parseFloat(getintvalue(memoryraw,18)/10);
			$scope.atotimeout=getintvalue(memoryraw,76);
			$scope.waterlevellow=getbytevalue(memoryraw,131);
			$scope.waterlevelhigh=getbytevalue(memoryraw,132);
			$scope.wmtimer=getintvalue(memoryraw,8);
			$scope.co2controlon=parseFloat(getintvalue(memoryraw,85)/100);
			$scope.co2controloff=parseFloat(getintvalue(memoryraw,87)/100);
			$scope.phcontrolon=parseFloat(getintvalue(memoryraw,89)/100);
			$scope.phcontroloff=parseFloat(getintvalue(memoryraw,91)/100);
			$scope.dp1interval=getintvalue(memoryraw,43);
			$scope.dp1timer=getbytevalue(memoryraw,12);
			$scope.dp2interval=getintvalue(memoryraw,45);
			$scope.dp2timer=getbytevalue(memoryraw,13);
			$scope.dp3interval=getintvalue(memoryraw,134);
			$scope.dp3timer=getbytevalue(memoryraw,133);
			$scope.delayedon=getbytevalue(memoryraw,120);
			$scope.pwmslopestartd=getbytevalue(memoryraw,49);
			$scope.pwmslopeendd=getbytevalue(memoryraw,50);
			$scope.pwmslopedurationd=getbytevalue(memoryraw,51);
			$scope.pwmslopestarta=getbytevalue(memoryraw,52);
			$scope.pwmslopeenda=getbytevalue(memoryraw,53);
			$scope.pwmslopedurationa=getbytevalue(memoryraw,54);
			$scope.feedingtimer=getintvalue(memoryraw,14);
			var pwmMemory=58;
			$scope.pwmslopestart=[];
			$scope.pwmslopeend=[];
			$scope.pwmslopeduration=[];
			for (var a=0;a<6;a++)
			{
				$scope.pwmslopestart[a]=getbytevalue(memoryraw,pwmMemory++);
				$scope.pwmslopeend[a]=getbytevalue(memoryraw,pwmMemory++);
				$scope.pwmslopeduration[a]=getbytevalue(memoryraw,pwmMemory++);
			}
			var radionMemory=102;
			$scope.radionslopestart=[];
			$scope.radionslopeend=[];
			$scope.radionslopeduration=[];
			for (const channel of ['White','Royal Blue','Red','Green','Blue','Intensity'])
			{
				$scope.radionslopestart[channel]=getbytevalue(memoryraw,radionMemory++);
				$scope.radionslopeend[channel]=getbytevalue(memoryraw,radionMemory++);
				$scope.radionslopeduration[channel]=getbytevalue(memoryraw,radionMemory++);
			}
		}
	});

    $scope.loadlabelstab=function() {
    // Load the labels page
    tabbar.loadPage('labels.html');
}
    
    $scope.loademailstab=function() {
    // Load the email alerts page
    tabbar.loadPage('emailalerts.html');
}
	$scope.loadinternalmemorytab=function(){
		$scope.showim=true;
		$scope.getcontrollerdata('mr');
		$scope.memoryresult="";
		memoryraw="";
	}

	$scope.loadcontrollertab=function(){
		editcontrollerid=null;
		tabbar.loadPage('settings.html');
	}

	$scope.toggleGroup = function(group){
		if ($scope.isGroupShown(group))
			$scope.shownGroup = null;
		else
			$scope.shownGroup = group;
	};

	$scope.isGroupShown = function(group) {
		return $scope.shownGroup === group;
	};

	$scope.memback = function(group) {
		$scope.getcontrollerdata('mr');
	};

	$scope.memsave = function(group) {
		MemString=[];
		MemURL=[];
		memindex=0;
		$scope.memoryresult="";
		if ($scope.daylightdelayed!=getbytevalue(memoryraw,35))
			SaveMemory("Daylights Delayed Start", "mb235," + $scope.daylightdelayed);
		if ($scope.actinicoffset!=getbytevalue(memoryraw,84))
			SaveMemory("Actinic Offset", "mb284," + $scope.actinicoffset);
		if  ($scope.daylighton-new Date("01/01/01 " + getbytevalue(memoryraw,4).pad() + ":" + getbytevalue(memoryraw,5).pad()))
		{
			SaveMemory("Daylights On Hour", "mb204," + new Date(Date.parse($scope.daylighton)).getHours());
			SaveMemory("Daylights On Minute", "mb205," + new Date(Date.parse($scope.daylighton)).getMinutes());
		}
		if  ($scope.daylightoff-new Date("01/01/01 " + getbytevalue(memoryraw,6).pad() + ":" + getbytevalue(memoryraw,7).pad()))
		{
			SaveMemory("Daylights Off Hour", "mb206," + new Date(Date.parse($scope.daylightoff)).getHours());
			SaveMemory("Daylights Off Minute", "mb207," + new Date(Date.parse($scope.daylightoff)).getMinutes());
		}
		if ($scope.heateron!=getintvalue(memoryraw,22)/10)
			SaveMemory("Heater On", "mi222," + Math.round($scope.heateron*10));
		if ($scope.heateroff!=getintvalue(memoryraw,24)/10)
			SaveMemory("Heater Off", "mi224," + Math.round($scope.heateroff*10));
		if ($scope.chilleron!=getintvalue(memoryraw,26)/10)
			SaveMemory("Chiller On", "mi226," + Math.round($scope.chilleron*10));
		if ($scope.chilleroff!=getintvalue(memoryraw,28)/10)
			SaveMemory("Chiller Off", "mi228," + Math.round($scope.chilleroff*10));
		if ($scope.overheat!=getintvalue(memoryraw,18)/10)
			SaveMemory("Overheat Temperature", "mi218," + Math.round($scope.overheat*10));
		if ($scope.atotimeout!=getintvalue(memoryraw,76))
			SaveMemory("Auto Top Off Timeout", "mi276," + $scope.atotimeout);
		if ($scope.wmtimer!=getintvalue(memoryraw,8))
			SaveMemory("Wavemaker Timer", "mi208," + $scope.wmtimer);
		if ($scope.co2controlon!=getintvalue(memoryraw,85)/100)
			SaveMemory("CO2 Control On", "mi285," + Math.round($scope.co2controlon*100));
		if ($scope.co2controloff!=getintvalue(memoryraw,87)/100)
			SaveMemory("CO2 Control Off", "mi287," + Math.round($scope.co2controloff*100));
		if ($scope.phcontrolon!=getintvalue(memoryraw,89)/100)
			SaveMemory("pH Control Off", "mi289," + Math.round($scope.phcontrolon*100));
		if ($scope.phcontroloff!=getintvalue(memoryraw,91)/100)
			SaveMemory("pH Control Off", "mi291," + Math.round($scope.phcontroloff*100));
		if ($scope.dp1interval!=getintvalue(memoryraw,43))
			SaveMemory("Dosing Pump 1 Interval", "mi243," + $scope.dp1interval);
		if ($scope.dp1timer!=getbytevalue(memoryraw,12))
			SaveMemory("Dosing Pump 1 Timer", "mb212," + $scope.dp1timer);
		if ($scope.dp2interval!=getintvalue(memoryraw,45))
			SaveMemory("Dosing Pump 2 Interval", "mi245," + $scope.dp2interval);
		if ($scope.dp2timer!=getbytevalue(memoryraw,13))
			SaveMemory("Dosing Pump 2 Timer", "mb213," + $scope.dp2timer);
		if ($scope.dp3interval!=getintvalue(memoryraw,134))
			SaveMemory("Dosing Pump 3 Interval", "mi334," + $scope.dp3interval);
		if ($scope.dp3timer!=getbytevalue(memoryraw,133))
			SaveMemory("Dosing Pump 3 Timer", "mb333," + $scope.dp3timer);
		if ($scope.delayedon!=getbytevalue(memoryraw,120))
			SaveMemory("Delayed Start", "mb320," + $scope.delayedon);
		if ($scope.pwmslopestartd!=getbytevalue(memoryraw,49))
			SaveMemory("Daylight Dimming Start %", "mb249," + $scope.pwmslopestartd);
		if ($scope.pwmslopeendd!=getbytevalue(memoryraw,50))
			SaveMemory("Daylight Dimming End %", "mb250," + $scope.pwmslopeendd);
		if ($scope.pwmslopedurationd!=getbytevalue(memoryraw,51))
			SaveMemory("Daylight Dimming Duration", "mb251," + $scope.pwmslopedurationd);
		if ($scope.pwmslopestarta!=getbytevalue(memoryraw,52))
			SaveMemory("Actinic Dimming Start %", "mb252," + $scope.pwmslopestarta);
		if ($scope.pwmslopeenda!=getbytevalue(memoryraw,53))
			SaveMemory("Actinic Dimming End %", "mb253," + $scope.pwmslopeenda);
		if ($scope.pwmslopedurationa!=getbytevalue(memoryraw,54))
			SaveMemory("Actinic Dimming Duration", "mb254," + $scope.pwmslopedurationa);
		if ($scope.waterlevellow!=getbytevalue(memoryraw,131))
			SaveMemory("Low Water Level", "mb331," + $scope.waterlevellow);
		if ($scope.waterlevelhigh!=getbytevalue(memoryraw,132))
			SaveMemory("High Water Level", "mb332," + $scope.waterlevelhigh);
		if ($scope.feedingtimer!=getintvalue(memoryraw,14))
			SaveMemory("Feeding Timer", "mi214," + $scope.feedingtimer);
		var pwmMemory=58;
		for (a=0;a<6;a++)
		{
			if ($scope.pwmslopestart[a]!=getbytevalue(memoryraw,pwmMemory))
			{
				t=200+pwmMemory;
				SaveMemory("Dimming Expansion Channel " + a + " Start %", "mb" + t + "," + $scope.pwmslopestart[a]);
			}
			pwmMemory++;
			if ($scope.pwmslopeend[a]!=getbytevalue(memoryraw,pwmMemory))
			{
				t=200+pwmMemory;
				SaveMemory("Dimming Expansion Channel " + a + " End %", "mb" + t + "," + $scope.pwmslopeend[a]);
			}
			pwmMemory++;
			if ($scope.pwmslopeduration[a]!=getbytevalue(memoryraw,pwmMemory))
			{
				t=200+pwmMemory;
				SaveMemory("Dimming Expansion Channel " + a + " Duration", "mb" + t + "," + $scope.pwmslopeduration[a]);
			}
			pwmMemory++;
		}
		var radionMemory=102;
		for (const channel of ['White','Royal Blue','Red','Green','Blue','Intensity'])
		{
			if ($scope.radionslopestart[channel]!=getbytevalue(memoryraw,radionMemory))
			{
				t=200+radionMemory;
				SaveMemory("Radion " + channel + " Channel Start %", "mb" + t + "," + $scope.radionslopestart[channel]);
			}
			radionMemory++;
			if ($scope.radionslopeend[channel]!=getbytevalue(memoryraw,radionMemory))
			{
				t=200+radionMemory;
				SaveMemory("Radion " + channel + " Channel End %", "mb" + t + "," + $scope.radionslopeend[channel]);
			}
			radionMemory++;
			if ($scope.radionslopeduration[channel]!=getbytevalue(memoryraw,radionMemory))
			{
				t=200+radionMemory;
				SaveMemory("Radion " + channel + " Channel Duration", "mb" + t + "," + $scope.radionslopeduration[channel]);
			}
			radionMemory++;
		}
		if (MemString.length>0)
		{
			modal.show();
			$scope.showim=false;
			$scope.memoryresult+=MemString[memindex];
			$scope.updatecontrollermemory(MemURL[memindex]);
		}
		else
		{
			ons.notification.alert({message: 'Nothing to update.'});
		}
	};

$scope.updatecontrollermemory = function(cmd) {
    //console.log(cmd);
    if (mqtt != null) {
        SaveMQTTMemory(cmd);
    } else {
        var tempurl = "http://" + $localStorage.controllers[$localStorage.activecontrollerid].ipaddress + ":" + $localStorage.controllers[$localStorage.activecontrollerid].port + "/" + cmd;
        
        $http.get(tempurl, {timeout: 3000})
            .then(function(response) {
                var data = response.data;
                attempts = 0;
                //console.log(data);
                if (data.indexOf("OK") > 0) {
                    $scope.memoryresult += ": OK\n";
                } else {
                    $scope.memoryresult += ": Error\n";
                }
                if (memindex < (MemString.length - 1)) {
                    memindex++;
                    $scope.memoryresult += MemString[memindex];
                    $timeout(function() {
                        $scope.updatecontrollermemory(MemURL[memindex]);
                    }, 1000);
                } else {
                    modal.hide();
                }
            })
            .catch(function() {
                modal.hide();
                if (attempts < 1) {
                    attempts++;
                    $scope.updatecontrollermemory(cmd);
                } else {
                    attempts = 0;
                    ons.notification.alert({message: 'Unable to process controller data!', title: 'Reef Angel Controller'});
                }
            });
    }
}
});

function UpdateParams($scope,$timeout,$localStorage)
{
	$scope.$storage = $localStorage;
//	console.log("UpdateParams()");
   $scope.reefangelconnected = false;
	if ($localStorage.controllers.length>0)
	{
		//MQTTdisconnect();
		if ($localStorage.controllers[$localStorage.activecontrollerid]!=null)
		{
			cloudusername=$localStorage.controllers[$localStorage.activecontrollerid].cloudusername;
			cloudpassword=$localStorage.controllers[$localStorage.activecontrollerid].cloudpassword;
		}
		$scope.cloudenabled=false;
		if (cloudusername!=null && cloudpassword!=null)
		{
			$scope.cloudenabled=true;
			$scope.cloudstatus=json.RA.cloudstatus;
            
		}
		MQTTconnect();
	}
    if(json.RA.ID!=null){
        $scope.reefangelconnected = true;
    }
	if (json!=null && json.RA!=null)
	{   
		setModeLabel();
		if (json.RA.lastrefresh == null)
			$scope.lastupdated="Never";
		else
			$scope.lastupdated=json.RA.lastrefresh;
		if (json.RA.ID == null)
			$scope.forumid = "Unknown";
		else
			$scope.forumid = json.RA.ID;
		$scope.t1 = (json.RA.T1/10).toFixed(1);
		$scope.t2 = (json.RA.T2/10).toFixed(1);
		$scope.t3 = (json.RA.T3/10).toFixed(1);
		$scope.t4 = (json.RA.T4/10).toFixed(1);
		$scope.t5 = (json.RA.T5/10).toFixed(1);
		$scope.t6 = (json.RA.T6/10).toFixed(1);
		$scope.ph = (json.RA.PH/100).toFixed(2);
		if (json.RA.BID == 4)
		{
			$scope.stardimmingenabled=true;
			$scope.alarm = json.RA.ALARM;
			$scope.leak = json.RA.LEAK;
		}
		else
		{
			$scope.mainenabled=true;
		}
		if (json.RA.REM>0)
		{
			$scope.expansionenabled=true;
			if ((json.RA.REM & 1) == 1)
				$scope.exp1enabled=true;
			if ((json.RA.REM & 2) == 2)
				$scope.exp2enabled=true;
			if ((json.RA.REM & 4) == 4)
				$scope.exp3enabled=true;
			if ((json.RA.REM & 8) == 8)
				$scope.exp4enabled=true;
			if ((json.RA.REM & 16) == 16)
				$scope.exp5enabled=true;
			if ((json.RA.REM & 32) == 32)
				$scope.exp6enabled=true;
			if ((json.RA.REM & 64) == 64)
				$scope.exp7enabled=true;
			if ((json.RA.REM & 128) == 128)
				$scope.exp8enabled=true;
		}
		CheckExpansion($scope);
		if ((json.RA.EM & 2) == 2)
		{
			$scope.rfm = rfmodes[parseInt(json.RA.RFM)];
			$scope.rfs = json.RA.RFS;
			$scope.rfd = json.RA.RFD;
			$scope.rfmodecolor = rfmodecolors[parseInt(json.RA.RFM)];
			$scope.rfimage = rfimages[parseInt(json.RA.RFM)];
			CheckRadionOverride($scope);
		}
		if ((json.RA.EM & 8) == 8)
			$scope.sal = (json.RA.SAL/10).toFixed(1);
		if ((json.RA.EM & 16) == 16)
			$scope.orp = json.RA.ORP;
		if ((json.RA.EM & 32) == 32)
		{
			CheckIO($scope);
		}
		if ((json.RA.EM & 64) == 64)
			$scope.phe = (json.RA.PHE/100).toFixed(2);
		if ((json.RA.EM & 128) == 128)
		{
			$scope.wl = json.RA.WL;
			$scope.wl1 = json.RA.WL1;
			$scope.wl2 = json.RA.WL2;
			$scope.wl3 = json.RA.WL3;
			$scope.wl4 = json.RA.WL4;
		}
		if ((json.RA.EM1 & 1) == 1)
			$scope.hum = json.RA.HUM;
		if ((json.RA.EM1 & 2) == 2)
		{
			$scope.dcm = rfmodes[parseInt(json.RA.DCM)];
			$scope.dcs = json.RA.DCS;
			$scope.dcd = json.RA.DCD;
			$scope.dcmodecolor = rfmodecolors[parseInt(json.RA.DCM)];
			$scope.dcimage = rfimages[parseInt(json.RA.DCM)];
		}
		if ((json.RA.EM1 & 4) == 4)
			$scope.leak = json.RA.LEAK;
		if ((json.RA.EM1 & 8) == 8)
			$scope.par = json.RA.PAR;
        if ((json.RA.EM1 & 32)==32)
            $scope.ozo = json.RA.OZO;
         if ((json.RA.EM1 & 64)==64)
            $scope.co2 = json.RA.CO2;
            $scope.co2hum=(json.RA.CO2HUM/10).toFixed(1);
		CheckFlags($scope);
		$scope.atohigh = json.RA.ATOHIGH;
		$scope.atolow = json.RA.ATOLOW;
		CheckDimmingOverride($scope);
		CheckCvar($scope);
		$scope.c0 = json.RA.C0;
		$scope.c1 = json.RA.C1;
		$scope.c2 = json.RA.C2;
		$scope.c3 = json.RA.C3;
		$scope.c4 = json.RA.C4;
		$scope.c5 = json.RA.C5;
		$scope.c6 = json.RA.C6;
		$scope.c7 = json.RA.C7;
        
        $scope.convertToNumber = function() {
        $scope.dimmingoverridechange = Number($scope.dimmingoverridechange);
        }

		$scope.dimmingoverridelabel=dimmingchannels[channeloverride];
		if (channeloverride==0)
		{
			$scope.dimmingoverridechange = $scope.pwmd;
			$scope.dimmingoverrideslider = "{'range': true, 'daylightslider': true}";
		}
		if (channeloverride==1)
		{
			$scope.dimmingoverridechange = $scope.pwma;
			$scope.dimmingoverrideslider = "{'range': true, 'actinicslider': true}";
		}
		if (channeloverride==17)
		{
			$scope.dimmingoverridechange = $scope.pwmd2;
			$scope.dimmingoverrideslider = "{'range': true, 'daylightslider': true}";
		}
		if (channeloverride==18)
		{
			$scope.dimmingoverridechange = $scope.pwma2;
			$scope.dimmingoverrideslider = "{'range': true, 'actinicslider': true}";
		}
		if (channeloverride==2)
		{
			$scope.dimmingoverridechange = $scope.pwme0;
			$scope.dimmingoverrideslider = "{'range': true, 'pwmeslider': true}";
		}
		if (channeloverride==3)
		{
			$scope.dimmingoverridechange = $scope.pwme1;
			$scope.dimmingoverrideslider = "{'range': true, 'pwmeslider': true}";
		}
		if (channeloverride==4)
		{
			$scope.dimmingoverridechange = $scope.pwme2;
			$scope.dimmingoverrideslider = "{'range': true, 'pwmeslider': true}";
		}
		if (channeloverride==5)
		{
			$scope.dimmingoverridechange = $scope.pwme3;
			$scope.dimmingoverrideslider = "{'range': true, 'pwmeslider': true}";
		}
		if (channeloverride==6)
		{
			$scope.dimmingoverridechange = $scope.pwme4;
			$scope.dimmingoverrideslider = "{'range': true, 'pwmeslider': true}";
		}
		if (channeloverride==7)
		{
			$scope.dimmingoverridechange = $scope.pwme5;
			$scope.dimmingoverrideslider = "{'range': true, 'pwmeslider': true}";
		}
		if (channeloverride==11)
		{
			$scope.dimmingoverridechange = $scope.rfw;
			$scope.dimmingoverrideslider = "{'range': true, 'daylightslider': true}";
		}
		if (channeloverride==12)
		{
			$scope.dimmingoverridechange = $scope.rfrb;
			$scope.dimmingoverrideslider = "{'range': true, 'actinicslider': true}";
		}
		if (channeloverride==13)
		{
			$scope.dimmingoverridechange = $scope.rfr;
			$scope.dimmingoverrideslider = "{'range': true, 'redslider': true}";
		}
		if (channeloverride==14)
		{
			$scope.dimmingoverridechange = $scope.rfg;
			$scope.dimmingoverrideslider = "{'range': true, 'pwmeslider': true}";
		}
		if (channeloverride==15)
		{
			$scope.dimmingoverridechange = $scope.rfb;
			$scope.dimmingoverrideslider = "{'range': true, 'blueslider': true}";
		}
		if (channeloverride==16)
		{
			$scope.dimmingoverridechange = $scope.rfi;
			$scope.dimmingoverrideslider = "{'range': true, 'intensityslider': true}";
		}
		$scope.cvarupdatelabel=customvars[cvarupdateindex];
		if (cvarupdateindex==0) $scope.cvarupdatechange = $scope.c0;
		if (cvarupdateindex==1) $scope.cvarupdatechange = $scope.c1;
		if (cvarupdateindex==2) $scope.cvarupdatechange = $scope.c2;
		if (cvarupdateindex==3) $scope.cvarupdatechange = $scope.c3;
		if (cvarupdateindex==4) $scope.cvarupdatechange = $scope.c4;
		if (cvarupdateindex==5) $scope.cvarupdatechange = $scope.c5;
		if (cvarupdateindex==6) $scope.cvarupdatechange = $scope.c6;
		if (cvarupdateindex==7) $scope.cvarupdatechange = $scope.c7;
		$scope.rfmodeupdatechange = $scope.rfm;
		$scope.dcmodeupdatechange = $scope.dcm;
		if (statusindex==6)
		{
			$scope.speedupdatechange=$scope.dcs;
			$scope.durationupdatechange=$scope.dcd;
		}
		if (statusindex==8)
		{
			$scope.speedupdatechange=$scope.rfs;
			$scope.durationupdatechange=$scope.rfd;
		}
		CheckRelay($scope);
	}
	loadlabels($scope);
}

function CheckFlags($scope)
{
	$scope.alertato=((json.RA.AF & 1) == 1);
	$scope.alertoverheat=((json.RA.AF & 2) == 2);
	$scope.alertbuslock=((json.RA.AF & 4) == 4);
	$scope.alertleak=((json.RA.AF & 8) == 8);
	$scope.alertlightson=((json.RA.SF & 1) == 1);
	$scope.alertnoflag=!(json.RA.AF>0 || $scope.alertlightson);
}

function CheckIO($scope)
{
	$scope.io0 = (json.RA.IO & 1)/1;
	$scope.io1 = (json.RA.IO & 2)/2;
	$scope.io2 = (json.RA.IO & 4)/4;
	$scope.io3 = (json.RA.IO & 8)/8;
	$scope.io4 = (json.RA.IO & 16)/16;
	$scope.io5 = (json.RA.IO & 32)/32;
    $scope.io6 = (json.RA.IO & 64)/64;
    $scope.io7 = (json.RA.IO & 128)/128;
}

function CheckExpansion($scope)
{
	$scope.dimmingexpansionenabled = ((json.RA.EM & 1) == 1);
	$scope.rfenabled = ((json.RA.EM & 2) == 2);
	$scope.salinityenabled = ((json.RA.EM & 8) == 8);
	$scope.orpenabled = ((json.RA.EM & 16) == 16);
	$scope.ioenabled = ((json.RA.EM & 32) == 32);
	$scope.pheenabled = ((json.RA.EM & 64) == 64);
	if ((json.RA.EM & 128) == 128)
	{
		$scope.wlenabled=true;
		$scope.multiwlenabled=true;
	}
	$scope.humenabled = ((json.RA.EM1 & 1) == 1);
	$scope.dcpumpenabled = ((json.RA.EM1 & 2) == 2);
	$scope.leakenabled = ((json.RA.EM1 & 4) == 4);
	$scope.parenabled = ((json.RA.EM1 & 8) == 8);
    $scope.ozoenabled = ((json.RA.EM1 & 32) == 32);
    $scope.co2enabled= ((json.RA.EM1 & 64) ==64);
}

function CheckCvar($scope)
{
	if (json.RA.C0>0 || json.RA.C1>0 || json.RA.C2>0 || json.RA.C3>0 || json.RA.C4>0 || json.RA.C5>0 || json.RA.C6>0 || json.RA.C7>0) $scope.cvarenabled=true;
}

function CheckDimmingOverride($scope)
{
   
    
	if (json.RA.PWMDO<=100)
	{
		$scope.pwmdclass = "dimmingoverridehighlight";
		$scope.pwmd = parseInt(json.RA.PWMDO, 10);
	}
	else
	{
		$scope.pwmdclass = "";
		$scope.pwmd = parseInt(json.RA.PWMD, 10);
	}
	if (json.RA.PWMAO<=100)
	{
		$scope.pwmaclass = "dimmingoverridehighlight";
		$scope.pwma = parseInt(json.RA.PWMAO, 10);
	}
	else
	{
		$scope.pwmaclass = "";
		$scope.pwma = parseInt(json.RA.PWMA, 10);
	}
	if (json.RA.BID == 4)
	{
		if (json.RA.PWMD2O<=100)
		{
			$scope.pwmd2class = "dimmingoverridehighlight";
			$scope.pwmd2 = parseInt(json.RA.PWMD2O, 10);
		}
		else
		{
			$scope.pwmd2class = "";
			$scope.pwmd2 = parseInt(json.RA.PWMD2, 10);
		}
		if (json.RA.PWMA2O<=100)
		{
			$scope.pwma2class = "dimmingoverridehighlight";
			$scope.pwma2 = parseInt(json.RA.PWMA2O, 10);
		}
		else
		{
			$scope.pwma2class = "";
			$scope.pwma2 = parseInt(json.RA.PWMA2, 10);
		}
	}
	if ((json.RA.EM & 1) != 1) return;
	if (json.RA.PWME0O<=100)
	{
		$scope.pwme0class = "dimmingoverridehighlight";
		$scope.pwme0 = parseInt(json.RA.PWME0O, 10);
	}
	else
	{
		$scope.pwme0class = "";
		$scope.pwme0 = parseInt(json.RA.PWME0, 10);
	}
	if (json.RA.PWME1O<=100)
	{
		$scope.pwme1class = "dimmingoverridehighlight";
		$scope.pwme1 = parseInt(json.RA.PWME1O, 10);
	}
	else
	{
		$scope.pwme1class = "";
		$scope.pwme1 = parseInt(json.RA.PWME1, 10);
	}
	if (json.RA.PWME2O<=100)
	{
		$scope.pwme2class = "dimmingoverridehighlight";
		$scope.pwme2 = parseInt(json.RA.PWME2O, 10);
	}
	else
	{
		$scope.pwme2class = "";
		$scope.pwme2 = parseInt(json.RA.PWME2, 10);
	}
	if (json.RA.PWME3O<=100)
	{
		$scope.pwme3class = "dimmingoverridehighlight";
		$scope.pwme3 = parseInt(json.RA.PWME3O, 10);
	}
	else
	{
		$scope.pwme3class = "";
		$scope.pwme3 = parseInt(json.RA.PWME3, 10);
	}
	if (json.RA.PWME4O<=100)
	{
		$scope.pwme4class = "dimmingoverridehighlight";
		$scope.pwme4 = parseInt(json.RA.PWME4O, 10);
	}
	else
	{
		$scope.pwme4class = "";
		$scope.pwme4 = parseInt(json.RA.PWME4, 10);
	}
	if (json.RA.PWME5O<=100)
	{
		$scope.pwme5class = "dimmingoverridehighlight";
		$scope.pwme5 = parseInt(json.RA.PWME5O, 10);
	}
	else
	{
		$scope.pwme5class = "";
		$scope.pwme5 = parseInt(json.RA.PWME5, 10);
	}
}

function CheckRadionOverride($scope)
{
	if (json.RA.RFWO<=100)
	{
		$scope.rfwclass = "dimmingoverridehighlight";
		$scope.rfw = parseInt(json.RA.RFWO, 10);
	}
	else
	{
		$scope.rfwclass = "";
		$scope.rfw = parseInt(json.RA.RFW, 10);
	}
	if (json.RA.RFRBO<=100)
	{
		$scope.rfrbclass = "dimmingoverridehighlight";
		$scope.rfrb = parseInt(json.RA.RFRBO, 10);
	}
	else
	{
		$scope.rfrbclass = "";
		$scope.rfrb = parseInt(json.RA.RFRB, 10);
	}
	if (json.RA.RFRO<=100)
	{
		$scope.rfrclass = "dimmingoverridehighlight";
		$scope.rfr = parseInt(json.RA.RFRO, 10);
	}
	else
	{
		$scope.rfrclass = "";
		$scope.rfr = parseInt(json.RA.RFR, 10);
	}
	if (json.RA.RFGO<=100)
	{
		$scope.rfgclass = "dimmingoverridehighlight";
		$scope.rfg = parseInt(json.RA.RFGO, 10);
	}
	else
	{
		$scope.rfgclass = "";
		$scope.rfg = parseInt(json.RA.RFG, 10);
	}
	if (json.RA.RFBO<=100)
	{
		$scope.rfbclass = "dimmingoverridehighlight";
		$scope.rfb = parseInt(json.RA.RFBO, 10);
	}
	else
	{
		$scope.rfbclass = "";
		$scope.rfb = parseInt(json.RA.RFB, 10);
	}
	if (json.RA.RFIO<=100)
	{
		$scope.rficlass = "dimmingoverridehighlight";
		$scope.rfi = parseInt(json.RA.RFIO, 10);
	}
	else
	{
		$scope.rficlass = "";
		$scope.rfi = parseInt(json.RA.RFI, 10);
	}
}

function CheckRelay($scope)
{
	for (a=1;a<=8;a++)
	{
		if ((json.RA.RON & (1<<(a-1))) == 0 && (json.RA.ROFF & (1<<(a-1))) == (1<<(a-1)))
		{
			$scope["r"+a+"on"]=false;
			$scope["r"+a+"off"]=false;
			$scope["r"+a+"auto"]=true;
			if ((json.RA.R & (1<<(a-1))) == (1<<(a-1)))
				$scope["r"+a+"autoclass"]="relaygreenclass";
			else
				$scope["r"+a+"autoclass"]="relayredclass";
			$scope["r"+a+"onclass"]="relayblankclass";
			$scope["r"+a+"offclass"]="relayblankclass";
		}
		if ((json.RA.RON & (1<<(a-1))) == (1<<(a-1)))
		{
			$scope["r"+a+"onclass"]="relaygreenclass";
			$scope["r"+a+"offclass"]="relayblankclass";
			$scope["r"+a+"autoclass"]="relayblankclass";
			$scope["r"+a+"on"]=true;
			$scope["r"+a+"off"]=false;
			$scope["r"+a+"auto"]=false;
		}
		if ((json.RA.ROFF & (1<<(a-1))) == 0)
		{
			$scope["r"+a+"onclass"]="relayblankclass";
			$scope["r"+a+"offclass"]="relayredclass";
			$scope["r"+a+"autoclass"]="relayblankclass";
			$scope["r"+a+"on"]=false;
			$scope["r"+a+"off"]=true;
			$scope["r"+a+"auto"]=false;
		}
		for (b=1;b<=8;b++)
		{
			if ((json.RA["RON"+a] & (1<<(b-1))) == 0 && (json.RA["ROFF"+a] & (1<<(b-1))) == (1<<(b-1)))
			{
				$scope["r"+a+b+"on"]=false;
				$scope["r"+a+b+"off"]=false;
				$scope["r"+a+b+"auto"]=true;
				if ((json.RA["R"+a] & (1<<(b-1))) == (1<<(b-1)))
					$scope["r"+a+b+"autoclass"]="relaygreenclass";
				else
					$scope["r"+a+b+"autoclass"]="relayredclass";
				$scope["r"+a+b+"onclass"]="relayblankclass";
				$scope["r"+a+b+"offclass"]="relayblankclass";
			}
			if ((json.RA["RON"+a] & (1<<(b-1))) == (1<<(b-1)))
			{
				$scope["r"+a+b+"onclass"]="relaygreenclass";
				$scope["r"+a+b+"offclass"]="relayblankclass";
				$scope["r"+a+b+"autoclass"]="relayblankclass";
				$scope["r"+a+b+"on"]=true;
				$scope["r"+a+b+"off"]=false;
				$scope["r"+a+b+"auto"]=false;
			}
			if ((json.RA["ROFF"+a] & (1<<(b-1))) == 0)
			{
				$scope["r"+a+b+"onclass"]="relayblankclass";
				$scope["r"+a+b+"offclass"]="relayredclass";
				$scope["r"+a+b+"autoclass"]="relayblankclass";
				$scope["r"+a+b+"on"]=false;
				$scope["r"+a+b+"off"]=true;
				$scope["r"+a+b+"auto"]=false;
			}
		}
	}
}

function loaddefaultlabels()
{
	if (jsondefaultlabels==null) jsondefaultlabels=new Object();
	if (jsondefaultlabels.RA==null) jsondefaultlabels.RA=new Object();
	jsondefaultlabels.RA.T1N = "Temp 1";
	jsondefaultlabels.RA.T2N = "Temp 2";
	jsondefaultlabels.RA.T3N = "Temp 3";
	jsondefaultlabels.RA.T4N = "Temp 4";
	jsondefaultlabels.RA.T5N = "Temp 5";
	jsondefaultlabels.RA.T6N = "Temp 6";
	jsondefaultlabels.RA.PHN = "pH";
	jsondefaultlabels.RA.ATOHIGHN = "ATO High";
	jsondefaultlabels.RA.ATOLOWN = "ATO Low";
	jsondefaultlabels.RA.PWMD1N = "Daylight Channel";
	jsondefaultlabels.RA.PWMA1N = "Actinic Channel";
	jsondefaultlabels.RA.ALARMN = "Alarm";
	jsondefaultlabels.RA.LEAKN = "Leak";
	jsondefaultlabels.RA.PWMD2N = "Daylight Channel 2";
	jsondefaultlabels.RA.PWMA2N = "Actinic Channel 2";
	jsondefaultlabels.RA.PWME0N = "Dimming Channel 0";
	jsondefaultlabels.RA.PWME1N = "Dimming Channel 1";
	jsondefaultlabels.RA.PWME2N = "Dimming Channel 2";
	jsondefaultlabels.RA.PWME3N = "Dimming Channel 3";
	jsondefaultlabels.RA.PWME4N = "Dimming Channel 4";
	jsondefaultlabels.RA.PWME5N = "Dimming Channel 5";
	jsondefaultlabels.RA.C0N = "Custom Var 0:";
	jsondefaultlabels.RA.C1N = "Custom Var 1:";
	jsondefaultlabels.RA.C2N = "Custom Var 2:";
	jsondefaultlabels.RA.C3N = "Custom Var 3:";
	jsondefaultlabels.RA.C4N = "Custom Var 4:";
	jsondefaultlabels.RA.C5N = "Custom Var 5:";
	jsondefaultlabels.RA.C6N = "Custom Var 6:";
	jsondefaultlabels.RA.C7N = "Custom Var 7:";
	jsondefaultlabels.RA.RFWN = "White Channel";
	jsondefaultlabels.RA.RFRBN = "Royal Blue Channel";
	jsondefaultlabels.RA.RFRN = "Red Channel";
	jsondefaultlabels.RA.RFGN = "Green Channel";
	jsondefaultlabels.RA.RFBN = "Blue Channel";
	jsondefaultlabels.RA.RFIN = "Intensity Channel";
	jsondefaultlabels.RA.SALN = "Salinity";
	jsondefaultlabels.RA.ORPN = "ORP";
	jsondefaultlabels.RA.PHEN = "pH Expansion";
    jsondefaultlabels.RA.OZON = "Ozone";
    jsondefaultlabels.RA.CO2N = "CO2";
    jsondefaultlabels.RA.CO2HUMN = "Humidity";
	jsondefaultlabels.RA.WLN = "Water Level";
	jsondefaultlabels.RA.WL1N = "Water Level 1";
	jsondefaultlabels.RA.WL2N = "Water Level 2";
	jsondefaultlabels.RA.WL3N = "Water Level 3";
	jsondefaultlabels.RA.WL4N = "Water Level 4";
	jsondefaultlabels.RA.HUMN = "Humidity";
	jsondefaultlabels.RA.PARN = "PAR";
	jsondefaultlabels.RA.IO0N = "I/O Channel 0";
	jsondefaultlabels.RA.IO1N = "I/O Channel 1";
	jsondefaultlabels.RA.IO2N = "I/O Channel 2";
	jsondefaultlabels.RA.IO3N = "I/O Channel 3";
	jsondefaultlabels.RA.IO4N = "I/O Channel 4";
	jsondefaultlabels.RA.IO5N = "I/O Channel 5";
    jsondefaultlabels.RA.IO6N = "I/O Channel 6";
	jsondefaultlabels.RA.IO7N = "I/O Channel 7";
	jsondefaultlabels.RA.UV1N = "User Var 1";
	jsondefaultlabels.RA.UV2N = "User Var 2";
	jsondefaultlabels.RA.UV3N = "User Var 3";
	jsondefaultlabels.RA.UV4N = "User Var 4";
	jsondefaultlabels.RA.UV5N = "User Var 5";
	jsondefaultlabels.RA.UV6N = "User Var 6";
	jsondefaultlabels.RA.UV7N = "User Var 7";
	jsondefaultlabels.RA.UV8N = "User Var 8";
    
	for (a=1;a<=8;a++)
	{
		jsondefaultlabels.RA["R"+a+"N" ]= "Relay " + a;
		for (b=1;b<=8;b++)
		{
			jsondefaultlabels.RA["R"+a+b+"N"] = "Relay " + a + b;
		}
	}
}

function loaddefaultvalues()
{
	if (json==null) json=new Object();
	if (json.RA==null) json.RA=new Object();
	json.RA.T1 = "0.0";
	json.RA.T2 = "0.0";
	json.RA.T3 = "0.0";
	json.RA.T4 = "0.0";
	json.RA.T5 = "0.0";
	json.RA.T6 = "0.0";
	json.RA.PH = "0.00";
	json.RA.ATOHIGH = "0";
	json.RA.ATOLOW = "0";
	json.RA.PWMD1 = "0";
	json.RA.PWMA1 = "0";
	json.RA.ALARM = "0";
	json.RA.LEAK = "0";
	json.RA.PWMD2 = "0";
	json.RA.PWMA2 = "0";
	json.RA.PWME0 = "0";
	json.RA.PWME1 = "0";
	json.RA.PWME2 = "0";
	json.RA.PWME3 = "0";
	json.RA.PWME4 = "0";
	json.RA.PWME5 = "0";
	json.RA.C0 = "0";
	json.RA.C1 = "0";
	json.RA.C2 = "0";
	json.RA.C3 = "0";
	json.RA.C4 = "0";
	json.RA.C5 = "0";
	json.RA.C6 = "0";
	json.RA.C7 = "0";
	json.RA.RFW = "0";
	json.RA.RFRB = "0";
	json.RA.RFR = "0";
	json.RA.RFG = "0";
	json.RA.RFB = "0";
	json.RA.RFI = "0";
	json.RA.SAL = "0.0";
	json.RA.ORP = "0";
	json.RA.PHE = "0.00";
	json.RA.WL = "0";
	json.RA.WL1 = "0";
	json.RA.WL2 = "0";
	json.RA.WL3 = "0";
	json.RA.WL4 = "0";
	json.RA.HUM = "0";
	json.RA.PAR = "0";
	json.RA.IO0 = "0";
	json.RA.IO1 = "0";
	json.RA.IO2 = "0";
	json.RA.IO3 = "0";
	json.RA.IO4 = "0";
	json.RA.IO5 = "0";
    json.RA.IO6 = "0";
    json.RA.IO7 = "0";
    json.RA.UV1 = "0";
    json.RA.UV2 = "0";
    json.RA.UV3= "0";
    json.RA.UV4="0";
    json.RA.UV5="0";
    json.RA.UV6="0";
    json.RA.UV7="0";
    json.RA.UV8="0";
    json.RA.OZO="0";
    json.RA.CO2="0";
    json.RA.CO2HUM="0.0";
}

function loadlabels($scope) {
	if (jsonlabels==null) jsonlabels=new Object();
	if (jsonlabels.RA==null) jsonlabels.RA=new Object();
	$scope.t1n=ifNull(jsonlabels.RA.T1N, jsondefaultlabels.RA.T1N);
	$scope.t2n=ifNull(jsonlabels.RA.T2N, jsondefaultlabels.RA.T2N);
	$scope.t3n=ifNull(jsonlabels.RA.T3N, jsondefaultlabels.RA.T3N);
	$scope.t4n=ifNull(jsonlabels.RA.T4N, jsondefaultlabels.RA.T4N);
	$scope.t5n=ifNull(jsonlabels.RA.T5N, jsondefaultlabels.RA.T5N);
	$scope.t6n=ifNull(jsonlabels.RA.T6N, jsondefaultlabels.RA.T6N);
	$scope.phn=ifNull(jsonlabels.RA.PHN, jsondefaultlabels.RA.PHN);
	$scope.saln=ifNull(jsonlabels.RA.SALN, jsondefaultlabels.RA.SALN);
	$scope.orpn=ifNull(jsonlabels.RA.ORPN, jsondefaultlabels.RA.ORPN);
	$scope.phen=ifNull(jsonlabels.RA.PHEN, jsondefaultlabels.RA.PHEN);
	$scope.humn=ifNull(jsonlabels.RA.HUMN, jsondefaultlabels.RA.HUMN);
	$scope.parn=ifNull(jsonlabels.RA.PARN, jsondefaultlabels.RA.PARN);
	$scope.wln=ifNull(jsonlabels.RA.WLN, jsondefaultlabels.RA.WLN);
	$scope.wl1n=ifNull(jsonlabels.RA.WL1N, jsondefaultlabels.RA.WL1N);
	$scope.wl2n=ifNull(jsonlabels.RA.WL2N, jsondefaultlabels.RA.WL2N);
	$scope.wl3n=ifNull(jsonlabels.RA.WL3N, jsondefaultlabels.RA.WL3N);
	$scope.wl4n=ifNull(jsonlabels.RA.WL4N, jsondefaultlabels.RA.WL4N);
	$scope.atohighn=ifNull(jsonlabels.RA.ATOHIGHN, jsondefaultlabels.RA.ATOHIGHN);
	$scope.atolown=ifNull(jsonlabels.RA.ATOLOWN, jsondefaultlabels.RA.ATOLOWN);
	$scope.pwmd1n=ifNull(jsonlabels.RA.PWMD1N, jsondefaultlabels.RA.PWMD1N);
	$scope.pwma1n=ifNull(jsonlabels.RA.PWMA1N, jsondefaultlabels.RA.PWMA1N);
	$scope.alarmn=ifNull(jsonlabels.RA.ALARMN, jsondefaultlabels.RA.ALARMN);
	$scope.leakn=ifNull(jsonlabels.RA.LEAKN, jsondefaultlabels.RA.LEAKN);
	$scope.pwmd2n=ifNull(jsonlabels.RA.PWMD2N, jsondefaultlabels.RA.PWMD2N);
	$scope.pwma2n=ifNull(jsonlabels.RA.PWMA2N, jsondefaultlabels.RA.PWMA2N);
	$scope.pwme0n=ifNull(jsonlabels.RA.PWME0N, jsondefaultlabels.RA.PWME0N);
	$scope.pwme1n=ifNull(jsonlabels.RA.PWME1N, jsondefaultlabels.RA.PWME1N);
	$scope.pwme2n=ifNull(jsonlabels.RA.PWME2N, jsondefaultlabels.RA.PWME2N);
	$scope.pwme3n=ifNull(jsonlabels.RA.PWME3N, jsondefaultlabels.RA.PWME3N);
	$scope.pwme4n=ifNull(jsonlabels.RA.PWME4N, jsondefaultlabels.RA.PWME4N);
	$scope.pwme5n=ifNull(jsonlabels.RA.PWME5N, jsondefaultlabels.RA.PWME5N);
	$scope.c0n=ifNull(jsonlabels.RA.C0N, jsondefaultlabels.RA.C0N);
	$scope.c1n=ifNull(jsonlabels.RA.C1N, jsondefaultlabels.RA.C1N);
	$scope.c2n=ifNull(jsonlabels.RA.C2N, jsondefaultlabels.RA.C2N);
	$scope.c3n=ifNull(jsonlabels.RA.C3N, jsondefaultlabels.RA.C3N);
	$scope.c4n=ifNull(jsonlabels.RA.C4N, jsondefaultlabels.RA.C4N);
	$scope.c5n=ifNull(jsonlabels.RA.C5N, jsondefaultlabels.RA.C5N);
	$scope.c6n=ifNull(jsonlabels.RA.C6N, jsondefaultlabels.RA.C6N);
	$scope.c7n=ifNull(jsonlabels.RA.C7N, jsondefaultlabels.RA.C7N);
	$scope.rfwn=ifNull(jsonlabels.RA.RFWN, jsondefaultlabels.RA.RFWN);
	$scope.rfrbn=ifNull(jsonlabels.RA.RFRBN, jsondefaultlabels.RA.RFRBN);
	$scope.rfrn=ifNull(jsonlabels.RA.RFRN, jsondefaultlabels.RA.RFRN);
	$scope.rfgn=ifNull(jsonlabels.RA.RFGN, jsondefaultlabels.RA.RFGN);
	$scope.rfbn=ifNull(jsonlabels.RA.RFBN, jsondefaultlabels.RA.RFBN);
	$scope.rfin=ifNull(jsonlabels.RA.RFIN, jsondefaultlabels.RA.RFIN);
	$scope.io0n=ifNull(jsonlabels.RA.IO0N, jsondefaultlabels.RA.IO0N);
	$scope.io1n=ifNull(jsonlabels.RA.IO1N, jsondefaultlabels.RA.IO1N);
	$scope.io2n=ifNull(jsonlabels.RA.IO2N, jsondefaultlabels.RA.IO2N);
	$scope.io3n=ifNull(jsonlabels.RA.IO3N, jsondefaultlabels.RA.IO3N);
	$scope.io4n=ifNull(jsonlabels.RA.IO4N, jsondefaultlabels.RA.IO4N);
	$scope.io5n=ifNull(jsonlabels.RA.IO5N, jsondefaultlabels.RA.IO5N);
    $scope.io6n=ifNull(jsonlabels.RA.IO6N, jsondefaultlabels.RA.IO6N);
    $scope.io7n=ifNull(jsonlabels.RA.IO7N, jsondefaultlabels.RA.IO7N);
	//user var
	$scope.uv1n=ifNull(jsonlabels.RA.UV1N, jsondefaultlabels.RA.UV1N);
	$scope.uv2n=ifNull(jsonlabels.RA.UV2N, jsondefaultlabels.RA.UV2N);
	$scope.uv3n=ifNull(jsonlabels.RA.UV3N, jsondefaultlabels.RA.UV3N);
	$scope.uv4n=ifNull(jsonlabels.RA.UV4N, jsondefaultlabels.RA.UV4N);
	$scope.uv5n=ifNull(jsonlabels.RA.UV5N, jsondefaultlabels.RA.UV5N);
	$scope.uv6n=ifNull(jsonlabels.RA.UV6N, jsondefaultlabels.RA.UV6N);
	$scope.uv7n=ifNull(jsonlabels.RA.UV7N, jsondefaultlabels.RA.UV7N);
	$scope.uv8n=ifNull(jsonlabels.RA.UV8N, jsondefaultlabels.RA.UV8N);
    
    $scope.ozon=ifNull(jsonlabels.RA.OZON, jsondefaultlabels.RA.OZON);
    $scope.co2n=ifNull(jsonlabels.RA.CO2N, jsondefaultlabels.RA.CO2N);
    $scope.co2humn=ifNull(jsonlabels.RA.CO2HUMN, jsondefaultlabels.RA.CO2HUMN);

    
	for (a=1; a<=8; a++)
	{
		$scope["r"+a+"n"]=ifNull(jsonlabels.RA["R"+a+"N"], jsondefaultlabels.RA["R"+a+"N"]);
		for (b=1; b<=8; b++)
		{
			$scope["r"+a+b+"n"]=ifNull(jsonlabels.RA["R"+a+b+"N"], jsondefaultlabels.RA["R"+a+b+"N"]);
		}
	}
}

function ifNull(condition, other) {
	if (condition && condition != "null")
		return condition;
	else
		return other;
}

function setjson(id, value) {
	//console.log(id);
	for (item in Object.keys(json.RA))
	{
		if (Object.keys(json.RA)[item] == id)
		{
			json.RA[Object.keys(json.RA)[item]]=value;
			return;
		}
	}
}

function changeactivecontroller($scope, $localStorage, $rootScope, id)
{
	$scope.activecontroller=$localStorage.controllers[id].name;
	$localStorage.activecontroller=$scope.activecontroller;
	$localStorage.activecontrollerid=id;
	json=$localStorage.jsonarray[id];
	$localStorage.json=json;
	jsonlabels=$localStorage.jsonlabelsarray[id];
	parametersscope.extratempenabled=false;
	parametersscope.salinityenabled=false;
	parametersscope.orpenabled=false;
	parametersscope.pheenabled=false;
	parametersscope.wlenabled=false;
	parametersscope.multiwlenabled=false;
	parametersscope.humenabled=false;
	parametersscope.parenabled=false;
    parametersscope.ozoenabled=false;
    parametersscope.co2enabled=false;

	if (jsonlabels==null) loaddefaultlabels();
	cloudusername=$localStorage.controllers[$localStorage.activecontrollerid].cloudusername;
	cloudpassword=$localStorage.controllers[$localStorage.activecontrollerid].cloudpassword;
	
	MQTTdisconnect();
	$rootScope.$broadcast('msg', 'paramsok');
	$rootScope.$broadcast('msg', 'popoverclose');
	MQTTconnect();
}

function parseRelayData(data) {
    return data.map(entry => {
        let timestamp = entry[0];
        let value = entry[1];
        let binary = (value >>> 0).toString(2).padStart(8, '0');
        return binary.split('').map(b => [timestamp, parseInt(b)]);
    });
}


// create the chart when all data is loaded
function CreateChart($scope, container) {
    if (names.length == 0) {
        ons.notification.alert({message: 'At least one parameter needs to be checked.'});
        return false;
    }

    $scope.showgraphlist = false;
    modal.show();

    // Ensure container exists and is empty
    var $container = $("#" + container);
    $container.html("");
    $container.css("height", ($(window).height() - 15) + "px");
    $container.css("margin-top", "-200px");

    // Proceed with Highcharts setOptions and seriesOptions as before
    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });

    seriesOptions = [];
    seriesCounter = 0;
    seriesID = 0;
	$.each(names, function (i, name) {
    var url = 'https://forum.reefangel.com/chartdata?reefangelid=' + json.RA.ID + '&parameter=' + name.toLowerCase();
    $.getJSON(url, function (data) {
        
			var pcolor;
			var tname;
			var ydec;
			var yunit;
			if (name == "PH") {
				pcolor = '#669900'
				tname = $scope.phn
				ydec = 2
				yunit = 'pH'
			}
			else if (name == "PHE") {
				pcolor = '#447700'
				tname = $scope.phen
				ydec = 2
				yunit = 'pH'
			}
			else if (name == "SAL") {
				pcolor = '#000066'
				tname = $scope.saln
				ydec = 1
				yunit = 'ppt'
			}
			else if (name == "ORP") {
				pcolor = '#330000'
				tname = $scope.orpn
				ydec = 0
				yunit = 'mV'
			}
			else if (name == "T1") {
				pcolor = '#FF0000'
				tname = $scope.t1n
				ydec = 1
				yunit = '°'
			}
			else if (name == "T2") {
				pcolor = '#FF8800'
				tname = $scope.t2n
				ydec = 1
				yunit = '°'
			}
			else if (name == "T3") {
				pcolor = '#9900CC'
				tname = $scope.t3n
				ydec = 1
				yunit = '°'
			}
			else if (name == "T4") {
				pcolor = '#9900CC'
				tname = $scope.t4n
				ydec = 1
				yunit = '°'
			}
			else if (name == "T5") {
				pcolor = '#9900CC'
				tname = $scope.t5n
				ydec = 1
				yunit = '°'
			}
			else if (name == "T6") {
				pcolor = '#9900CC'
				tname = $scope.t6n
				ydec = 1
				yunit = '°'
			}
			else if (name == "WL") {
				pcolor = '#0033FF'
				tname = $scope.wln
				ydec = 1
				yunit = '°'
			}
			else if (name == "WL1") {
				pcolor = '#0033FF'
				tname = $scope.wl1n
				ydec = 1
				yunit = '°'
			}
			else if (name == "WL2") {
				pcolor = '#0033FF'
				tname = $scope.wl2n
				ydec = 1
				yunit = '°'
			}
			else if (name == "WL3") {
				pcolor = '#0033FF'
				tname = $scope.wl3n
				ydec = 1
				yunit = '°'
			}
			else if (name == "WL4") {
				pcolor = '#0033FF'
				tname = $scope.wl4n
				ydec = 1
				yunit = '°'
			}
			else if (name == "PAR") {
				pcolor = '#0033FF'
				tname = $scope.parn
				ydec = 1
				yunit = '°'
			}
			else if (name == "HUM") {
				pcolor = '#0033FF'
				tname = $scope.humn
				ydec = 1
				yunit = '°'
			}
			else if (name == "OZO") {
				pcolor = '#0033FF'
				tname = $scope.ozon
				ydec = 1
				yunit = '°'
			}
        	else if (name == "CO2") {
				pcolor = '#0033FF'
				tname = $scope.co2n
				ydec = 1
				yunit = '°'
			}
        	else if (name == "CO2HUM") {
				pcolor = '#0033FF'
				tname = $scope.co2humn
				ydec = 1
				yunit = '°'
			}
            else if (name == "UV1") {
				pcolor = '#9900CC'
				tname = $scope.uv1n
				ydec = 1
				yunit = '°'
			}
            else if (name == "UV2") {
				pcolor = '#9900CC'
				tname = $scope.uv2n
				ydec = 1
				yunit = '°'
			}
            else if (name == "UV3") {
				pcolor = '#9900CC'
				tname = $scope.uv3n
				ydec = 1
				yunit = '°'
			}
            else if (name == "UV4") {
				pcolor = '#9900CC'
				tname = $scope.uv4n
				ydec = 1
				yunit = '°'
			}
        else if (name == "UV5") {
				pcolor = '#9900CC'
				tname = $scope.uv5n
				ydec = 1
				yunit = '°'
			}
        else if (name == "UV6") {
				pcolor = '#9900CC'
				tname = $scope.uv6n
				ydec = 1
				yunit = '°'
			}
        else if (name == "UV7") {
				pcolor = '#9900CC'
				tname = $scope.uv7n
				ydec = 1
				yunit = '°'
			}
        else if (name == "UV8") {
				pcolor = '#9900CC'
				tname = $scope.uv8n
				ydec = 1
				yunit = '°'
			}
			else {
				pcolor = '#FF0000'
				tname = ''
				ydec = 0
				yunit = ''
			}
			if (data.length) {
				seriesOptions[seriesID] = {
					dataGrouping: {
						enabled: false
					},
					name: tname,
					color: pcolor,
					tooltip: {
						yDecimals: ydec,
						ySuffix: yunit
					},
					data: data
				};
				seriesID++;
			}
			// As we're loading the data asynchronously, we don't know what order it will arrive. So
			// we keep a counter and create the chart when all the data is loaded.
			seriesCounter++;

			if(data.length==0)
			{
				modal.hide();
				ons.notification.alert({message: 'No data to display' });
			}
			else
				if (seriesCounter == names.length) {
					DrawChart(container);
			}
		});
	});
}

function DrawChart(container) {
    // Make sure to include the Highcharts exporting module correctly
    chart = Highcharts.stockChart(container, {
        chart: {
            type: 'spline'
        },
        exporting: {
            enabled: true, // Make sure exporting is enabled
            buttons: {
                contextButton: {
                    symbol: 'menu', // Change the symbol if you wish
                align: 'right', // Align to the right side of the chart
                verticalAlign: 'top', // Align to the top of the chart
                x: 0, // Horizontal offset, negative shifts it left
                y: 95,// Vertical offset, positive shifts it down
                    enabled: true, // Explicitly enable the context button if not showing
                    menuItems: ['downloadPNG', 'downloadJPEG', 'downloadPDF', 'downloadSVG', 'separator', 'printChart']
                }
            }
        },
        credits: {
            enabled: false
        },
        legend: {
            enabled: true,
            borderColor: 'black',
            borderWidth: 2,
            verticalAlign: 'top',
            y: 0,
            shadow: true
        },
        rangeSelector: {
            y: 100,
            enabled: true,
            buttons: [{
                type: 'hour',
                count: 1,
                text: '1h'
            }, {
                type: 'hour',
                count: 12,
                text: '12h'
            }, {
                type: 'day',
                count: 1,
                text: '1d'
            }, {
                type: 'day',
                count: 3,
                text: '3d'
            }, {
                type: 'day',
                count: 7,
                text: '7d'
            }, {
                type: 'all',
                text: '30d'
            }],
            selected: 3 // Default to "3 days"
        },
        navigator: {
            xAxis: {
                dateTimeLabelFormats: {
                    second: '%I:%M:%S %p',
                    minute: '%I:%M %p',
                    hour: '%b/%e',
                    day: '%b/%e'
                }
            }
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: {
                second: '%I:%M:%S %p',
                minute: '%I:%M %p',
                hour: '%I:%M %p',
                day: '%b/%e'
            }
        },
        yAxis: {
            plotLines: [{
                value: 0,
                width: 1,
                color: 'silver'
            }]
        },
        tooltip: {
            borderColor: 'silver',
            xDateFormat: '%A, %b %e, %l:%M %p',
            pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>'
        },
        series: seriesOptions // Make sure seriesOptions is correctly defined
    });

    modal.hide(); // Ensure modal is part of your UI logic and handled correctly
}

function getbytevalue(d,i)
{
	return parseInt(d.substr(i*2,2),16);
}

function getintvalue(d,i)
{
	return parseInt(d.substr((i+1)*2,2) + d.substr(i*2,2),16);
}

function SaveMemory(s,l)
{
	MemString.push(s);
	MemURL.push(l);
}

function SaveMQTTMemory(cmd)
{
	if (cmd.substring(0,2)=='mb')
	{
		message = new Paho.MQTT.Message(cmd.replace("mb","mb:").replace(",",":"));
		updatestring="MBOK:";
	}
	if (cmd.substring(0,2)=='mi')
	{
		message = new Paho.MQTT.Message(cmd.replace("mi","mi:").replace(",",":"));
		updatestring="MIOK:";
	}
	if (message!=null)
	{
		modal.show();
		ourtimer=currenttimeout(function() {
			modal.hide();
			ons.notification.alert({message: 'Timeout. Please try again.', title: 'Reef Angel Controller' });
		}, 8000);
		message.destinationName = cloudusername + "/in";
		mqtt.send(message);
	}
}

function MQTTconnect() {
    
	if (!(mqtt==null && cloudusername!=null && cloudpassword!=null)) return false;
	parametersscope.cloudstatus="Connecting...";
	relayscope.cloudstatus="Connecting...";
	if (json!=null && json.RA!=null)
    json.RA.cloudstatus="Connecting...";
	// console.log("MQTTconnect(): cloudusername=" + cloudusername + ", cloudpassword=", + cloudpassword);
	mqtt = new Paho.MQTT.Client(
					"forum.reefangel.com",
					9002,
					"web_" + parseInt(Math.random() * 100,
					10));
	var options = {
		timeout: 3,
		useSSL: true,
		cleanSession: true,
        keepAliveInterval: 45,
		onSuccess:onConnect,
		onFailure: function (message) {
            if (message.errorCode == 6){
        ons.notification.alert({
            message: 'Error Logging in! Check Username or Password',
            title: 'Reef Angel Controller'
        });
                
            }
            else
            {
                ons.notification.alert({message: 'Connection failed: ' + message.errorMessaged, title: 'Reef Angel Controller'});
            }
			setConnectionLost();  
		}
	};

	mqtt.onConnectionLost = onConnectionLost;
	mqtt.onMessageArrived = onMessageArrived;

	options.userName = cloudusername;
	options.password = cloudpassword;
	mqtt.connect(options);
	
    
}

function MQTTdisconnect() {
//	console.log("MQTTdisconnect()");
	if (mqtt!=null)	mqtt.disconnect();
	mqtt=null;
}

function onConnect() {
	parametersscope.cloudstatus="Connected";
	relayscope.cloudstatus="Connected";
	if (json!=null && json.RA!=null)
    json.RA.cloudstatus="Connected";

	mqtt.subscribe(cloudusername + "/out");
	message = new Paho.MQTT.Message("all:0");
	message.destinationName = cloudusername + "/in";
	mqtt.send(message); 
}

function onConnectionLost(response) {
    console.log("Connection Lost: code=" + response.errorCode + ", message=" + response.errorMessage);

    // Assuming these are available in this context and are part of AngularJS's scope
    if (parametersscope) {
        parametersscope.cloudstatus = "Disconnected";
        safeApply(parametersscope);
    }
    if (relayscope) {
        relayscope.cloudstatus = "Disconnected";
        safeApply(relayscope);
    }
    if (json && json.RA) {
        json.RA.cloudstatus = "Disconnected";
        // If json.RA is part of AngularJS scope, you should also safely apply changes
    }
    
    mqtt = null;
    if (response.errorCode == 7) { // Assuming this means a retryable error
        MQTTconnect();
    }
}

function setConnectionLost() {
    // Similar logic to onConnectionLost, minus the response handling
    if (parametersscope) {
        parametersscope.cloudstatus = "Disconnected";
        safeApply(parametersscope);
    }
    if (relayscope) {
        relayscope.cloudstatus = "Disconnected";
        safeApply(relayscope);
    }
    if (json && json.RA) {
        json.RA.cloudstatus = "Disconnected";
        // Apply if necessary
    }
    mqtt = null;
}

// Utility function to safely apply changes to scope
function safeApply(scope, fn) {
    if (scope && !scope.$$phase && scope.$apply) {
        scope.$apply(fn);
    } else if (fn && typeof fn === 'function') {
        fn();
    }
}

function setModeLabel() {
	if ((json.RA.SF & 1<<2)==1<<2)
	{
		parametersscope.currentMode="Water Change";
		relayscope.currentMode="Water Change";
	}
	else if ((json.RA.SF & 1<<1)==1<<1)
	{
		parametersscope.currentMode="Feeding";
		relayscope.currentMode="Feeding";
	}
	else
	{
		parametersscope.currentMode="Nominal";
		relayscope.currentMode="Nominal";
	}
}
function safelyCancelTimeoutAndHideModal() {
    if (currenttimeout && typeof currenttimeout.cancel === 'function') {
        currenttimeout.cancel(ourtimer);
    }
    if (modal && typeof modal.hide === 'function') {
        modal.hide();
    }
}

function checkAndNotifyAFChanges(oldaf, newaf) {
    if (oldaf != newaf) {
        safelyCancelTimeoutAndHideModal();
        if ((oldaf & 1 << 0) && !(newaf & 1 << 0)) {
            ons.notification.alert({ message: 'ATO Timeout Cleared', title: 'Reef Angel Controller' });
        }
        if ((oldaf & 1 << 1) && !(newaf & 1 << 1)) {
            ons.notification.alert({ message: 'Overheat Cleared', title: 'Reef Angel Controller' });
        }
        if ((oldaf & 1 << 3) && !(newaf & 1 << 3)) {
            ons.notification.alert({ message: 'Leak Cleared', title: 'Reef Angel Controller' });
        }
    }
}

function checkAndNotifySFChanges(oldsf, newsf) {
    if (oldsf != newsf) {
        safelyCancelTimeoutAndHideModal();
        if (!(oldsf & 1 << 0) && (newsf & 1 << 0)) {
            ons.notification.alert({ message: 'Lights On', title: 'Reef Angel Controller' });
        }
        if (!(oldsf & 1 << 1) && (newsf & 1 << 1)) {
            ons.notification.alert({ message: 'Feeding Mode Started', title: 'Reef Angel Controller' });
        }
        if (!(oldsf & 1 << 2) && (newsf & 1 << 2)) {
            ons.notification.alert({ message: 'Water Change Mode Started', title: 'Reef Angel Controller' });
        }
        if ((oldsf & 1 << 0) && !(newsf & 1 << 0)) {
            ons.notification.alert({ message: 'Lights Cancel', title: 'Reef Angel Controller' });
        }
        if ((oldsf & 1 << 1) && !(newsf & 1 << 1)) {
            ons.notification.alert({ message: 'Feeding Mode Ended', title: 'Reef Angel Controller' });
        }
        if ((oldsf & 1 << 2) && !(newsf & 1 << 2)) {
            ons.notification.alert({ message: 'Water Change Mode Ended', title: 'Reef Angel Controller' });
        }
    }
}

function onMessageArrived(message) {
	var payload = message.payloadString;
     // Convert to number

    //var payload = message.payloadString;
	//console.log(message.payloadString);
	json.RA.lastrefresh=new Date().toLocaleString();
	json.RA.ID=cloudusername;
	parametersscope.lastupdated=json.RA.lastrefresh;
	relayscope.lastupdated=json.RA.lastrefresh;
	parametersscope.forumid=json.RA.ID;
	if (payload.indexOf("DATE:")!=-1)
	{
		var radatetime = new Date(parseInt(payload.substr(9, 2)) + 2000, payload.substr(5, 2) - 1, payload.substr(7, 2), payload.substr(11, 2), payload.substr(13, 2));
		currenttimeout.cancel( ourtimer );
		modal.hide();
		ons.notification.alert({message: 'Controller time: ' + radatetime.toLocaleString(), title: 'Reef Angel Controller' });
	}
	if (payload.indexOf("V:")!=-1)
	{
		currenttimeout.cancel( ourtimer );
		modal.hide();
		ons.notification.alert({message: payload.replace("V:", "Version: "), title: 'Reef Angel Controller' });
	}

	var oldsf=json.RA.SF;
	var oldaf=json.RA.AF;

if (payload.match(/T\d:.*/g) || payload.indexOf("SAL:") != -1 || payload.indexOf("CO2HUM:") != -1) {
    UpdateCloudParam(message, 10, 1);
}
	else if (payload.match(/PHE?:.*/g))
		UpdateCloudParam(message, 100, 2);
	else
		UpdateCloudParam(message, 1, 0);

	if (payload.match(/R(ON|OFF)?\d?:.*/g))
	{
		CheckRelay(relayscope);
	}
	if (payload.match(/EM\d:.*/g))
	{
		CheckExpansion(parametersscope);
	}

// For AF changes
if (payload.indexOf("AF:") != -1) {
    CheckFlags(parametersscope);
    checkAndNotifyAFChanges(oldaf, json.RA.AF);
}

// For SF changes
if (payload.indexOf("SF:") != -1) {
    CheckFlags(parametersscope);
    setModeLabel();
    checkAndNotifySFChanges(oldsf, json.RA.SF);
}

	if (payload.match(/DC[MSD]:.*/g))
	{
		parametersscope.dcm = rfmodes[parseInt(json.RA.DCM)];
		parametersscope.dcmodecolor = rfmodecolors[parseInt(json.RA.DCM)];
		parametersscope.dcimage = rfimages[parseInt(json.RA.RFM)];
	}
	if (payload.match(/PWM.+O:.*/g))
	{
		CheckDimmingOverride(parametersscope);
	}

	if (payload.match(/RF[MSD]:.*/g))
	{
		parametersscope.rfm = rfmodes[parseInt(json.RA.RFM)];
		parametersscope.rfmodecolor = rfmodecolors[parseInt(json.RA.RFM)];
		parametersscope.rfimage = rfimages[parseInt(json.RA.RFM)];
	}
	if (payload.match(/RF.+O:.*/g))
	{
		CheckRadionOverride(parametersscope);
	}
	if (payload.indexOf("IO:")!=-1)
	{
		CheckIO(parametersscope);
	}
	if (payload.match(/C\d:.*/g))
	{
		CheckCvar(parametersscope);
	}
	if (json.RA.T4!== undefined && json.RA.T5!== undefined && json.RA.T6!== undefined)
	{
		if (json.RA.T4!=0 || json.RA.T5!=0 || json.RA.T6!=0)
			parametersscope.extratempenabled=true;
	}
	if (payload.indexOf("MR")!=-1)
	{
		memoryraw+=payload.substr(5, payload.length-7);
		memoryraw = memoryraw.split(" ").join("");
		//console.log(memoryraw);
	}
if (payload.indexOf("CAL") !== -1) {
    var parts = payload.split(":");
    // Check if there are at least two parts (meaning at least one calibration value is present)
    if (parts.length >= 2) {
        var calValue1 = parts[1]; // This will be the calibration value in both cases
        json.RA.calValue1 = calValue1; // Save the first calibration value

        // If there are three parts, it means a second calibration value is also present
        if (parts.length === 3) {
            var calValue2 = parts[2];
            json.RA.calValue2 = calValue2; // Save the second calibration value
        }
    }
}
	currentstorage.json=json;
	currentstorage.jsonarray[currentstorage.activecontrollerid]=json;
	safeApply(parametersscope);
	safeApply(relayscope);
}; 

function UpdateCloudParam(message, division, decimal)
{
	var payload = message.payloadString;
	var id = payload.substring(0, payload.indexOf(":") + 1);
	var element = id.slice(0, -1).toLowerCase();
	//console.log("UpdateCloudParam(): updatestring=" + updatestring + ", payload=" + payload + ", id=" + id + ", element=" + element);
	parametersscope[element]=(payload.replace(id,"")/division).toFixed(decimal);
	json.RA[id.replace(":","")]=payload.replace(id,"");
	if (updatestring==id || updatestring.indexOf(id)!=-1)
	{
		updatestring="";
		currenttimeout.cancel(ourtimer);
		modal.hide();
		if (payload.match(/PWM.+O:.*/g))
			tabbar.loadPage('dimming.html');
		else if (payload.match(/RF.+O:.*/g) || payload.match(/RF[MSD]:.*/g))
			tabbar.loadPage('rf.html');
		else if (payload.match(/DC[MSD]:.*/g))
			tabbar.loadPage('dcpump.html');
		else if (payload.match(/C\d:.*/g))
			tabbar.loadPage('customvar.html');
		else if (payload.indexOf("MR21:")!=-1)
			internalmemoryrootscope.$broadcast('msg', 'memoryrawok');
		else if (id=="MBOK:" || id=="MIOK:")
		{
			internalmemoryscope.memoryresult+=": OK\n";
			internalmemoryscope.$apply();
			if (memindex<(MemString.length-1))
			{
				modal.show();
				memindex++;
				console.log(MemURL[memindex]);
				internalmemoryscope.memoryresult+=MemString[memindex];
				SaveMQTTMemory(MemURL[memindex]);
			}
		}
		else if (!payload.match(/R(ON|OFF)?\d?:.*/g))
			ons.notification.alert({message: 'Updated', title: 'Reef Angel Controller' });
	}
}

Number.prototype.padLeft = function(base,chr){
   var  len = (String(base || 10).length - String(this).length)+1;
   return len > 0? new Array(len).join(chr || '0')+this : this;
}

Number.prototype.pad = function(size) {
      var s = String(this);
      while (s.length < (size || 2)) {s = "0" + s;}
      return s;
    }

// Labels Tab
app.controller('labels', function($rootScope, $scope, $timeout, $localStorage, $http) {
	CheckExpansion($scope);
    
    CheckCvar($scope)
    $scope.$storage = $localStorage;
	$scope.controllers=$localStorage.controllers;
	labelsscope=$scope;
    $scope.star= (json.RA.BID ==4);
$scope.rem = (json.RA.REM);  // Assuming json.RA.REM is correctly defined earlier
$scope.relayVisibility = {}; // Ensure this object is initialized

// Function to update which relay boxes should be visible
$scope.updateRelayVisibility = function() {
    for (var i = 1; i <= 8; i++) {
        $scope.relayVisibility['r' + i] = !!($scope.rem & (1 << (i - 1)));
    }
};

    // Call the function on controller initialization
    $scope.updateRelayVisibility();
    

    
     $scope.labels = {
                       // Paramter Labels
                       t1n:'', t2n:'',t3n:'',t4n:'',t5n: '',t6n: '',phn: '',saln: '',orpn: '',wln: '',wl1n: '',wl2n: '',wl3n: '',wl4n: '',humn: '',parn: '',phenn: '', ozon: '',co2n:'',co2humn:'',
                      // Relay Labels
                      r1n: '',r2n: '',r3n: '',r4n: '',r5n: '',r6n: '',r7n: '',r8n: '',r11n: '',r12n: '',r13n: '',r14n: '',r15n: '',r16n: '',r17n: '',r18n: '',r21n: '',r22n: '',r23n: '',r24n: '',r25n: '',r26n: '',r27n: '',r28n: '',r31n: '',r32n: '',r33n: '',r34n: '',r35n: '',r36n: '',r37n: '',r38n: '',r41n: '',r42n: '',r43n: '',r44n: '',r45n: '',r46n: '',r47n: '',r48n: '',r51n: '',r52: '',r53n: '',r54n: '',r55n: '',r56n: '',r57n: '',r58n: '',r61n: '',r62n: '',r63n: '',r64n: '',r65n: '',r66n: '',r67n: '',r68n: '',r71n: '',r72n: '',r73n: '',r74n: '',r75n: '',r76n: '',r77n: '',r78n: '',r81n: '',r82n: '',r83n: '',r84n: '',r85n: '',r86n: '',r87n: '',r8n: '',
                     // RF Labels
                      rfwn: '', rfrn: '', rfgn: '', rfbn: '', rfin: '', rfrbn: '',
                    //PWM Channels 
                      pwma1n: '',pwma2n: '',pwmd1n: '',pwmd2n: '',pwme0n: '',pwme1n: '',pwme2n: '',pwme3n: '',pwme4n: '',pwme5n: '',
                        //IO Channels
                    atolown: '', atohighn: '', alarmn: '', leakn: '', io0n: '', io1n: '', io2n: '', io3n: '', io4n: '', io5n: '', io6n: '',io7n: '',
                        //Custom Variables
                    c0n: '',c1n: '',c2n: '',c3n: '',c4n: '',c5n: '',c6n: '',c7n: '',
                       //aqua illumination channels
                   aiwn: '', aibn:'', airbn:'',
				    //User Variables
					uv1n:'', uv2n:'', uv3n:'', uv5n:'', uv6n:'', uv7n:'', uv8n:''     
				};
    
$scope.loadsavedLabels = function() {
    var savedLabels = $localStorage.jsonlabels;
    
    if (savedLabels && typeof savedLabels === 'object') {
        if (savedLabels.RA && typeof savedLabels.RA === 'object') {
            Object.keys(savedLabels.RA).forEach(function(key) {
                var labelKey = key.toLowerCase();
                if ($scope.labels && $scope.labels.hasOwnProperty(labelKey)) {
                    $scope.labels[labelKey] = savedLabels.RA[key];
                } 
            });
           
        } 
    } 
};

// Ensure labels object is initialized
$scope.labels = $scope.labels || {};

// Call the function
$scope.loadsavedLabels();
    

    
   
    //notbeing used.
     // Default labels
    $scope.defaultLabels = {
        t1n: "Temp 1", t2n: "Temp 2", t3n: "Temp 3", t4n: "Temp 4", t5n: "Temp 5", t6n: "Temp 6",
        phn: "pH", saln: "Salinity", orpn: "ORP", wln: "Water Level", wl1n: "Water Level 1", wl2n: "Water Level 2", wl3n: "Water Level 3", wl4n: "Water Level 4",
        humn: "Humidity", parn: "PAR", phenn: "pH Expansion",
        rfwn: "White Channel", rfrbn: "Royal Blue Channel", rfrn: "Red Channel", rfgn: "Green Channel", rfbn: "Blue Channel", rfin: "Intensity Channel",
        pwma1n: "Actinic Channel", pwma2n: "Actinic Channel 2", pwmd1n: "Daylight Channel", pwmd2n: "Daylight 2",
        pwme0n: "Dimming Channel 0", pwme1n: "Dimming Channel 1", pwme2n: "Dimming Channel 2", pwme3n: "Dimming  3", pwme4n: "Dimming  4", pwme5n: "Dimming Channel 5",
        atolown: "ATO Low", atohighn: "ATO High", alarmn: "Alarm", leakn: "Leak",
        io0n: "I/O Channel 0", io1n: "I/O Channel 1", io2n: "I/O Channel 2", io3n: "I/O Channel 3", io4n: "I/O Channel 4", io5n: "I/O Channel 5",io6n: "I/O Channel 6",io7n: "I/O Channel 7",
        c0n: "Custom Var 0", c1n: "Custom Var 1", c2n: "Custom Var 2", c3n: "Custom Var 3", c4n: "Custom Var 4", c5n: "Custom Var 5", c6n: "Custom Var 6", c7n: "Custom Var 7"
    };

    // Initialize relay labels
    for (var a = 1; a <= 8; a++) {
        $scope.defaultLabels["r" + a + "n"] = "Relay " + a;
        for (var b = 1; b <= 8; b++) {
            $scope.defaultLabels["r" + a + b + "n"] = "Relay " + a + " Port " + b;
        }
    }
//default labels not used
   
    $scope.toggleGroup = function(group){
		if ($scope.isGroupShown(group))
			$scope.shownGroup = null;
		else
			$scope.shownGroup = group;
	};

	$scope.isGroupShown = function(group) {
		return $scope.shownGroup === group;
	};

$scope.setDefaultLabels = function() {
 //       console.log("resetAndSaveLabels function called");
    // Deep copy default labels to $scope.labels
    $scope.labels = $scope.defaultLabels;

    // Save labels
    $scope.saveLabels();
};
    
     $scope.resetLabels = function() {
        // Clear specific local storage item
    
    // If using $localStorage service
    delete $scope.$storage['jsonlabels'];

    // Optionally, to ensure changes are synchronized
    $localStorage.$apply();
       ons.notification.alert({message: 'Please refresh the page to see updated labels!', title: 'Reef Angel Controller'});
         
    };
    var controllers = JSON.parse(localStorage.getItem('ngStorage-controllers')); // Parse the JSON data
var activeControllerId = localStorage.getItem('ngStorage-activecontrollerid');

// Check if the controllers array exists and has at least one item
if (controllers && controllers.length > 0 && activeControllerId !== null) {
    // Assuming that activeControllerId is a valid index
    var selectedController = controllers[activeControllerId];

    // Check if 'cloudusername' exists, and if not, use 'username'
    var idToSend = selectedController.cloudusername || selectedController.username;
};
    //save RA Labels into DB
$scope.saveLabels = function() {
    var requestData = {
        raId: idToSend, 
        labels: {}
    };

    for (var key in $scope.labels) {
        if ($scope.labels.hasOwnProperty(key) && $scope.labels[key].trim() !== '') {
            requestData.labels[key] = $scope.labels[key];
        }
    }

    // Update local storage first

    $http.post('https://forum.reefangel.com/labels', requestData)
        .then(function(response) {
            ons.notification.alert({message: 'Labels Saved Successfully!', title: 'Reef Angel Controller'});
            // Ensure the UI is updated with the saved labels
            $scope.getportallabels();
            $scope.loadsavedLabels();
        }, function(error) {
            ons.notification.alert({message: 'Error Processing Request!', title: 'Reef Angel Controller'});
        });
};
    
    
$scope.loadlabelstab=function(){
    // Load the labels page
    tabbar.loadPage('labels.html');
}
$scope.loademailstab=function(){
    // Load the email alerts page
    tabbar.loadPage('emailalerts.html');
}


	$scope.loadcontrollertab=function(){
		editcontrollerid=null;
		tabbar.loadPage('settings.html');
	}

	$scope.loadinternalmemorytab=function(){
		tabbar.loadPage('internalmemory.html');
		$scope.getcontrollerdata('mr');
	}

	$scope.addcontroller=function(){
		tabbar.loadPage('addcontroller.html');
	}
    

	$scope.editcontroller=function(id){
		editcontrollerid=id;
		tabbar.loadPage('addcontroller.html');
	}

});

app.controller('emailalerts', function($rootScope, $scope, $localStorage, $http, $timeout) {
    // Initialize scope variables, functions, etc.
    $scope.$storage = $localStorage;
    $scope.controllers = $localStorage.controllers;
    emailalertsscope = $scope;

    // Initialize dialogs
    $scope.paramDialog = null;
    $scope.conditionDialog = null;
    $scope.isLoading = true;
    // Parameters list
   $scope.parameters = [
    { value: "1", label: "Temperature 1" },
    { value: "2", label: "Temperature 2" },
    { value: "3", label: "Temperature 3" },
    { value: "119", label: "Temperature 4" },
    { value: "120", label: "Temperature 5" },
    { value: "121", label: "Temperature 6" },   
    { value: "4", label: "pH" },
    { value: "5", label: "Salinity" },
    { value: "6", label: "ORP" },
    { value: "7", label: "ATO High Port" },
    { value: "8", label: "ATO Low Port" },  
    { value: "96", label: "Alarm Port" },    
       
    { value: "9", label: "Actinic Dimming" },
    { value: "10", label: "Daylight Dimming" },
    { value: "97", label: "Actinic2 Dimming" },
    { value: "98", label: "Daylight2 Dimming" },    
     //Dimming Expansion
    { value: "38", label: "Dimming Expansion Channel 0" },
    { value: "39", label: "Dimming Expansion Channel 1" },
    { value: "40", label: "Dimming Expansion Channel 2" },
    { value: "41", label: "Dimming Expansion Channel 3" },
    { value: "42", label: "Dimming Expansion Channel 4" },
    { value: "43", label: "Dimming Expansion Channel 5" },
    
    { value: "44", label: "AquaIllumination White Channel" },
    { value: "45", label: "AquaIllumination Blue Channel" },
    { value: "46", label: "AquaIllumination Royal Blue Channel" },
       //dcpump mode and settings
    { value: "47", label: "Vortech Mode" },
    { value: "48", label: "Vortech Speed" },
    { value: "49", label: "Vortech Duration" },
       
    { value: "50", label: "Radion White Channel" }, 
    { value: "51", label: "Radion Royal Blue Channel" },  
    { value: "52", label: "Radion Red Channel" },    
    { value: "53", label: "Radion Green Channel" }, 
    { value: "54", label: "Radion Blue Channel" }, 
    { value: "55", label: "Radion Intensity Channel" }, 
       //other expansion
    { value: "65", label: "pH Expansion" },
    { value: "67", label: "Humidity" }, 
    { value: "102", label: "PAR" },
    { value: "122", label: "Ozone"},
    { value: "123", label: "Co2 "},
    { value: "124", label: "Co2-Humidity"},
           //IO Expansion
    { value: "1077", label: "IO Channel 0" },   
    { value: "1078", label: "IO Channel 1" },  
    { value: "1079", label: "IO Channel 2" },  
    { value: "1080", label: "IO Channel 3" },  
    { value: "1081", label: "IO Channel 4" },  
    { value: "1082", label: "IO Channel 5" },
    { value: "1083", label: "IO Channel 6" },
    { value: "1084", label: "IO Channel 7" },
       //Custom variables
    { value: "57", label: "Custom Variable 0" },
    { value: "58", label: "Custom Variable 1" },
    { value: "59", label: "Custom Variable 2" },
    { value: "60", label: "Custom Variable 3" },
    { value: "61", label: "Custom Variable 4" },
    { value: "62", label: "Custom Variable 5" },
    { value: "63", label: "Custom Variable 6" },
    { value: "64", label: "Custom Variable 7" },
       // Water level Expansion
    { value: "66", label: "Water Level Channel 0" },  
    { value: "72", label: "Water Level Channel 1" },
    { value: "73", label: "Water Level Channel 2" },
    { value: "74", label: "Water Level Channel 3" },
    { value: "75", label: "Water Level Channel 4" },   
       
    //Flags
    { value: "1076", label: "Leak Flag" },
    { value: "1074", label: "Overheat Flag" },
    { value: "1073", label: "ATO Timeout Flag" },
    { value: "1075", label: "Bus Lock Flag" },
       //Relay Ports
    {value: "1001", label: "Main Relay Port1"},
    {value: "1002", label: "Main Relay Port2"},
    {value: "1003", label: "Main Relay Port3"},
    {value: "1004", label: "Main Relay Port4"},
    {value: "1005", label: "Main Relay Port5"},
    {value: "1006", label: "Main Relay Port6"},
    {value: "1007", label: "Main Relay Port7"},
    {value: "1008", label: "Main Relay Port8"},
       //Universal Relay 1
    {value: "1009", label: "Expansion Relay 1 Port1"},
    {value: "1010", label: "Expansion Relay 1 Port2"}, 
    {value: "1011", label: "Expansion Relay 1 Port3"}, 
    {value: "1012", label: "Expansion Relay 1 Port4"}, 
    {value: "1013", label: "Expansion Relay 1 Port5"}, 
    {value: "1014", label: "Expansion Relay 1 Port6"}, 
    {value: "1015", label: "Expansion Relay 1 Port7"},
    {value: "1016", label: "Expansion Relay 1 Port8"},
       //Universal Relay 2
    {value: "1017", label: "Expansion Relay 2 Port1"},
    {value: "1018", label: "Expansion Relay 2 Port2"},
    {value: "1019", label: "Expansion Relay 2 Port3"},
    {value: "1020", label: "Expansion Relay 2 Port4"},
    {value: "1021", label: "Expansion Relay 2 Port5"},
    {value: "1022", label: "Expansion Relay 2 Port6"},
    {value: "1023", label: "Expansion Relay 2 Port7"},
    {value: "1024", label: "Expansion Relay 2 Port8"},
       //Univeral Relay 3
    {value: "1025", label: "Expansion Relay 3 Port1"},   
    {value: "1026", label: "Expansion Relay 3 Port2"},
    {value: "1027", label: "Expansion Relay 3 Port3"},
    {value: "1028", label: "Expansion Relay 3 Port4"},
    {value: "1029", label: "Expansion Relay 3 Port5"},
    {value: "1030", label: "Expansion Relay 3 Port6"},
    {value: "1031", label: "Expansion Relay 3 Port7"},
    {value: "1032", label: "Expansion Relay 3 Port8"},   
       //Universal Relay 4
    {value: "1033", label: "Expansion Relay 4 Port1"},
    {value: "1034", label: "Expansion Relay 4 Port2"},
    {value: "1035", label: "Expansion Relay 4 Port3"},
    {value: "1036", label: "Expansion Relay 4 Port4"},
    {value: "1037", label: "Expansion Relay 4 Port5"},
    {value: "1038", label: "Expansion Relay 4 Port6"},
    {value: "1039", label: "Expansion Relay 4 Port7"},
    {value: "1040", label: "Expansion Relay 4 Port8"},
       //Universal Relay 5
    {value: "1041", label: "Expansion Relay 5 Port1"},
    {value: "1042", label: "Expansion Relay 5 Port2"},  
    {value: "1043", label: "Expansion Relay 5 Port3"},  
    {value: "1044", label: "Expansion Relay 5 Port4"},  
    {value: "1045", label: "Expansion Relay 5 Port5"},  
    {value: "1046", label: "Expansion Relay 5 Port6"},  
    {value: "1047", label: "Expansion Relay 5 Port7"},  
    {value: "1048", label: "Expansion Relay 5 Port8"},
       //Universal Relay 6
    {value: "1049", label: "Expansion Relay 6 Port1"},
    {value: "1050", label: "Expansion Relay 6 Port2"},
    {value: "1051", label: "Expansion Relay 6 Port3"},
    {value: "1052", label: "Expansion Relay 6 Port4"},
    {value: "1053", label: "Expansion Relay 6 Port5"},
    {value: "1054", label: "Expansion Relay 6 Port6"},
    {value: "1055", label: "Expansion Relay 6 Port7"},
    {value: "1056", label: "Expansion Relay 6 Port8"},
       //Universal Relay 7
    {value: "1057", label: "Expansion Relay 7 Port1"},
    {value: "1058", label: "Expansion Relay 7 Port2"},
    {value: "1059", label: "Expansion Relay 7 Port3"},
    {value: "1060", label: "Expansion Relay 7 Port4"},
    {value: "1061", label: "Expansion Relay 7 Port5"},
    {value: "1062", label: "Expansion Relay 7 Port6"},
    {value: "1063", label: "Expansion Relay 7 Port7"},
    {value: "1064", label: "Expansion Relay 7 Port8"},   
       //Universal Relay 8
    {value: "1065", label: "Expansion Relay 8 Port1"},
    {value: "1066", label: "Expansion Relay 8 Port2"},
    {value: "1067", label: "Expansion Relay 8 Port3"},
    {value: "1068", label: "Expansion Relay 8 Port4"},
    {value: "1069", label: "Expansion Relay 8 Port5"},
    {value: "1070", label: "Expansion Relay 8 Port6"},
    {value: "1071", label: "Expansion Relay 8 Port7"},
    {value: "1072", label: "Expansion Relay 8 Port8"},   
];




    // Show Parameter Dialog
    $scope.showDialog = function() {
        ons.createDialog('paramDialog.html', { parentScope: $scope }).then(function(dialog) {
            $scope.paramDialog = dialog;
            dialog.show();
        });
    };

    // Select Parameter
    $scope.selectParameter = function(param) {
        $scope.alert.parameter = param.value;
        $scope.alert.parameterlabel = param.label;
        updateAlertValue();
        if ($scope.paramDialog) {
            $scope.paramDialog.hide();
        }
    };

    // Conditions list
    $scope.conditions = [
        { value: "3", label: "Equal to =" },
        { value: "2", label: "Less than or equal to <=" },
        { value: "1", label: "Greater than or equal to >=" },
        { value: "4", label: "Greater than >" },
        { value: "5", label: "Less than <" },
        { value: "6", label: "Off" },
        { value: "7", label: "On" }
    ];

    // Show Condition Dialog
    $scope.showConditionDialog = function() {
        ons.createDialog('conditionDialog.html', { controller: 'emailalerts', parentScope: $scope }).then(function(dialog) {
            $scope.conditionDialog = dialog;
            dialog.show();
        });
    };

    // Select Condition
    $scope.selectCondition = function(condition) {
        $scope.alert.condition = condition.value;
        $scope.alert.conditionlabel = condition.label;
        updateAlertValue();
        if ($scope.conditionDialog) {
            $scope.conditionDialog.hide();
        }
    };
    
function updateAlertValue() {
    $scope.alert.value = ($scope.alert.conditionlabel === 'On') ? 1 : 0;
}
    
     $scope.disableValue = function() {
    return $scope.alert.conditionlabel === 'On' || $scope.alert.conditionlabel === 'Off';
};
var controllers = JSON.parse(localStorage.getItem('ngStorage-controllers')); // Parse the JSON data
var activeControllerId = localStorage.getItem('ngStorage-activecontrollerid');

// Check if the controllers array exists and has at least one item
if (controllers && controllers.length > 0 && activeControllerId !== null) {
    // Assuming that activeControllerId is a valid index
    var selectedController = controllers[activeControllerId];

    // Check if 'cloudusername' exists, and if not, use 'username'
    var idToSend = selectedController.cloudusername || selectedController.username;
};
    // Initialize your alert model
$scope.alert = {
    reefangelid: idToSend,
    emailaddress: '',
    name: '',
    parameter: '',
    condition: '',
    interval:'',
    value: '',
    description: '',
    notificationType: '' // Default to email notifications
};

$scope.editAlert = function(alert) {
    $scope.alert = {
        reefangelid: idToSend,  // make sure `idToSend` is defined in your scope or passed correctly
        name: alert.AlertName,
        parameter: alert.ParameterID,
        parameterlabel: alert.ParameterName,
        condition: alert.ConditionID,
        conditionlabel: alert.ConditionSymbol,
        interval: alert.AlertInterval,
        value: alert.Value,
        description: alert.AlertDescription,
        alertid: alert.AlertID
    };

    // Using $timeout to ensure DOM is updated
    $timeout(function() {
        document.getElementById('top').scrollIntoView();
    }, 0); // 0 ms delay to allow scope digestion
};

    


// Utility function for converting the URL-safe base64 string to a Uint8Array

    // Function to add an alert
$scope.addAlert = function() {
    modal.show();
    var userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    $scope.alert.timezone = userTimeZone;

    // Create a new object to hold only non-null and non-empty values
var requestData = {};
for (var key in $scope.alert) {
    if ($scope.alert.hasOwnProperty(key) && $scope.alert[key] !== null && $scope.alert[key] !== undefined && $scope.alert[key] !== '') {
        requestData[key] = $scope.alert[key];
    }
}

    if (requestData.alertid) {
        // If the alert has an ID, it means we're editing an existing alert
        $http.post('https://forum.reefangel.com/emailalerts/add', requestData)
            .then(function(response) {
    // Handle success
    let successmessage = 'Alert Updated Successfully';
    if (response.status === 200 && response.data && response.data.message) {
        successmessage = response.data.message;
    }
    $scope.loadAlerts(function() {
        modal.hide();
        ons.notification.alert({
            message: successmessage,
            title: 'Reef Angel Controller'
        });
    });
            }, function(error) {
                modal.hide();
                let errorMessage = 'Error updating your alert'; // Default error message
                let errorTitle = 'Reef Angel Controller'; // Default error title

                if (error.status === 400 && error.data && error.data.message) {
                    // If there is a specific error message from the server, use it
                    errorMessage = error.data.message;
                } else if (error.status === 500) {
                    // Specific message for server errors
                    errorMessage = 'Server error while updating your alert';
                }

                // Display the error notification with the specific or default message
                ons.notification.alert({
                    message: errorMessage,
                    title: 'Reef Angel Controller'
                });
            });
    } else {
        // If the alert doesn't have an ID, it means we're adding a new alert
        $http.post('https://forum.reefangel.com/emailalerts/add', requestData)
           .then(function(response) {
    // Handle success
    let successmessage = 'Alert Updated Successfully';
    if (response.status === 200 && response.data && response.data.message) {
        successmessage = response.data.message;
    }
    $scope.loadAlerts(function() {
        modal.hide();
        ons.notification.alert({
            message: successmessage,
            title: 'Reef Angel Controller'
        });
    });
            }, function(error) {
                modal.hide();
                let errorMessage = 'Error Saving your alert'; // Default error message
                let errorTitle = 'Reef Angel Controller'; // Default error title

                if (error.status === 400 && error.data && error.data.message) {
                    // If there is a specific error message from the server, use it
                    errorMessage = error.data.message;
                } else if (error.status === 500) {
                    // Specific message for server errors
                    errorMessage = 'Server error while saving your alert';
                }

                // Display the error notification with the specific or default message
                ons.notification.alert({
                    message: errorMessage,
                    title: errorTitle
                });
            });
    }
};

$scope.loadAlerts = function(callback) {
    modal.show();
    $http.get('https://forum.reefangel.com/emailalerts/' + idToSend).then(function(response) {
        $scope.emailAddress = response.data.EmailAddress;
        $scope.alerts = response.data.Alerts;
         $scope.lastDataLogTime = response.data.LastDataLogTime ? new Date(response.data.LastDataLogTime) : null;
         
        // Set the toggle based on the ConnectionAlertEnabled value
        // Set the toggle based on the ConnectionAlertEnabled value from the server
        $scope.noDataAlertEnabled = response.data.ConnectionAlertEnabled === 1;
        // Also set the original state
        $scope.originalAlertEnabled = $scope.noDataAlertEnabled;
        // Initialize variables to store the latest alert details
        $scope.alert.notificationType = response.data.NotificationType || 'push';
        let latestAlert = null;
        let latestTime = new Date(0); // Set to the earliest date possible

        $scope.alerts.forEach(alert => {
            if (alert.AlertSentTime) { // Check if AlertSentTime is not null
                let alertTime = new Date(alert.AlertSentTime);
                if (alertTime > latestTime) {
                    latestTime = alertTime;
                    latestAlert = alert;
                }
            }
        });

        if (latestAlert) {
            $scope.latestAlertName = latestAlert.AlertName;
            $scope.latestAlertTime = latestTime;
        }
        modal.hide();
        if (callback && typeof callback === 'function') {
            callback();
        }
    }, function(error) {
        modal.hide();
        // console.error('Error fetching alerts:', error);
    });
};
    
$scope.checkNotificationPermission = function() {
    if ($scope.alert.notificationType === 'push') {
        if (Notification.permission === 'denied') {
            ons.notification.alert({
                message: 'Notifications are blocked, please enable them in your settings!',
                title: 'Reef Angel Controller'
            });
            return;
        }

        if (Notification.permission === 'default') {
            // Ask for permission
            Notification.requestPermission().then(function(permission) {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                    // Automatically subscribe them to push notifications
                    initiatePushSubscription(); // This should handle the subscription logic
                } else {
                    ons.notification.alert({
                message: 'Notifications are blocked, please enable them in your settings!',
                title: 'Reef Angel Controller'
            });
                    // Optionally, revert the selection
                    $scope.alert.notificationType = 'email';
                    
                }
            });
        }
    }
};



$scope.loadAlerts();
    
    $scope.deleteAlert = function(alertID) {
    // Send both the logged-in user's ReefAngelID and the alertID
    const requestData = {
        reefAngelID: idToSend,
        alertID: alertID
    };

    // Call the server to delete the alert
$http.delete('https://forum.reefangel.com/emailalerts/delete/' + alertID + '/' + idToSend)
    .then(function(response) {
        // Handle success, remove alert from the list
        $scope.alerts = $scope.alerts.filter(function(alert) {
            return alert.AlertID !== alertID;
        });
        ons.notification.alert({ message: 'Alert deleted Successfully!', title: 'Reef Angel Controller' });
    })
    .catch(function(error) {
        // Handle error
        ons.notification.alert({ message: 'Error deleting your alert', title: 'Reef Angel Controller' });
    });
};
    
    
    
    
    
$scope.onNoDataAlertToggle = function() {
    // Proceed only if the state has actually changed
    if ($scope.noDataAlertEnabled !== $scope.originalAlertEnabled) {
        $scope.noDataAlert($scope.noDataAlertEnabled ? 1 : 0);
    }
};



$scope.noDataAlert = function(value) {
    const noDataAlert = {
        reefangelid: idToSend,
        value: value
    };

    $http.post('https://forum.reefangel.com/emailalerts/noDataAlert', noDataAlert)
        .then(function(response) {
            $scope.loadAlerts();
            // Update the original state to the new state
            $scope.originalAlertEnabled = $scope.noDataAlertEnabled;
        }, function(error) {
            let errorMessage;
            if (error.status === 404) {
                errorMessage = 'User not found or email not set. Please set email first.';
            } else if (error.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            } else {
                let action = value === 1 ? 'enabling' : 'disabling';
                errorMessage = 'Error ' + action + ' the alert';
            }

            ons.notification.alert({ 
                message: errorMessage, 
                title: 'Reef Angel Controller' 
            });

            // Reset the toggle to its original state in case of error
            $scope.noDataAlertEnabled = $scope.originalAlertEnabled;
        });
};
    
    
    $scope.loademailstab=function(){
    // Load the email alerts page
        tabbar.loadPage('emailalerts.html');
    }
    
    $scope.loadlabelstab=function(){
    // Load the labels page
         tabbar.loadPage('labels.html');
    }

	$scope.loadcontrollertab=function(){
		editcontrollerid=null;
		tabbar.loadPage('settings.html');
	}

	$scope.loadinternalmemorytab=function(){
		tabbar.loadPage('internalmemory.html');
		$scope.getcontrollerdata('mr');
	}

	$scope.addcontroller=function(){
		tabbar.loadPage('addcontroller.html');
	}
    

	$scope.editcontroller=function(id){
		editcontrollerid=id;
		tabbar.loadPage('addcontroller.html');
	}
});

function createRelayChart($scope, container, relayId) {
    const mainContainer = $("#" + container);
    mainContainer.empty(); // Clear any existing content
    mainContainer.css("height", ($(window).height() - 15) + "px");
    mainContainer.css("margin-top", "-95px"); // Move container down by 50px

    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });
modal.show();
    var labelsData = localStorage.getItem('ngStorage-jsonlabels');
    var labelMap = {};

    if (labelsData) {
        var storageData = JSON.parse(labelsData); // Parsing the storage data
        var customLabels = storageData.RA; // Accessing the RA object

        // Loop through the ports for the specified relayId
        for (var portNumber = 1; portNumber <= 8; portNumber++) {
            var key = (relayId + portNumber + 'N').toUpperCase(); // Use relayId to construct the key

            // Check and assign labels for the specified relay
            if (customLabels.hasOwnProperty(key)) {
                labelMap[relayId + portNumber + 'n'] = customLabels[key]; // Store with original key format
            } else {
                labelMap[relayId + portNumber + 'n'] = 'Port ' + portNumber; // Assign "Port X" as default
            }
        }
    } else {
        // Assign "Port X" as default labels if custom labels are not available
        for (var portNumber = 1; portNumber <= 8; portNumber++) {
            labelMap[relayId + portNumber + 'n'] = 'Port ' + portNumber;
        }
    }

    var url = `https://forum.reefangel.com/chartdata?reefangelid=${json.RA.ID}&parameter=${relayId}`;

    $.getJSON(url, function(data) {
        var seriesData = Array.from({ length: 8 }, () => []);

        data.forEach(function(point) {
            var timestamp = point[0]; // Timestamp
            var bitmask = point[1]; // Bitmask as an integer
            var binaryString = bitmask.toString(2).padStart(8, '0'); // Convert to binary and pad to 8 bits

            // Create a data point for each bit in the binary string
            binaryString.split('').reverse().forEach(function(bit, index) {
                var bitValue = parseInt(bit, 2);
                seriesData[index].push([timestamp, bitValue]); // Push as [x, y] pair
            });
        });

        // Update relaySeriesData with the correct port labels from labelMap
        var relaySeriesData = seriesData.map(function(data, index) {
            return {
                name: labelMap[relayId + (index + 1) + 'n'] || 'Port ' + (index + 1),
                data: data,
                marker: {
                    enabled: false,
                    radius: 4, // Adjust as needed
                },
                lineWidth: 3, // Adjust as needed
            };
        });

        // Call drawIndividualChart for each series
        relaySeriesData.forEach((series, index) => {
            drawIndividualChart(mainContainer, series, relayId, index);
        });
    });
}

function drawIndividualChart(container, series, relayId, index) {
    const chartId = `chart_${relayId}_${index}`;
    const chartDiv = $('<div>').attr('id', chartId).css('height', '250px').appendTo(container);
   const colors = [
        '#7cb5ec', // Light blue
        '#434348', // Gray
        '#90ed7d', // Light green
        '#f7a35c', // Orange
        '#8085e9', // Lavender
        '#f15c80', // Pink
        '#e4d354', // Yellow
        '#2b908f', // Teal
        '#f45b5b', // Red
        '#91e8e1'  // Light teal
    ];
     
    Highcharts.stockChart(chartId, {
        chart: {
            type: 'area',
            zoomType: 'x' // Enable zooming along the x-axis
        },
    
        title: {
            text: `${series.name}`
        },
        colors: [colors[index % colors.length]], // Use modulo to cycle through colors if more ports than colors
        rangeSelector: {
            enabled: true,
            inputEnabled: true,
            inputDateFormat: '%Y-%m-%d %H:%M:%S', // Includes time in the input format
            inputEditDateFormat: '%Y-%m-%d %H:%M:%S', // Editable date format includes time
            verticalAlign: 'bottom',
            buttons: [{
                type: 'hour',
                count: 1,
                text: '1h'
            }, {
                type: 'hour',
                count: 12,
                text: '12h'
            }, {
                type: 'day',
                count: 1,
                text: '1d'
            }, {
                type: 'day',
                count: 3,
                text: '3d'
            }, {
                type: 'day',
                count: 7,
                text: '7d'
            }, {
                type: 'all',
                text: '30d'
            }],
             // Default to the "3 days" button

            selected: 3
        },

 xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: { day: '%e %b %Y' }
    },
      yAxis: {
            title: {text: 'Status'},
            min: 0,
            max: 1,
            tickInterval: 1,
          showLastLabel: true,
            labels: {
                formatter: function() {
                    if (this.value === 1) {
                        return 'On';
                    } else if (this.value === 0) {
                        return 'Off';
                    }
                    return '';
                }
            },
            opposite: false
        },
        tooltip: {
            xDateFormat: '%A, %b %e, %Y %H:%M:%S'
        },
        series: [{
            name: series.name,
            data: series.data,
            step: 'left',
            marker: {
                enabled: false,
                radius: 3
            },
            lineWidth: 3,
            dataGrouping: {
                enabled: false
            }
        }]
    });
    modal.hide();
}

app.controller('DashboardSettings', ['$scope', '$localStorage', function($scope, $localStorage) {
    $scope.currentTab = 'parameters';
 CheckExpansion($scope);
    $scope.star= (json.RA.BID ==4);
    // Function to change tab
    $scope.changeTab = function(tabName) {
        $scope.currentTab = tabName;
    };
        $scope.dashboardVisibility = $localStorage.dashboardVisibility;


    // Bind the visibility settings to the scope for use in the view
    $scope.dashboardVisibility = $localStorage.dashboardVisibility;

    // Function to toggle visibility
    $scope.toggleVisibility = function(parameter) {
        $scope.dashboardVisibility[parameter] = !$scope.dashboardVisibility[parameter];
    };
}]);

app.controller('userVariables', ['$scope', '$http', '$localStorage', '$timeout', '$rootScope', function($scope, $http, $localStorage, $timeout, $rootScope) {

var controllers = JSON.parse(localStorage.getItem('ngStorage-controllers')); // Parse the JSON data
var activeControllerId = localStorage.getItem('ngStorage-activecontrollerid');
$scope.username = null;
    $scope.fetchUsername = function() {
     var controllers = JSON.parse(localStorage.getItem('ngStorage-controllers'));
var activeControllerId = localStorage.getItem('ngStorage-activecontrollerid');
if (controllers && controllers.length > 0 && activeControllerId !== null) {
    var selectedController = controllers[activeControllerId];
    $scope.username = selectedController.cloudusername || selectedController.username;
} else {
  //  console.error('No active controller ID found or controllers data is missing.');
  
}
    }; 
$scope.fetchUsername();    
$scope.events = [];
var dialog; // Define dialog variable in the parent scope
    
// Function to check if the user is authenticated
function isLoggedIn() {
    // Check if the isAuthenticated flag is set to true in localStorage
    return $localStorage.isAuthenticated === true;
}

if (!$localStorage.userVariables) {
    $localStorage.userVariables = {
        uv1: '0',
        uv2: '0',
        uv3: '0',
        uv4: '0',
        uv5: '0',
        uv6: '0',
        uv7: '0',
        uv8: '0'
    };
}
$scope.userVariables = $localStorage.userVariables.userVariables;


$scope.dialogData = {
    currentVariableKey: null,
    currentVariableLabel: null,
    currentVariableValue: null,
    currentVisibility: null,
    addToCalendar: false // Initialize to false by default
};

// After successfully adding the event and closing the dialog
$scope.task = {
    dateTime: $scope.selectedDate, // Set the default date and time to the selected date
    title: '',
    description: '',
    daily: false,
    monthly: false,
    yearly: false,
    sendEmailReminder: false
};

    
$scope.showEventDetails = function(info) {
    // Use AngularJS's $timeout to ensure scope changes are processed
    $timeout(function() {
        ons.createDialog('eventDetails.html', { parentScope: $scope }).then(function(d) {
            dialog = d; // Assign dialog instance to the dialog variable
            
            // Get event start time
            var eventStartTime = new Date(info.event.start);
            
            // Check if event time is 12:00 AM (00:00)
            var eventTime;
            if (eventStartTime.getHours() === 0 && eventStartTime.getMinutes() === 0) {
                eventTime = 'All Day';
            } else {
                eventTime = eventStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            
            $scope.event = {
                eventTitle: info.event.title,
                eventDescription: info.event.extendedProps.description || 'No description',
                eventTime: eventTime,
                eventId: info.event.id // Pass the event ID to the dialog scope
            };
            dialog.show();
        }).catch(function(error) {
            console.error('Dialog creation failed:', error);
        });
    });
};



$scope.deleteEvent = function(eventId) {
    // Send a request to delete the event with the specified ID
    $http.delete(`https://forum.reefangel.com/deleteEvent/${$scope.username}/${eventId}`)
        .then(function(response) {
            ons.notification.alert({ message: 'Event deleted successfully!', title: 'Reef Angel Controller' });
            if (dialog) {
                dialog.hide(); // Close the dialog after successful deletion
            }$scope.fetchEvents();
        })
        .catch(function(error) {
            console.error('Error deleting event:', error);
            ons.notification.alert({ message: 'Failed to delete event!', title: 'Reef Angel Controller' });
        });
};

$scope.showTaskDialog = function(info) {
    if (!isLoggedIn()) {
        // User is not logged in, show an Onsen UI alert message
        ons.notification.alert({message: 'Please login to use this feature!', title: 'Reef Angel Controller'});
        return; // Exit the function to prevent further execution
    }

    // Get the selected date string
    var selectedDateStr = info.dateStr;

    // Convert the selected date string to a JavaScript Date object
    var selectedDate = new Date(selectedDateStr);

    // Adjust for the timezone offset
    var timezoneOffset = selectedDate.getTimezoneOffset();
    selectedDate.setMinutes(selectedDate.getMinutes() + timezoneOffset);

    // Assign the adjusted date to $scope.task.date
    $scope.task.date = selectedDate;

    ons.createDialog('taskdialog.html', { parentScope: $scope }).then(function(dialog) {
    //    console.log("Dialog created successfully");
        $scope.dialog = dialog;

        // Format the date and time for the datetime-local input
        var formattedDateTime = selectedDate.toISOString().slice(0, 16); // Format: yyyy-MM-ddTHH:mm

        // Parse the formatted date and time string into a JavaScript Date object
        $scope.task.dateTime = new Date(formattedDateTime);

        dialog.show();
    }).catch(function(error) {
        console.error('Dialog creation failed:', error);
    });
};





$scope.fullCalendarConfig = {
    headerToolbar: {
        left: 'prev,next',
        center: 'title',
        right: 'dayGridMonth,listWeek' // Only include month and week buttons
    },
    dateClick: function(info) {
        $scope.clickedDate = info.dateStr;
        // Assign the clicked date to selectedDate
        $scope.selectedDate = info.dateStr;
        $scope.showTaskDialog(info);
    },
    eventClick: function(info) {
        $timeout(function() {
            $scope.showEventDetails(info);
        });
    },
    timeZone: 'local',
    height: 'auto',
    
};


// Assuming $scope.task.dateTime is in local time
$scope.saveEvent = function() {
    var controllers = JSON.parse(localStorage.getItem('ngStorage-controllers'));
    var activeControllerId = localStorage.getItem('ngStorage-activecontrollerid');
    var username;

    // Check if the controllers array exists and has at least one item
    if (controllers && controllers.length > 0 && activeControllerId !== null) {
        // Assuming that activeControllerId is a valid index
        var selectedController = controllers[activeControllerId];

        // Check if 'cloudusername' exists, and if not, use 'username'
        username = selectedController ? (selectedController.cloudusername || selectedController.username) : null;
    } else {
        console.error('Controllers array is empty or activeControllerId is null.');
        return; // Exit function early if necessary data is not available
    }
    
    // Check if the user is logged in and if the event title is provided
    if (!$scope.task || !$scope.task.title || !$scope.task.dateTime) {
        //  console.error('Task title and date are required.');
        return;
    }

    // Determine the recurring value based on user selection
    var recurringValue = 0; // Default non-recurring
    if ($scope.task.daily) {
        recurringValue = 1;
    } else if ($scope.task.monthly) {
        recurringValue = 2;
    } else if ($scope.task.yearly) {
        recurringValue = 3;
    }

    // Check if more than one recurrence type is selected
    var selectedCount = ($scope.task.daily ? 1 : 0) + ($scope.task.monthly ? 1 : 0) + ($scope.task.yearly ? 1 : 0);
    if (selectedCount > 1) {
       ons.notification.alert({message: 'Only one reacurring option can be selected!', title: 'Reef Angel Controller'});
        return;
    }

    // Get the date and time values from the task object
    var dateTime = $scope.task.dateTime;

    // Construct the eventDateTime string
    var eventDateTime = new Date(dateTime);

    // Convert eventDateTime to ISO string format
    var eventDateTimeISO = eventDateTime.toISOString().slice(0, 19).replace('T', ' ');

    // Get the user's timezone
    var userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Prepare the eventData object with timezone information
    var eventData = {
        eventName: $scope.task.title,
        eventDateTime: eventDateTimeISO,
        eventDescription: $scope.task.description || "No description inputted",
        emailReminder: $scope.task.sendEmailReminder ? 1 : 0,
        recurring: recurringValue,
        timezone: userTimezone // Include the user's timezone
    };

    // Determine the endpoint URL using the username
    var postUrl = `https://forum.reefangel.com/calendarEvents/${username}`;

    // Send the POST request with the event data
   // console.log('Sending new event:', eventData);
    $http.post(postUrl, eventData)
    .then(function(response) {
        $scope.fetchEvents();
      //  console.log('Event Date and Time:', eventDateTime);
        ons.notification.alert({message: 'Event saved successfully!', title: 'Reef Angel Controller'});
        if ($scope.dialog) {
            $scope.dialog.hide();
        }
    }, function(error) {
        console.error('Error saving event:', error.data);
        ons.notification.alert({message: 'Failed to Save Event!', title: 'Reef Angel Controller'});
    });
};




//fetch teh events 
$scope.fetchEvents = function() {
    if ($scope.username) {
        modal.show();
        $http.get(`https://forum.reefangel.com/calendarEvents/${$scope.username}`)
            .then(function(response) {
            
                var eventsData = [];
                response.data.forEach(function(event) {
                 //   console.log('Event ID:', event.eventID);
                    // Parse event date and time
                    var eventDateTime = new Date(event.eventDateTime);

                    // Check if the time is midnight (12:00 AM)
                    var isAllDay = eventDateTime.getHours() === 0 && eventDateTime.getMinutes() === 0;

                    // Handle recurring events
                    if (event.recurring === 1) { // Daily
                        var startDate = eventDateTime;
                        var endDate = new Date(); // Set endDate to today's date
                        endDate.setDate(endDate.getDate() + 365); // Set endDate to one year from now (adjust as needed)
                        while (startDate <= endDate) { // Add events until startDate is less than or equal to endDate
                            eventsData.push({
                                title: event.eventName,
                                start: new Date(startDate), // Create a new Date object to avoid reference issues
                                end: new Date(startDate), // Same as start date for daily events
                                description: event.eventDescription,
                                allDay: isAllDay, // Set allDay property based on the time
                                id: event.eventID // Add eventID property
                            });
                            startDate.setDate(startDate.getDate() + 1); // Move to next day
                        }
                    } else if (event.recurring === 2) { // Monthly
                        var startDate = new Date(eventDateTime.getFullYear(), eventDateTime.getMonth(), eventDateTime.getDate());
                        var endDate = new Date(); // Set endDate to today's date
                        endDate.setFullYear(endDate.getFullYear() + 1); // Set endDate to one year from now (adjust as needed)
                        while (startDate <= endDate) { // Add events until startDate is less than or equal to endDate
                            eventsData.push({
                                title: event.eventName,
                                start: new Date(startDate), // Create a new Date object to avoid reference issues
                                end: new Date(startDate), // Same as start date for monthly events
                                description: event.eventDescription,
                                allDay: isAllDay, // Set allDay property based on the time
                                id: event.eventID
                            });
                            startDate.setMonth(startDate.getMonth() + 1); // Move to next month
                        }
                    } else if (event.recurring === 3) { // Yearly
                        var startDate = new Date(eventDateTime.getFullYear(), eventDateTime.getMonth(), eventDateTime.getDate());
                        var endDate = new Date(); // Set endDate to today's date
                        endDate.setFullYear(endDate.getFullYear() + 10); // Set endDate to 10 years from now (adjust as needed)
                        while (startDate <= endDate) { // Add events until startDate is less than or equal to endDate
                            eventsData.push({
                                title: event.eventName,
                                start: new Date(startDate), // Create a new Date object to avoid reference issues
                                end: new Date(startDate), // Same as start date for yearly events
                                description: event.eventDescription,
                                allDay: isAllDay, // Set allDay property based on the time
                                id: event.eventID
                            });
                            startDate.setFullYear(startDate.getFullYear() + 1); // Move to next year
                        }
                    } else { // Non-recurring event
                        eventsData.push({
                            title: event.eventName,
                            start: eventDateTime,
                            description: event.eventDescription,
                            allDay: isAllDay, // Set allDay property based on the time
                            id: event.eventID
                        });
                    }
                });
                $scope.fullCalendarConfig.events = eventsData;
                $scope.$broadcast('eventsUpdated');
            modal.hide();
            })
            .catch(function(error) {
            modal.hide();
                console.error('Error fetching events:', error);
            });
    }
};




$scope.fetchAndUpdateUserVariables = function() {
    if ($scope.username) {
        modal.show();
        $http.get(`https://forum.reefangel.com/rauv/get/${$scope.username}`) // The username is globally accessible.
            .then(function(response) {
                modal.hide();
                if (response.data.userVariables) {
                    var serverUserVariables = response.data.userVariables;

                    // Initialize local storage for user variables if it doesn't exist
                    if (!$localStorage.userVariables) {
                        $localStorage.userVariables = {};
                    }

                    // Update local storage with server values, defaulting to existing values if server provides null
                    for (let i = 1; i <= 8; i++) {
                        let uvKey = `uv${i}`;
                        $localStorage.userVariables[uvKey] = serverUserVariables[uvKey] !== undefined ? serverUserVariables[uvKey] : ($localStorage.userVariables[uvKey] || '0');
                    }

                    // Update $scope.userVariables to reflect the changes
                    $scope.userVariables = $localStorage.userVariables;
                } else {
                    // console.log('No user variables found in the response.');
                }
            }, function(error) {
                // console.error('Failed to fetch user variables:', error);
            });
    }
};


$scope.setuvarupdate = function() {
    // Retrieve username from localStorage or other source
    var controllers = JSON.parse(localStorage.getItem('ngStorage-controllers'));
    var activeControllerId = localStorage.getItem('ngStorage-activecontrollerid');
    var username;

    // Check if the controllers array exists and has at least one item
    if (controllers && controllers.length > 0 && activeControllerId !== null) {
        // Assuming that activeControllerId is a valid index
        var selectedController = controllers[activeControllerId];

        // Check if 'cloudusername' exists, and if not, use 'username'
        username = selectedController ? (selectedController.cloudusername || selectedController.username) : null;
    } else {
        console.error('Controllers array is empty or activeControllerId is null.');
        return; // Exit function early if necessary data is not available
    }

    // Construct the data object to be sent in the request body
    var dataToSend = {
        variables: {}  // Create an empty object for the variables
    };

    // Check if currentVariableValue is not null or undefined
    if ($scope.dialogData.currentVariableValue !== null && $scope.dialogData.currentVariableValue !== undefined) {
        // Add the currentVariableKey and currentVariableValue to the variables object
        dataToSend.variables[$scope.dialogData.currentVariableKey] = $scope.dialogData.currentVariableValue;
    } else {
        console.error('Invalid value for variable:', $scope.dialogData.currentVariableValue);
        return; // Exit function if the value is invalid
    }

    // Update dashboard visibility based on checkbox state
    if ($scope.dialogData.currentVisibility !== null && $scope.dialogData.currentVisibility !== undefined) {
        $localStorage.dashboardVisibility[$scope.dialogData.currentVariableKey] = $scope.dialogData.currentVisibility;
    } else {
        console.error('Invalid visibility value:', $scope.dialogData.currentVisibility);
        return; // Exit function if the visibility value is invalid
    }

    // Send the HTTP POST request with the updated data to update user variables
    $http.post(`https://forum.reefangel.com/rauv/${username}`, dataToSend)
        .then(function(response) {
            // Fetch user variables again to update the label or value
            $scope.fetchAndUpdateUserVariables(username);

            // Assuming the currentVariableLabel is the task title
            var eventName = $scope.dialogData.currentVariableLabel + ' Updated'; // Event title
            var eventDescription = 'Value of ' + $scope.dialogData.currentVariableLabel + ' changed to ' + $scope.dialogData.currentVariableValue; // Event description
            var today = new Date();
            var eventDateTimeISO = today.toISOString().slice(0, 19).replace('T', ' '); // Format: yyyy-MM-dd HH:mm:ss
            var eventData = {
                eventName: eventName,
                eventDateTime: eventDateTimeISO,
                eventDescription: eventDescription,
                emailReminder: 0, // Assuming email reminder is always disabled
                recurring: 0 // Set recurring value to 0
            };

            // Check if the calendar box is checked
            if ($scope.dialogData.addToCalendar) {
                // Send the POST request with the event data to add the event to the calendar
                return $http.post(`https://forum.reefangel.com/calendarEvents/${username}`, eventData)
                            .then(function(response) {
                                ons.notification.alert({message: 'Event saved successfully!', title: 'Reef Angel Controller'});
                            });
            } else {
                // If not checked, resolve immediately
                return Promise.resolve();
            }
        })
        .then(function() {
            // Hide the dialog
            if ($scope.dialog) {
                $scope.dialog.hide();
            }
        })
        .catch(function(error) {
            console.error('Error saving event:', error.data);
            ons.notification.alert({message: 'Failed to Save Event!', title: 'Reef Angel Controller'});
        });
};



$scope.showUpdateDialog = function(variableKey, variableLabel) {
    // Check if the user is authenticated
    if (isLoggedIn()) {
        // Set dialog data
        $scope.dialogData.currentVariableKey = variableKey;
        $scope.dialogData.currentVariableLabel = variableLabel;
        $scope.dialogData.currentVisibility = $localStorage.dashboardVisibility[variableKey];

        // Directly access the user variable value from $scope.userVariables
        if ($scope.userVariables && $scope.userVariables.hasOwnProperty(variableKey)) {
            // Access the value using the variableKey
            $scope.dialogData.currentVariableValue = $scope.userVariables[variableKey];
        } else {
       //     console.error('Variable not found for key:', variableKey);
            $scope.dialogData.currentVariableValue = 'N/A'; // Provide a default or fallback value
        }

        // Show the dialog and assign the dialog object to $scope.dialog
        ons.createDialog('uvdialog.html', { parentScope: $scope }).then(function(dialog) {
            $scope.dialog = dialog; // Assign the dialog object to $scope.dialog
            dialog.show();
        }).catch(function(error) {
         //   console.error('Dialog creation failed:', error);
        });
    } else {
        // Prompt the user to login if not authenticated
        ons.notification.alert({message: 'Please login to use this feature!', title: 'Reef Angel Controller'});
    }
};

$scope.hideDialog = function() {
   if ($scope.dialog) {
    $scope.dialog.hide();
 }

};
    
$scope.closeDialog = function() {
    if (dialog) {
       dialog.hide();
    }
}; 
    

$scope.fetchAndUpdateUserVariables();
$scope.fetchEvents();

}]);

app.directive('fullCalendar', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        scope: {
            config: '=' // Two-way binding for the configuration object
        },
        link: function(scope, element, attrs) {
            var calendar;

            function renderCalendar() {
                if(calendar) {
                    // Destroy the old instance before creating a new one
                    calendar.destroy();
                }
                // Initialize FullCalendar with the provided configuration
                calendar = new FullCalendar.Calendar(element[0], scope.config);
                calendar.render();
                // Set the calendar instance to the parent scope
                scope.$parent.calendar = calendar;
            }

            // Initial render
            $timeout(renderCalendar);

            // Re-render the calendar whenever the config object changes
            scope.$watch('config', function(newConfig) {
                if (newConfig) { // This check ensures that the newConfig object is not undefined/null
                    $timeout(renderCalendar);
                }
            }, true); // Deep watch the config object to detect changes in nested properties
        }
    };
}]);

app.controller('CalibrateController', ['$scope','$http', '$localStorage', '$timeout', '$rootScope', function($scope, $http, $localStorage, $timeout, $rootScope) {
    CheckExpansion($scope);
  // Set showStandardList to true by default
  $scope.showStandardList = true;
  $scope.showCustomList = false;

  $scope.toggleList = function(listType) {
    if (listType === 'standard') {
      $scope.showStandardList = !$scope.showStandardList;
      $scope.showCustomList = false;
    } else if (listType === 'custom') {
      $scope.showCustomList = !$scope.showCustomList;
      $scope.showStandardList = false;
    }
  };

//enables cloud calibrations for custom expansions   
if (json.RA.BID == 4)
{
$scope.customcal=true;

}
else
{
$scope.customcal=false;
}

$scope.instructions = {
  ph1:'Please place the probe into pH7.0 calibration solution, wait a few moments, and then press Start Calibration.',
  ph2:'Please place the probe into pH10.0 calibration solution, wait a few moments, and then press Start Calibration.',
  sal1:'Please place the probe into the 35ppt calibration solution, wait a few moments, and then press Start Calibration.',
  orp1:'Please connect the terminator and press Start Calibration',
  orp2:'Please disconnect the terminator and connect the ORP Probe',
  orp3:'Please place the probe in 470mV calibration solution wate a few moments and then press Start Calibration',
  calculating:'Calculating Calibration Please Wait.....',
  save:'Ready to Save Calibration Value:',
  wl1: 'Please hold the PVC pipe out of the water and press Start Calibration',
  wl2:'Please place the PVC pipe into the water until the water level reaches the adapter and then press Start Calibration.',
  rinse:'Rinse the Probe with RO/DI Water and press Next.',
  finish:'Calibration Complete!',
  cus1:'Please Place the probe in the first solution wait a few moments, and then press Start Calibration',
  cus2:'Please Place the probe in the second solution wait a few moments, and then press Start Calibration',
};

$scope.showCal1=false;
$scope.showCal2=false;
$scope.finish=false;
    
$scope.calibrationData = {
  calParameter: '',
  currentStep: 1, // Initialize step counter
  stepInstruction: '', // Instruction for the current step
  buttonLabel: '',
  isButtonDisabled: false,
  instructions:'',
  calValue1:'',
  calValue2:'',
  addToCalendar:false,
};
    
$scope.$watch(function() {
    return $localStorage.json.RA;
}, function(newVal) {
    if (newVal) {
        $scope.refreshCalibrationData();
    }
}, true);
$scope.refreshCalibrationData = function() {
    $scope.calValue1 = $localStorage.json.RA.calValue1;
    $scope.calValue2 = $localStorage.json.RA.calValue2; 
};
    
    
$scope.startCalibration = function(cmd){
    message=null;
        var message = new Paho.MQTT.Message(cmd);
        message.qos = 1;
    	if (message!=null)
		{
			modal.show();
             $timeout(function() {
            modal.hide();
             }, 1000);
			message.destinationName = cloudusername + "/in";
			mqtt.send(message);
		}
} 
// Function to start calibration and show the first instruction
$scope.calibrate = function(calibrationType) {
if (json.RA.BID !== '4') {
    ons.notification.alert({
        message: 'Calibrations from the Uapp are currently only available for the Star controller.',
        title: 'Reef Angel Alert',
    });
} else if (json != null && json.RA != null && json.RA.cloudstatus === "Connected") {
    
    $scope.showCal1 = false;
    $scope.showCal2 = false;
    $scope.finish = false;
    $scope.addToCalendar = false;
    
    var cmd = calibrationType + ':1'; // Correctly construct the cmd string
    $scope.calibrationData.currentStep = 1; // Always start at step 1
    $scope.calibrationData.ButtonLabel = "Start Calibration";
    $scope.startCalibration(cmd);
    $scope.calibrationType = calibrationType;
  // Set initial instruction based on the calibration type
  if (calibrationType === 'calph') {
    $scope.calibrationData.calParameter = 'pH';
    $scope.calibrationData.instructions ='ph'
    $scope.calibrationData.stepInstruction = $scope.instructions.ph1;
  }
    else if (calibrationType === 'calsal') {
    $scope.calibrationData.instructions='sal';    
    $scope.calibrationData.calParameter = 'Salinity';  
    $scope.calibrationData.stepInstruction = $scope.instructions.sal1;
  }  
    else if (calibrationType === 'calorp') {
     $scope.calibrationData.instructions='orp';
     $scope.calibrationData.calParameter = 'Orp';  
    $scope.calibrationData.stepInstruction = $scope.instructions.orp1;
  }  
    else if (calibrationType === 'calphe') {
    $scope.calibrationData.calParameter = 'pH Expansion';
    $scope.calibrationData.instructions ='ph'  
    $scope.calibrationData.stepInstruction = $scope.instructions.ph1;
  }
    else if (calibrationType === 'calwl') {
    $scope.calibrationData.calParameter = 'Water Level';
    $scope.calibrationData.instructions ='wl'
    $scope.calibrationData.stepInstruction = $scope.instructions.wl1;
  }
    else if (calibrationType === 'calwl1') {
    $scope.calibrationData.calParameter = 'Water Level 1';
    $scope.calibrationData.instructions ='wl'
    $scope.calibrationData.stepInstruction = $scope.instructions.wl1;
  }
    else if (calibrationType === 'calwl2') {
    $scope.calibrationData.calParameter = 'Water Level 2';
    $scope.calibrationData.instructions ='wl'    
    $scope.calibrationData.stepInstruction = $scope.instructions.wl1;
  }
    else if (calibrationType === 'calwl3') {
    $scope.calibrationData.calParameter = 'Water Level 3';
    $scope.calibrationData.instructions ='wl'    
    $scope.calibrationData.stepInstruction = $scope.instructions.wl1;
  }
    else if (calibrationType === 'calwl4') {
    $scope.calibrationData.calParameter = 'Water Level 4';
    $scope.calibrationData.instructions ='wl'    
    $scope.calibrationData.stepInstruction = $scope.instructions.wl1;
  }
    //Custom Expansions
    else if (calibrationType === 'calcus1') {
    $scope.calibrationData.calParameter = 'Custom Expansion 1';
    $scope.calibrationData.instructions ='cus'    
     $scope.calibrationData.stepInstruction = $scope.instructions.cus1;
  }
    else if (calibrationType === 'calcus2') {
    $scope.calibrationData.calParameter = 'Custom Expansion 2';
    $scope.calibrationData.instructions ='cus'    
     $scope.calibrationData.stepInstruction = $scope.instructions.cus1;
  }
    else if (calibrationType === 'calcus3') {
    $scope.calibrationData.calParameter = 'Custom Expansion 3';
    $scope.calibrationData.instructions ='cus'    
     $scope.calibrationData.stepInstruction = $scope.instructions.cus1;
  }
    else if (calibrationType === 'calcus4') {
    $scope.calibrationData.calParameter = 'Custom Expansion 4';
    $scope.calibrationData.instructions ='cus'    
     $scope.calibrationData.stepInstruction = $scope.instructions.cus1;
  }
    else if (calibrationType === 'calcus5') {
    $scope.calibrationData.calParameter = 'Custom Expansion 5';
    $scope.calibrationData.instructions ='cus'    
     $scope.calibrationData.stepInstruction = $scope.instructions.cus1;
  }
    else if (calibrationType === 'calcus6') {
    $scope.calibrationData.calParameter = 'Custom Expansion 6';
    $scope.calibrationData.instructions ='cus'    
     $scope.calibrationData.stepInstruction = $scope.instructions.cus1;
  }
    else if (calibrationType === 'calcus7') {
    $scope.calibrationData.calParameter = 'Custom Expansion 7';
    $scope.calibrationData.instructions ='cus'    
     $scope.calibrationData.stepInstruction = $scope.instructions.cus1;
  }
    else if (calibrationType === 'calcus8') {
    $scope.calibrationData.calParameter = 'Custom Expansion 8';
    $scope.calibrationData.instructions ='cus'    
    $scope.calibrationData.stepInstruction = $scope.instructions.cus1;
  }else {
        // Default case if no known calibration type is matched
        ons.notification.alert({
            message: 'Unsupported calibration type.',
            title: 'Reef Angel Alert',
        });
        return; // Exit the function early
    }

    // Show the dialog with the first instruction
    ons.createDialog('caldialog.html', { parentScope: $scope }).then(function(dialog) {
        $scope.dialog = dialog;
        dialog.show();
    });
} else {
    // If any condition is not met, handle the else case
    ons.notification.alert({
        message: 'Communication with your controller failed.',
        title: 'Reef Angel Alert',
    });
}
};

// Function to proceed to the next step or complete the calibration process
$scope.proceedToNextStep = function() {  
    $scope.addToCalendar=false;
    $scope.showCal1 = false;
    $scope.showCal2 = false;
    $scope.finish=false;
    $scope.addToCalendar=false;
    var nextCmd = $scope.calibrationType + ':2';
    $scope.startCalibration(nextCmd);
    if ($scope.calibrationData.instructions === 'ph') {
    $scope.calibrationData.currentStep++;
    // Update instructions based on the current step
    if ($scope.calibrationData.currentStep === 2) {
      $scope.calibrationData.stepInstruction = $scope.instructions.calculating;
      $scope.calibrationData.ButtonLabel = "Next";
      $scope.calibrationData.isButtonDisabled = true; // Disable the button
      $timeout(function() { $scope.calibrationData.isButtonDisabled = false;}, 7000);      
      } else if ($scope.calibrationData.currentStep === 3) {
      
      $scope.calibrationData.stepInstruction = $scope.instructions.rinse;
      
      }else if ($scope.calibrationData.currentStep === 4) {
      // Assuming step 3 is the last step for pH calibration
      $scope.calibrationData.stepInstruction = $scope.instructions.ph2;
        $scope.calibrationData.ButtonLabel = "Start Calibration";
      }
      else if ($scope.calibrationData.currentStep === 5) {
      $scope.calibrationData.stepInstruction = $scope.instructions.calculating;
      $scope.calibrationData.ButtonLabel = "Next";
      $scope.calibrationData.isButtonDisabled = true; // Disable the button
      $timeout(function() { $scope.calibrationData.isButtonDisabled = false;}, 7000);  
      }
      else if ($scope.calibrationData.currentStep === 6) {
      $scope.refreshCalibrationData(); 
      $scope.showCal1=true;
      $scope.showCal2=true;      
      $scope.calibrationData.stepInstruction = $scope.instructions.save;
      $scope.calibrationData.ButtonLabel = "Save";
  
      }
      else if ($scope.calibrationData.currentStep === 7) {
      $scope.calibrationData.stepInstruction = $scope.instructions.finish;
      $scope.finish=true;      
      $scope.calibrationData.ButtonLabel = "Finish";
      }
      else if ($scope.calibrationData.currentStep === 8) {
           $scope.dialog.hide();
      }
 }
    if ($scope.calibrationData.instructions === 'sal') {
    $scope.calibrationData.currentStep++;
    // Update instructions based on the current step
     if ($scope.calibrationData.currentStep === 2) {
      $scope.calibrationData.stepInstruction = $scope.instructions.calculating;
      $scope.calibrationData.ButtonLabel = "Next";
      $scope.calibrationData.isButtonDisabled = true; // Disable the button
      $timeout(function() { $scope.calibrationData.isButtonDisabled = false;}, 7000);     
    } else if ($scope.calibrationData.currentStep === 3) {
      $scope.showCal1=true;
      $scope.calibrationData.stepInstruction = $scope.instructions.save;
        $scope.calibrationData.ButtonLabel = "Save";
    }else if ($scope.calibrationData.currentStep === 4) {
      $scope.calibrationData.stepInstruction = $scope.instructions.finish;
        $scope.calibrationData.ButtonLabel = "Finish";
        $scope.finish=true; 
    }else if ($scope.calibrationData.currentStep === 5) {
           $scope.dialog.hide();
    }

  }  
    if ($scope.calibrationData.instructions === 'wl') {
    $scope.calibrationData.currentStep++;
    // Update instructions based on the current step
    if ($scope.calibrationData.currentStep === 2) {
      $scope.calibrationData.stepInstruction = $scope.instructions.calculating;
      $scope.calibrationData.ButtonLabel = "Next";
      $scope.calibrationData.isButtonDisabled = true; // Disable the button
      $timeout(function() { $scope.calibrationData.isButtonDisabled = false;}, 7000);      
      }else if ($scope.calibrationData.currentStep === 3) {
      // Assuming step 3 is the last step for pH calibration
      $scope.calibrationData.stepInstruction = $scope.instructions.wl2;
        $scope.calibrationData.ButtonLabel = "Start Calibration";
      }
      else if ($scope.calibrationData.currentStep === 4) {
      $scope.calibrationData.stepInstruction = $scope.instructions.calculating;
      $scope.calibrationData.ButtonLabel = "Next";
      $scope.calibrationData.isButtonDisabled = true; // Disable the button
      $timeout(function() { $scope.calibrationData.isButtonDisabled = false;}, 7000);  
      }
      else if ($scope.calibrationData.currentStep === 5) {
      $scope.refreshCalibrationData();      
      $scope.showCal1=true;
      $scope.showCal2=true;        
      $scope.calibrationData.stepInstruction = $scope.instructions.save;
      $scope.calibrationData.ButtonLabel = "Save";     
      }
      else if ($scope.calibrationData.currentStep === 6) {
      $scope.calibrationData.stepInstruction = 'Calibration Complete!';
      $scope.calibrationData.ButtonLabel = "Finish";
      $scope.finish=true; 
      }
      else if ($scope.calibrationData.currentStep === 7) {
           $scope.dialog.hide();
      }
    }
    if ($scope.calibrationData.instructions === 'orp') {
    $scope.calibrationData.currentStep++;
    // Update instructions based on the current step
    if ($scope.calibrationData.currentStep === 2) {
      $scope.calibrationData.stepInstruction = $scope.instructions.calculating;
      $scope.calibrationData.ButtonLabel = "Next";
      $scope.calibrationData.isButtonDisabled = true; // Disable the button
      $timeout(function() { $scope.calibrationData.isButtonDisabled = false;}, 7000);      
      } else if ($scope.calibrationData.currentStep === 3) {
      
      $scope.calibrationData.stepInstruction = $scope.instructions.orp2;
      
      }else if ($scope.calibrationData.currentStep === 4) {
      // Assuming step 3 is the last step for pH calibration
      $scope.calibrationData.stepInstruction = $scope.instructions.orp3;
        $scope.calibrationData.ButtonLabel = "Start Calibration";
      }
      else if ($scope.calibrationData.currentStep === 5) {
      $scope.calibrationData.stepInstruction = $scope.instructions.calculating;
      $scope.calibrationData.ButtonLabel = "Next";
      $scope.calibrationData.isButtonDisabled = true; // Disable the button
      $timeout(function() { $scope.calibrationData.isButtonDisabled = false;}, 7000);  
      }
      else if ($scope.calibrationData.currentStep === 6) {
      $scope.refreshCalibrationData();    
      $scope.showCal1=true;
      $scope.showCal2=true;  
      $scope.calibrationData.stepInstruction = $scope.instructions.save;
      $scope.calibrationData.ButtonLabel = "Save";
      }
      else if ($scope.calibrationData.currentStep === 7) {
      $scope.calibrationData.stepInstruction = $scope.instructions.finish;
      $scope.calibrationData.ButtonLabel = "Finish";
      $scope.finish=true;       
      }
      else if ($scope.calibrationData.currentStep === 8) {
           $scope.dialog.hide();
      }
 }
    //custom expansion insstructions
    if ($scope.calibrationData.instructions === 'cus') {
    $scope.calibrationData.currentStep++;
    // Update instructions based on the current step
    if ($scope.calibrationData.currentStep === 2) {
      $scope.calibrationData.stepInstruction = $scope.instructions.calculating;
      $scope.calibrationData.ButtonLabel = "Next";
      $scope.calibrationData.isButtonDisabled = true; // Disable the button
      $timeout(function() { $scope.calibrationData.isButtonDisabled = false;}, 7000);      
      } else if ($scope.calibrationData.currentStep === 3) {
      
      $scope.calibrationData.stepInstruction = $scope.instructions.rinse;
      
      }else if ($scope.calibrationData.currentStep === 4) {
      // Assuming step 3 is the last step for pH calibration
      $scope.calibrationData.stepInstruction = $scope.instructions.cus2;
        $scope.calibrationData.ButtonLabel = "Start Calibration";
      }
      else if ($scope.calibrationData.currentStep === 5) {
      $scope.calibrationData.stepInstruction = $scope.instructions.calculating;
      $scope.calibrationData.ButtonLabel = "Next";
      $scope.calibrationData.isButtonDisabled = true; // Disable the button
      $timeout(function() { $scope.calibrationData.isButtonDisabled = false;}, 7000);  
      }
      else if ($scope.calibrationData.currentStep === 6) {
      $scope.refreshCalibrationData();
      $scope.showCal1=true;
      $scope.showCal2=true;            
      $scope.calibrationData.stepInstruction = $scope.instructions.save;
      $scope.calibrationData.ButtonLabel = "Save";
      }
      else if ($scope.calibrationData.currentStep === 7) {
      $scope.calibrationData.stepInstruction = $scope.instructions.finish;
      $scope.calibrationData.ButtonLabel = "Finish";
      $scope.finish=true;       
      }
      else if ($scope.calibrationData.currentStep === 8) {
           $scope.dialog.hide();
      }
 }
    
    var calName = $scope.calibrationData.calParameter + ' Calibrated'; // Event title
    var today = new Date();
    var eventDateTimeISO = today.toISOString().slice(0, 19).replace('T', ' '); // Format: yyyy-MM-dd HH:mm:ss
    var eventDescription; // Declare the variable outside the if-else structure

    if ($scope.calibrationData.calParameter === "Salinity") 
    {
    eventDescription = $scope.calibrationData.calParameter + ' calibration Value 1: ' + $scope.calValue1;
    } 
    
    else 
        
    {
    var eventDescription = $scope.calibrationData.calParameter + ' calibration Value 1: ' +$scope.calValue1 + ' Value 2: ' + $scope.calValue2;
    }
    var calInfo = {
                eventName: calName,
                eventDateTime: eventDateTimeISO,
                eventDescription: eventDescription,
                emailReminder: 0, // Assuming email reminder is always disabled
                recurring: 0 // Set recurring value to 0
            };
    if ($scope.calibrationData.addToCalendar) {
                // Send the POST request with the event data to add the event to the calendar
                return $http.post(`https://forum.reefangel.com/calendarEvents/${cloudusername}`, calInfo)
                            .then(function(response) {
                              //  ons.notification.alert({message: 'Event saved successfully!', title: 'Reef Angel Controller'});
                            });
            }    
}
$scope.cancel = function() {
    var cancelCmd = $scope.calibrationType + ':0'; // Use the stored calibration type
    $scope.startCalibration(cancelCmd);
    $scope.dialog.hide();
};

 


}]);
app.controller('Logs', ['$rootScope', '$scope', '$http', '$timeout', '$localStorage', function($rootScope, $scope, $http, $timeout, $localStorage) {
loadlabels($scope);
    
$scope.ioexpansion = ((json.RA.EM & 32) == 32);
$scope.star= (json.RA.BID ==4);
$scope.rexpansionEnabled = (json.RA.REM > 0);
$scope.exp = {}; // Object to keep track of expansion boxes
    // Use an object to hold last values for each parameter type
   if ($scope.rexpansionEnabled) {
        // Set properties for each expansion based on the REM bitmask
        for (let i = 1; i <= 8; i++) {
            $scope.exp[i] = !!(json.RA.REM & (1 << (i - 1)));
        }
    }
    $scope.currentTab = 'flags';  // Set 'Alert Flags' as the default tab
    $scope.logs = {
        flags: [],
        io: [],
        relay: [],
        other:[],
    };
    $scope.lastValue = {}; // To store the last log value for comparison
    
$scope.getName = function(parameter) {
    switch (parameter) {
        case 'atohigh': return $scope.atohighn;
        case 'atolow': return $scope.atolown;
        case 'alarm': return $scope.alarmn;
        default: return parameter; // Fallback to raw parameter name
    }
};
    // Define flags and their bitwise masks
$scope.flags = [
    { name: 'ATO Flag', mask: 1 },
    { name: 'Overheat Flag', mask: 2 },
    { name: 'Bus Lock Flag', mask: 4 },
    { name: 'Water Leak Flag', mask: 8 }
];
const ioChannels = [
    { bitValue: 1, labelKey: 'IO0N', defaultLabel: 'IO Channel 0' },
    { bitValue: 2, labelKey: 'IO1N', defaultLabel: 'IO Channel 1' },
    { bitValue: 4, labelKey: 'IO2N', defaultLabel: 'IO Channel 2' },
    { bitValue: 8, labelKey: 'IO3N', defaultLabel: 'IO Channel 3' },
    { bitValue: 16, labelKey: 'IO4N', defaultLabel: 'IO Channel 4' },
    { bitValue: 32, labelKey: 'IO5N', defaultLabel: 'IO Channel 5' },
    { bitValue: 64, labelKey: 'IO6N', defaultLabel: 'IO Channel 6' },
    { bitValue: 128, labelKey: 'IO7N', defaultLabel: 'IO Channel 7' }
];
$scope.io = [];
ioChannels.forEach(channel => {
    let label = jsonlabels.RA[channel.labelKey] || channel.defaultLabel;
    $scope.io.push({ name: label, mask: channel.bitValue });
});
    $scope.relayPorts = [];

// Define the number of main relay ports
const mainRelayPortsCount = 8;

// Define the number of expansion relay boxes
const expansionBoxesCount = 8;

// Loop through main relay ports
for (let i = 1; i <= mainRelayPortsCount; i++) {
    $scope.relayPorts.push({ name: 'RelayP' + i, mask: 1 << (i - 1) });
}

// Loop through expansion relay boxes and their ports
for (let box = 1; box <= expansionBoxesCount; box++) {
    for (let port = 1; port <= mainRelayPortsCount; port++) {
        $scope.relayPorts.push({ name: 'RelayE' + box + 'P' + port, mask: 1 << (port - 1) });
    }
}
    
    
$scope.labelMap = {}; // This will hold the label mapping.

    $scope.loadPortLabels = function(relayId) {
        var labelsData = localStorage.getItem('ngStorage-jsonlabels');
        if (labelsData) {
            var storageData = JSON.parse(labelsData);
            var customLabels = storageData.RA || {}; // Safe access

            // Loop and assign labels
            for (var portNumber = 1; portNumber <= 8; portNumber++) {
                var key = (relayId + portNumber + 'N').toUpperCase();
                $scope.labelMap[relayId + portNumber + 'n'] = customLabels[key] || 'Port ' + portNumber;
            }
        } else {
            // Default labels if no custom labels are found
            for (var portNumber = 1; portNumber <= 8; portNumber++) {
                $scope.labelMap[relayId + portNumber + 'n'] = 'Port ' + portNumber;
            }
        }
    };
    // Fetch logs based on the parameter
$scope.processNormalLogs = function(logData, parameter) {
    var logs = [];
    if (!$scope.lastValue) $scope.lastValue = {};
    logData.forEach((entry) => {
        let [timestamp, value] = entry;
        // Only log if the value has changed since last logged
        if ($scope.lastValue[parameter] !== value) {
            let paramName = $scope.getName(parameter); // Fetch the readable name
            let changeDescription = paramName + ' changed to ' + value;
            logs.unshift({
                timestamp: new Date(timestamp),
                changeDescription: changeDescription,
                rawTimestamp: timestamp
            });
            $scope.lastValue[parameter] = value; // Update last value
        }
    });
    return logs;
};


$scope.processBitwiseLogs = function(logData, parameter) {
    var logs = [];
    logData.forEach((entry) => {
        let [timestamp, value] = entry;
        if ($scope.lastValue[parameter] === undefined) {
            $scope.lastValue[parameter] = value;
            return; // Skip logging the first value since no previous comparison
        }

        let changes = $scope.getChanges($scope.lastValue[parameter], value, parameter);
        if (changes.length > 0) {
            changes.forEach(change => {
                logs.unshift({
                    timestamp: new Date(timestamp),
                    rawTimestamp: timestamp,
                    changeDescription: change
                });
            });
        }
        $scope.lastValue[parameter] = value; // Always update the last value
    });
    return logs;
};
$scope.fetchLogs = function(parameter) {
    if(json.RA.ID!=null){
    modal.show();
    $http.get('https://forum.reefangel.com/chartdata?reefangelid=' + json.RA.ID + '&parameter=' + parameter)
    .then(function(response) {
        if (parameter === 'af') {
            $scope.logs.flags = $scope.processBitwiseLogs(response.data, parameter);
        } else if (['atohigh', 'atolow', 'alarm'].includes(parameter)) {
            $scope.logs.other = $scope.processNormalLogs(response.data, parameter);
        } else if (parameter === 'io') {
            $scope.logs.io = $scope.processBitwiseLogs(response.data, parameter);
        } else if (['r', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'].includes(parameter)) {
            $scope.logs.relay = $scope.processRelayLogs(response.data, parameter); // Update this line
        }
        modal.hide();
    }, function(error) {
        console.error('Failed to fetch logs for parameter ' + parameter + ':', error);
        modal.hide();
    });
        }
    else
    {
        ons.notification.alert({message: 'You must login to view logs!', title: 'Reef Angel Controller'});
    }
};


$scope.processRelayLogs = function(logData, parameter) {
    var logs = [];
    logData.forEach((entry) => {
        let [timestamp, value] = entry;
        if (parameter === 'r') {
            $scope.relayPorts.forEach((port) => {
                if (logs.length >= 2000) {  // If the log exceeds 200 entries, remove the oldest
                    logs.shift();
                }
                if (port.name.startsWith('RelayP')) {
                    let portIndex = parseInt(port.name.replace('RelayP', ''));
                    let portLabelKey = 'R' + portIndex + 'N';
                    let portLabel = jsonlabels.RA[portLabelKey] || 'Port ' + portIndex;
                    let portValue = value & port.mask;
                    let lastPortValue = $scope.lastValue[port.name];
                    if (portValue !== lastPortValue) {
                        logs.push({
                            timestamp: new Date(timestamp),
                            changeDescription: portLabel + (portValue ? ' turned on' : ' turned off'),
                            rawTimestamp: timestamp
                        });
                        $scope.lastValue[port.name] = portValue;
                    }
                }
            });
        } else {
            let selectedBox = parseInt(parameter.substring(1));
            $scope.relayPorts.forEach((port) => {
                if (logs.length >= 2000) {  // If the log exceeds 200 entries, remove the oldest
                    logs.shift();
                }
                if (port.name.startsWith('RelayE' + selectedBox)) {
                    let portNumber = parseInt(port.name.replace('RelayE' + selectedBox + 'P', ''));
                    let portLabelKey = 'R' + selectedBox + portNumber + 'N';
                    let portLabel = jsonlabels.RA[portLabelKey] || 'Port ' + portNumber;
                    let portValue = value & port.mask;
                    let lastPortValue = $scope.lastValue[port.name];
                    if (portValue !== lastPortValue) {
                        logs.push({
                            timestamp: new Date(timestamp),
                            changeDescription: portLabel + (portValue ? ' turned on' : ' turned off'),
                            rawTimestamp: timestamp
                        });
                        $scope.lastValue[port.name] = portValue;
                    }
                }
            });
        }
    });
    return logs;
};
$scope.selectedPort = ''; // Set selectedPort to an empty string initially

$scope.setPort = function(portLabel) {
    if (portLabel === '') {
        $scope.selectedPort = ''; // If "All Ports" is selected, set selectedPort to an empty string
    } else {
        $scope.selectedPort = portLabel;
    }
    $scope.filterLogsByPort();
};

// Function to filter logs based on the selected port
$scope.filterLogsByPort = function() {
    if ($scope.selectedPort && $scope.selectedPort !== '') {
        $scope.filteredLogs = $scope.logs.relay.filter(log => 
            log.changeDescription.includes($scope.selectedPort)
        );
    } else {
        $scope.filteredLogs = $scope.logs.relay; // Show all logs if no specific port is selected
    }
};
    // Determine what changed based on bitwise flags
$scope.getChanges = function(oldValue, newValue, parameter) {
    let changes = [];
    let itemList = parameter === 'af' ? $scope.flags : $scope.io;

   // console.log(`Calculating changes for ${parameter}: old value = ${oldValue}, new value = ${newValue}`);

    itemList.forEach(item => {
        let bitMask = item.mask;
        let wasSet = (oldValue !== undefined) && ((oldValue & bitMask) === bitMask);
        let isSet = (newValue & bitMask) === bitMask;

        if (wasSet !== isSet) {
            let description = item.name;
            if (parameter === 'af') {
                description += isSet ? ' activated' : ' deactivated';
            } else {
                description += isSet ? ' changed to 1' : ' changed to 0';
            }
            changes.push(description);

         //   console.log(`Detected change: ${description}`);
        }
    });

    return changes;
};


   
    // Change tab and fetch appropriate logs
    $scope.changeTab = function(tabName) {
        $scope.currentTab = tabName;
        if (tabName == 'af'){
            $scope.fetchLogs('af');
        }
         // fetch 'af' for 'flags', otherwise use tab name
    };

    // Fetch default tab logs when controller loads
    $scope.fetchLogs('af');
}]);

