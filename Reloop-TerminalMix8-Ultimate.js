// #######
//    #    ###### #####  #    # # #    #   ##   #          ####  #####  ######  ####  # ###### #  ####
//    #    #      #    # ##  ## # ##   #  #  #  #         #      #    # #      #    # # #      # #    #
//    #    #####  #    # # ## # # # #  # #    # #          ####  #    # #####  #      # #####  # #
//    #    #      #####  #    # # #  # # ###### #              # #####  #      #      # #      # #
//    #    #      #   #  #    # # #   ## #    # #         #    # #      #      #    # # #      # #    #
//    #    ###### #    # #    # # #    # #    # ######     ####  #      ######  ####  # #      #  ####

// eslint-disable-next-line no-var
var TerminalMix8 = {};
// The SysEx message to send to the controller to force the midi controller
// to send the status of every item on the control surface.
var ControllerStatusSysex = [0xf0, 0x00, 0x20, 0x7f, 0x03, 0x01, 0xf7];

connections = [];

// ColorMapper for Terminal Mix Colors
var colors = new ColorMapper({
  0x000000: 0x00, // Black
  0xcc0000: 0x30, // Red
  0xcc4400: 0x34, // Orange
  0xcccc00: 0x3c, // yellow
  0x44cc00: 0x4c, // lime
  0x00cccc: 0x07, // light blue (0x0A)
  0x0088cc: 0x03, // blue (0x0B)
  0xcc00cc: 0x13, // purple
  0xffffff: 0x2b, // white
  0xffbcff: 0x2a, // dark white
});

// ###
//  #  #    # # #####
//  #  ##   # #   #
//  #  # #  # #   #
//  #  #  # # #   #
//  #  #   ## #   #
// ### #    # #   #

TerminalMix8.init = function () {
  // After midi controller receive this Outbound Message request SysEx Message,
  // midi controller will send the status of every item on the
  // control surface. (Mixxx will be initialized with current values)
  midi.sendSysexMsg(ControllerStatusSysex, ControllerStatusSysex.length);
  // midi.sendShortMsg(0x94, 00, 0x30);

  // loadedTrack(1, 75, [0x30, 0x4c], 0x94);
  // loadedTrack(2, 75, [0x30, 0x4c], 0x95);
  // loadedTrack(3, 75, [0x30, 0x4c], 0x96);
  // loadedTrack(4, 75, [0x30, 0x4c], 0x97);
  // initMethods();
};

var initMethods = function () {
  initHotcues(1, 0x94);
  initHotcues(2, 0x95);
  initHotcues(3, 0x96);
  initHotcues(4, 0x97);
  beatloopListen(1, 0x94);
  beatloopListen(2, 0x95);
  beatloopListen(3, 0x96);
  beatloopListen(4, 0x97);
  beatloopSizeListen(1, 0x94);
  beatloopSizeListen(2, 0x95);
  samplerListen(0x94, 0);
  samplerListen(0x95, 4);
  vuMeterListener(0x90);
  headphonesListener(1, 0x90);
  headphonesListener(2, 0x91);
  headphonesListener(3, 0x92);
  headphonesListener(4, 0x93);
  deckTrackLoadedListener(1, 0x90);
  deckTrackLoadedListener(2, 0x91);
  deckTrackLoadedListener(3, 0x92);
  deckTrackLoadedListener(4, 0x93);
  fxEnabledListener(1, 0x90);
  playingListener(1, 0x90);
  playingListener(2, 0x91);
  playingListener(3, 0x92);
  playingListener(4, 0x93);
};

//  #####
// #     # #    # #    # ##### #####   ####  #    # #    #
// #       #    # #    #   #   #    # #    # #    # ##   #
//  #####  ###### #    #   #   #    # #    # #    # # #  #
//       # #    # #    #   #   #    # #    # # ## # #  # #
// #     # #    # #    #   #   #    # #    # ##  ## #   ##
//  #####  #    #  ####    #   #####   ####  #    # #    #

TerminalMix8.shutdown = function () {
  clearConnections();
  clearHotcues(0x94);
  clearHotcues(0x95);
  clearHotcues(0x96);
  clearHotcues(0x97);
};

var clearConnections = function () {
  for (var i = 0; i < connections.length; i++) {
    connections[i].disconnect();
  }
};

var clearHotcues = function (channel) {
  for (var i = 0; i <= 8 * 5; i++) {
    midi.sendShortMsg(channel, i, 0x00);
  }
};

var playingListener = function (channel, outChannel) {
  connections[connections.length] = engine.makeConnection(
    "[Channel" + channel + "]",
    "play",
    function (value, group, control) {
      if (value == 1) {
        midi.sendShortMsg(outChannel, 0x05, 0x7f);
      } else {
        midi.sendShortMsg(outChannel, 0x05, 0x00);
      }
    },
  );
};

// #     #
// ##   ## # #    # ###### #####
// # # # # #  #  #  #      #    #
// #  #  # #   ##   #####  #    #
// #     # #   ##   #      #####
// #     # #  #  #  #      #   #
// #     # # #    # ###### #    #

TerminalMix8.allSamplerGain = function (
  channel,
  control,
  value,
  status,
  group,
) {
  for (var i = 0; i < 16; i++) {
    // TODO: Check what curve the Sampler Volume is using. Maybe logarithmic?
    engine.setValue("[Sampler" + i + "]", "pregain", value / 35);
  }
};

// #
// #       # #####  #####    ##   #####  #   #
// #       # #    # #    #  #  #  #    #  # #
// #       # #####  #    # #    # #    #   #
// #       # #    # #####  ###### #####    #
// #       # #    # #   #  #    # #   #    #
// ####### # #####  #    # #    # #    #   #

TerminalMix8.preview = function (channel, control, value, status, group) {
  if (value != 0) {
    if (engine.getValue("[PreviewDeck1]", "play") != 1) {
      engine.setValue("[PreviewDeck1]", "LoadSelectedTrackAndPlay", 1);
    } else {
      engine.setValue("[PreviewDeck1]", "play", 0);
    }
  }
};

// ######  ### #######  #####  #     #
// #     #  #     #    #     # #     #
// #     #  #     #    #       #     #
// ######   #     #    #       #######
// #        #     #    #       #     #
// #        #     #    #     # #     #
// #       ###    #     #####  #     #

TerminalMix8.pitchSlider = function (channel, control, value, status, group) {
  // invert pitch slider (down=faster) so it matches the labels on controller
  engine.setValue(group, "rate", -script.midiPitch(control, value, status));
};

// #     #
// #  #  # #    # ###### ###### #
// #  #  # #    # #      #      #
// #  #  # ###### #####  #####  #
// #  #  # #    # #      #      #
// #  #  # #    # #      #      #
//  ## ##  #    # ###### ###### ######

TerminalMix8.wheelTouch = function (channel, control, value, status, group) {
  var deckNumber = script.deckFromGroup(group);
  //if ((status & 0xF0) === 0x90) {    // If button down
  if (value === 0x7f) {
    // Some wheels send 0x90 on press and release, so you need to check the value
    var alpha = 1.0 / 8;
    var beta = alpha / 32;
    engine.scratchEnable(deckNumber, 128, 33 + 1 / 3, alpha, beta);
  } else {
    // If button up
    engine.scratchDisable(deckNumber);
  }
};

// The wheel that actually controls the scratching
TerminalMix8.wheelTurn = function (channel, control, value, status, group) {
  // --- Choose only one of the following!
  // A: For a control that centers on 0:
  //var newValue;
  //if (value < 64) {
  //    newValue = value;
  //} else {
  //    newValue = value - 128;
  //}

  // B: For a control that centers on 0x40 (64):
  var newValue = value - 64;

  // --- End choice

  // In either case, register the movement
  var deckNumber = script.deckFromGroup(group);
  if (engine.isScratching(deckNumber)) {
    engine.scratchTick(deckNumber, newValue); // Scratch!
  } else {
    engine.setValue(group, "jog", newValue); // Pitch bend
  }
};
