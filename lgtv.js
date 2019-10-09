/* jshint -W097 */
/* jshint strict:false */
/* global require */
/* global RRule */
/* global __dirname */
/* jslint node: true */
'use strict';

var fs = require('fs'); // for storing client key
var utils = require('@iobroker/adapter-core');
var adapter;
var LGTV = require('lgtv2');
var pollTimerChannel		= null;
var pollTimerVolumeLevel	= null;
var pollTimerOnlineStatus	= null;
var pollTimerInput		= null;
var pollTimerGetSoundOutput	= null;


function startAdapter(options) {
    options = options || {};
    Object.assign(options,{
        name:  "lgtv",
        stateChange:  function (id, state) {
            if (id && state && !state.ack)
			{
				id = id.substring(adapter.namespace.length + 1);
				adapter.log.debug('State change "' + id + '" - VALUE: ' + state.val);
				switch (id)
				{
					case 'states.popup':
						adapter.log.debug('Sending popup message "' + state.val + '" to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://system.notifications/createToast', {message: state.val}, function (err, val) {
							if (!err) adapter.setState('states.popup', state.val, true);
						});
						break;

					case 'states.turnOff':
						adapter.log.debug('Sending turn OFF command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://system/turnOff', {message: state.val}, function (err, val) {
							if (!err) adapter.setState('states.turnOff', state.val, true);
						});
						break;

					case 'states.mute':
						adapter.log.debug('Sending mute ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://audio/setMute', {mute: !!state.val}, function (err, val) {
							if (!err) adapter.setState('states.mute', !!state.val, true);
						});
						break;

					case 'states.volume':
						adapter.log.debug('Sending volume change ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://audio/setVolume', {volume: state.val}, function (err, val) {
							if (!err) 
								pollVolumeLevel();
						});
						break;
					
					case 'states.volumeUp':
						adapter.log.debug('Sending volumeUp ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://audio/volumeUp', null, function (err, val) {
							if (!err) adapter.setState('states.volumeUp', !!state.val, true);
						});
						break;

					case 'states.volumeDown':
						adapter.log.debug('Sending volumeDown ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://audio/volumeDown', null, function (err, val) {
							if (!err) adapter.setState('states.volumeDown', !!state.val, true);
						});
						break;

					case 'states.channel':
						adapter.log.debug('Sending switch to channel ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://tv/openChannel', {channelNumber: state.val}, function (err, val) {
							if (!err) 
								adapter.setState('states.channel', state.val, true)
							else 
								adapter.log.debug('Error in switching to channel: ' + err);
						});
						break;
										
					case 'states.channelUp':
						adapter.log.debug('Sending channelUp ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://tv/channelUp', null, function (err, val) {
							if (!err) adapter.setState('states.channelUp', !!state.val, true);
						});
						break;

					case 'states.channelDown':
						adapter.log.debug('Sending channelDown ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://tv/channelDown', null, function (err, val) {
							if (!err) adapter.setState('states.channelDown', !!state.val, true);
						});
						break;
						
					
					case 'states.mediaPlay':
						adapter.log.debug('Sending mediaPlay ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://media.controls/play', null, function (err, val) {
							if (!err) adapter.setState('states.mediaPlay', !!state.val, true);
						});
						break;
						
					case 'states.mediaPause':
						adapter.log.debug('Sending mediaPause ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://media.controls/pause', null, function (err, val) {
							if (!err) adapter.setState('states.mediaPause', !!state.val, true);
						});
						break;
						
					case 'states.openURL':
						adapter.log.debug('Sending open ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://system.launcher/open', {target: state.val}, function (err, val) {
							if (!err) adapter.setState('states.openURL', state.val, true);
						});
						break;
						
					case 'states.mediaStop':
						adapter.log.debug('Sending mediaStop ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://media.controls/stop', null, function (err, val) {
							if (!err) adapter.setState('states.mediaStop', !!state.val, true);
						});
						break;
						
					case 'states.mediaFastForward':
						adapter.log.debug('Sending mediaFastForward ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://media.controls/fastForward', null, function (err, val) {
							if (!err) adapter.setState('states.mediaFastForward', !!state.val, true);
						});
						break;
						
					case 'states.mediaRewind':
						adapter.log.debug('Sending mediaRewind ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://media.controls/rewind', null, function (err, val) {
							if (!err) adapter.setState('states.mediaRewind', !!state.val, true);
						});
						break;
						
					case 'states.3Dmode':
						adapter.log.debug('Sending 3Dmode ' + state.val + ' command to WebOS TV: ' + adapter.config.ip);
						switch (state.val)
						{
							case true:
								sendCommand('ssap://com.webos.service.tv.display/set3DOn', null, function (err, val) {
									if (!err) adapter.setState('states.3Dmode', !!state.val, true);
								});
							break;
							
							case false:
								sendCommand('ssap://com.webos.service.tv.display/set3DOff', null, function (err, val) {
									if (!err) adapter.setState('states.3Dmode', !!state.val, true);
								});
							break;
						}
						break;

					case 'states.launch':
						adapter.log.debug('Sending launch command ' + state.val + ' to WebOS TV: ' + adapter.config.ip);
						switch (state.val)
						{
							case 'livetv':
								adapter.log.debug('Switching to LiveTV on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: "com.webos.app.livetv"}), function (err, val) {
									if (!err) adapter.setState('states.launch', state.val, true);
								}
							break;
							case 'smartshare':
								adapter.log.debug('Switching to SmartShare App on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: "com.webos.app.smartshare"}), function (err, val) {
									if (!err) adapter.setState('states.launch', state.val, true);
								}
							break;		
							case 'tvuserguide':
								adapter.log.debug('Switching to TV Userguide App on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: "com.webos.app.tvuserguide"}), function (err, val) {
									if (!err) adapter.setState('states.launch', state.val, true);
								}
							break;	
							case 'netflix':
								adapter.log.debug('Switching to Netflix App on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: "netflix"}), function (err, val) {
									if (!err) adapter.setState('states.launch', state.val, true);
								}
							break;		
							case 'youtube':
								adapter.log.debug('Switching to Youtube App on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: "youtube.leanback.v4"}), function (err, val) {
									if (!err) adapter.setState('states.launch', state.val, true);
								}
							break;
							case 'prime':
								adapter.log.debug('Switching to Amazon Prime App on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: "lovefilm.de"}), function (err, val) {
									if (!err) adapter.setState('states.launch', state.val, true);
								}
							break;
							case 'amazon':
								adapter.log.debug('Switching to Amazon Prime App on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: "amazon"}), function (err, val) {
									if (!err) adapter.setState('states.launch', state.val, true);
								}
							break;
							default:
								//state.val = '"' + state.val + '"';
								adapter.log.debug('Opening app ' + state.val + ' on WebOS TV: ' + adapter.config.ip);
								sendCommand('ssap://system.launcher/launch', {id: state.val}), function (err, val) 
								{
									if (!err) 
										adapter.setState('states.launch', state.val, true)
									else adapter.log.debug('Error opening app ' + state.val + ' on WebOS TV: ' + adapter.config.ip);
								}

							break;
						}
						break;

					case 'states.input':
						adapter.log.debug('Sending switch to input "' + state.val + '" command to WebOS TV: ' + adapter.config.ip);
						sendCommand('ssap://tv/switchInput', {inputId: state.val}, function (err, val) {
							if (!err) adapter.setState('states.input', state.val, true);
						});
						break;
						
					case 'states.raw':
						adapter.log.debug('Sending raw command api "' + state.val + '" to WebOS TV: ' + adapter.config.ip);
						sendCommand(state.val[url], state.val[cmd], function (err, val) {
							if (!err) adapter.setState('states.raw', state.val, true);
						});
						break;
						
					case 'states.youtube':
						sendCommand('ssap://system.launcher/launch', {id: 'youtube.leanback.v4', contentId: 'https://www.youtube.com/watch?v=' + state.val}, function (err, val) {
							if (!err) adapter.setState('states.youtube', state.val, true);
						});
						break;
					
					case 'states.drag':
                    				// The event type is 'move' for both moves and drags.
						var vals = state.val.split(",");
						var dx = parseInt(vals[0]);
						var dy = parseInt(vals[1]);
						sendCommand('move', { dx: dx, dy: dy, drag: vals[2] === 'drag' ? 1 : 0}, function (err, val) {
							if (!err) adapter.setState(id, state.val, true);
						});
                    				break;

					case 'states.scroll':
						var vals = state.val.split(",");
						var dx = parseInt(vals[0]);
						var dy = parseInt(vals[1]);
						sendCommand('scroll', { dx: dx, dy: dy }, function (err, val) {
							if (!err) adapter.setState(id, state.val, true);
						});
						break;

					case 'states.click':
						sendCommand('click', {}, function (err, val) {
							if (!err) adapter.setState(id, state.val, true);
						});
						break;
					
					case 'states.soundOutput':
						sendCommand('ssap://com.webos.service.apiadapter/audio/changeSoundOutput', { output: state.val}, function (err, val) {
							if (!err) adapter.setState(id, state.val, true);
						});
						break;
						
					default:
						if(~id.indexOf('remote')){
							adapter.log.error('State change "' + id + '" - VALUE: ' + JSON.stringify(state));
							let ids = id.split(".");
							let key = ids[ids.length - 1].toString().toUpperCase();
							sendCommand('button', { name: key }, function (err, val) {
								if (!err) adapter.setState(id, state.val, true); // ?
							});
						}
						break;
				}
			}
        },
        unload: function (callback) {
            callback();
        },
        ready: function () {
            main();
        }
    });

    adapter = new utils.Adapter(options);

    return adapter;
}

function sendCommand(cmd, options, cb) {
	var lgtvobj = new LGTV({
		url: 		'ws://' + adapter.config.ip + ':3000',
		timeout: 	adapter.config.timeout,
		reconnect: 	false,
		keyfile: 	'lgtvkeyfile'
	});
	lgtvobj.on('connecting', function (host)
	{
		adapter.log.debug('Connecting to WebOS TV: ' + host);
	});

	lgtvobj.on('prompt', function ()
	{
		adapter.log.debug('Waiting for pairing confirmation on WebOS TV ' + adapter.config.ip);
	});

	lgtvobj.on('error', function (error)
	{
		adapter.log.debug('Error on connecting or sending command to WebOS TV: ' + error);
		cb && cb(error);
	});

	lgtvobj.on('connect', function (error, response){
		if(~cmd.indexOf('ssap:')){
			lgtvobj.request(cmd, options, function (_error, response){
				if (_error){
					adapter.log.debug('ERROR! Response from TV: ' + (response ? JSON.stringify(response) : _error));
				}
				lgtvobj.disconnect();
				cb && cb(_error, response);
			});
		} else {
			lgtvobj.getSocket(
				'ssap://com.webos.service.networkinput/getPointerInputSocket', (err, sock) => {
					if (!err) {
						sock.send(cmd, options);
					}
				}
			);		
		}
	});
}

function pollChannel() {
	adapter.log.debug('Polling channel');
	sendCommand('ssap://tv/getCurrentChannel', null, function (err, channel) 
	{
		var JSONChannel, ch;
		JSONChannel = JSON.stringify(channel);
		adapter.log.debug('DEBUGGING CHANNEL POLLING PROBLEM: ' + JSONChannel);
		if (JSONChannel) ch = JSONChannel.match(/"channelNumber":"(\d+)"/m);
		if (!err && ch) 
		{
			adapter.setState('states.channel', ch[1], true);
		} 
		else 
		{
			adapter.setState('states.channel', '', true);
		}
		
		if (JSONChannel) ch = JSONChannel.match(/.*"channelId":"(.*?)"/m);
		if (!err && ch) 
		{
			adapter.setState('states.channelId', ch[1], true);
		} 
		else 
		{
			adapter.setState('states.channelId', '', true);
		}
		
		
	});
}

function pollVolumeLevel() {
	adapter.log.debug('Polling volume level');
	sendCommand('ssap://audio/getVolume', null, function (err, channel) 
	{
		var JSONChannel, ch;
		JSONChannel = JSON.stringify(channel);
		adapter.log.debug('pollVolumeLevel: ' + JSONChannel);
		if (JSONChannel) ch = JSONChannel.match(/"volume":(\d+)/m);
		if (!err && ch) 
		{
			adapter.setState('states.volume', parseInt(ch[1]), true);
		} 
		else 
		{
			adapter.setState('states.volume', 0, true);
		}
	});
}

function pollOnlineStatus() {
	adapter.log.debug('Polling OnlineStatus');
	sendCommand('com.webos.applicationManager/getForegroundAppInfo', null, function (err, OnlineStatus) 
	{
		if (!err && OnlineStatus)
		{
			adapter.setState('states.on', true, true);
		} 
		else 
		{
			adapter.setState('states.on', false, true);
		}
	});
}

function pollInputAndCurrentApp() {
	adapter.log.debug('Polling Input and current App');
	sendCommand('ssap://com.webos.applicationManager/getForegroundAppInfo', null, function (err, Input)
	{
		if (!err && Input) 
		{
			var JSONInput, CurrentInputAndApp;
			JSONInput = JSON.stringify(Input);
			if (JSONInput)
			{
				CurrentInputAndApp = JSONInput.match(/.*"appId":"(.*?)"/m);
				if (CurrentInputAndApp)
				{
					adapter.log.debug('Current Input and/or App: ' + CurrentInputAndApp[1]);
					adapter.setState('states.currentApp', CurrentInputAndApp[1], true);
				
					switch(CurrentInputAndApp[1])
					{
						case "com.webos.app.hdmi1":
							adapter.setState('states.input', 'HDMI_1', true);
						break;

						case "com.webos.app.hdmi2":
							adapter.setState('states.input', 'HDMI_2', true);
						break;

						case "com.webos.app.hdmi3":
							adapter.setState('states.input', 'HDMI_3', true);
						break;

						case "com.webos.app.externalinput.scart":
							adapter.setState('states.input', 'SCART_1', true);
						break;
	
						case "com.webos.app.externalinput.component":
							adapter.setState('states.input', 'COMP_1', true);
						break;	
					
						default:
						break;
					}
				}
			}
		} 
		else 
		{
			adapter.log.debug('ERROR on polling input and app: ' + err);
		}
	});
}

function pollGetSoundOutput() {
	adapter.log.debug('Polling Input and current App');
	sendCommand('ssap://com.webos.service.apiadapter/audio/getSoundOutput', null, function (err, Input)	{
		if (!err && Input) {
			//adapter.log.debug('Current SoundOutput: ' + JSON.stringify(Input)); //Current SoundOutput and/or App: {"returnValue":true,"soundOutput":"tv_speaker"}
			var JSONInput, CurrentSoundOutput;
			JSONInput = JSON.stringify(Input);
			if (JSONInput){
				CurrentSoundOutput = JSONInput.match(/.*"soundOutput":"(.*?)"/m);
				if (CurrentSoundOutput){
					adapter.log.debug('Current SoundOutput: ' + CurrentSoundOutput[1]);
					adapter.setState('states.soundOutput', CurrentSoundOutput[1], true);
				}
			}
		} else {
			adapter.log.debug('ERROR on polling input and app: ' + err);
		}
	});
}

function main() 
{
	adapter.log.info('Ready. Configured WebOS TV IP: ' + adapter.config.ip);
    adapter.subscribeStates('*');
	if (parseInt(adapter.config.interval, 10)) {
		pollTimerChannel = setInterval(pollChannel, parseInt(adapter.config.interval, 10));
		pollTimerVolumeLevel = setInterval(pollVolumeLevel, parseInt(adapter.config.interval, 10));
		pollTimerOnlineStatus = setInterval(pollOnlineStatus, parseInt(adapter.config.interval, 10));
		pollTimerInput = setInterval(pollInputAndCurrentApp, parseInt(adapter.config.interval, 10));
		pollTimerGetSoundOutput = setInterval(pollGetSoundOutput, parseInt(adapter.config.interval, 10));
	}
	sendCommand('ssap://api/getServiceList', null, function (err, val) { 
			if (!err) adapter.log.debug('Service list: ' + JSON.stringify(val));
	});
}

// If started as allInOne/compact mode => return function to create instance
if (module && module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
} 
