'use babel';

import path from 'path';
import KeyBindView from './pseudo-synthesizer-view';
import { CompositeDisposable, TextEditor } from 'atom';
import { readSource, getReadSource, readKeyBind, readIR, getReadIR, KeyBind, writeToCson, writeAnalysedData, readPeriodicWave } from './control-file';
import { getConfigAndSetOnDidChange, getActivatePackage, setChangedConfig } from './atom-utility';
import { isNotEmpty, setEventListener, disposeEventListeners, returnValueIfEmpty, isFileExist, binarySearch } from './utility';
import { readZip } from './zip';

export default {
  config: {
    keyBindConfigFilePath: {
      type: 'string',
      description: 'keybind file path. if this is empty, default file is used.',
      order: 1,
      'default': ''
    },
    sourceConfigFilePath: {
      type: 'string',
      description: 'source file path. if this is empty, default file is used.',
      order: 2,
      'default': ''
    },
    useSourceFile: {
      type: 'boolean',
      description: 'if set this, source file is used.',
      order: 3,
      'default': true
    },

    impulseResponseConfigFilePath: {
      type: 'string',
      description: 'Impulse response file path. if this is empty, default file is used.',
      order: 4,
      'default': ''
    },
    impluseResponseNormalize: {
      type: 'boolean',
      description: 'A boolean that controls whether the impulse response from the buffer will be scaled by an equal-power normalization when the buffer attribute is set, or not.',
      order: 5,
      'default': true
    },
    //FIXME
    impluseResponseIndex: {
      type: 'integer',
      description: "Impulse response index. if this value set to -1, reverb effect is not created. Caution: Maximum of default data set is 16.",
      order: 6,
      'default': -1,
      minimum: -1
      //maximum:
    },

    detune: {
      type: 'integer',
      description: 'detune oscillation(cent). -4800 to 4800.',
      'default': 0,
      order: 7,
      minimum: -4800,
      maximum: 4800
    },
    gain: {
      type: 'number',
      description: 'gain. 0.0 to 4096.0.',
      'default': 1.0,
      order: 8,
      minimum: 0.0,
      maximum: 4096.0
    },
    playbackRate: {
      type: 'number',
      description: 'The speed at which the audio asset will be played. 0.0 to 10.0.',
      order: 9,
      'default': 1.0,
      minimum: 0.0,
      maximum: 10.0
    },
    delayTime: {
      type: 'number',
      description: 'Delay time(s).',
      order: 10,
      'default': 0.0,
      minimum: 0.0,
      maximum: 10.0
    },

    sourceOscillatorWaveType: {
      type: 'string',
      description: 'Wave type. if useSourceFile is false, this value is enabled.',
      order: 11,
      'default': 'sine',
      enum: [
        {value: 'sine', description: 'sine wave'},
        {value: 'square', description: 'square wave'},
        {value: 'sawtooth', description: 'sawtooth wave'},
        {value: 'triangle', description: 'triangle wave'},
        {value: 'custom', description: 'costom wave'}
      ]
    },
    sourceOscillatorCustomWaveFilePath: {
      type: 'string',
      description: 'Source oscillator custom wave file path',
      order: 12,
      'default': ''
    },
    sourceOscillatorCustomWaveDisableNormalize: {
      type: 'boolean',
      description: 'If set this to true, Source oscillator custom wave will not be normalized',
      order: 13,
      'default': false
    },
    sourceOscillatorBaseFrequency: {
      type: 'number',
      description: 'base frequency(hz). if useSourceFile is false, this value is enabled.',
      order: 14,
      'default': 440.0,
      minimum: 0.0,
      maximum: 22000.0
    },
    sourceOscillatorLength: {
      type: 'number',
      description: 'length(sec). if useSourceFile is false, this value is enabled.',
      order: 15,
      'default': 1.0,
      minimum: 0.0,
      maximum: 5.0
    },
    sourceOscillatorOvertoneNumber: {
      type: 'integer',
      description: 'Overtone number. if useSourceFile is false, this value is enabled.',
      order: 16,
      'default': 1,
      minimum: 1,
      maximum: 32
    },
    sourceOscillatorEnvelopeAttackTime: {
      type: 'number',
      description: 'The ratio of attack time to sourceOscillatorLength.',
      order: 17,
      default: 0.2,
      minimum: 0,
      maximum: 1
    },
    sourceOscillatorEnvelopeAttackAmplitude: {
      type: 'number',
      description: 'The ratio of attack amplitude to source oscillator amplitude.',
      order: 18,
      default: 1,
      minimum: 1.0e-30, //1.40130e-45,
      maximum: 1
    },
    sourceOscillatorEnvelopeDecayTime: {
      type: 'number',
      description: 'The ratio of decay time to sourceOscillatorLength.',
      order: 19,
      default: 0.3,
      minimum: 0,
      maximum: 1
    },
    sourceOscillatorEnvelopeDecayAmplitude: {
      type: 'number',
      description: 'The ratio of decay amplitude to source oscillator amplitude.',
      order: 20,
      default: 0.5,
      minimum: 1.0e-30, //1.40130e-45,
      maximum: 1
    },
    sourceOscillatorEnvelopeSustainTime: {
      type: 'number',
      description: 'The ratio of sustain time to sourceOscillatorLength.',
      order: 21,
      default: 0.3,
      minimum: 0,
      maximum: 1
    },
    sourceOscillatorEnvelopeSustainAmplitude: {
      type: 'number',
      description: 'The ratio of sustain amplitude to source oscillator amplitude.',
      order: 22,
      default: 0.5,
      minimum: 1.0e-30, //1.40130e-45,
      maximum: 1
    },
    sourceOscillatorEnvelopeReleaseTime: {
      type: 'number',
      description: 'The ratio of release time to sourceOscillatorLength.',
      order: 23,
      default: 0.2,
      minimum: 0,
      maximum: 1
    },
    sourceOscillatorEnvelopeReleaseAmplitude: {
      type: 'number',
      description: 'The ratio of release amplitude to source oscillator amplitude.',
      order: 24,
      default: 0,
      minimum: 1.0e-30, //1.40130e-45,
      maximum: 1
    },
    sourceOscillatorEnvelopeRampType: {
      type: 'string',
      description: 'Source oscillator envelope ramp type',
      order: 25,
      default: 'linear',
      enum: [
        {value: 'linear', description: 'linear ramp'},
        {value: 'exponential', description: 'exponential ramp'}
      ]
    },

    autoPlayInterval: {
      type: 'integer',
      description: 'Auto play interval (ms)', //FIXME
      order: 26,
      'default': 150,
      minimum: 10,
      maximum: 5000
    },

    //Analyser
    analyserSize: {
      type: 'integer',
      description: 'Analyser FFT size.',
      order: 27,
      'default': 2048,
      enum: [
        {value: 512, description: '512'},
        {value: 1024, description: '1024'},
        {value: 2048, description: '2048'},
        {value: 4096, description: '4096'},
        {value: 8192, description: '8192'},
        {value: 16384, description: '16384'}
      ]
    },
    analyserMinDecibels: {
      type: 'number',
      description: 'Minimum power value in the scaling range for the FFT analysis data. MinDecibels < MaxDecibels.',
      order: 28,
      'default': -80
    },
    analyserMaxDecibels: {
      type: 'number',
      description: 'Maximum power value in the scaling range for the FFT analysis data. MinDecibels < MaxDecibels.',
      order: 29,
      'default': -15
    },
    analyserSmoothingTimeConstant: {
      type: 'number',
      description: 'Averaging constant with the last analysis frame.', //FIXME
      order: 30,
      'default': 0.8,
      minimum: 0.0,
      maximum: 1.0
    },
    analyserInterval: {
      type: 'number', //interger?
      description: 'Interval(ms).', //FIXME
      order: 31,
      'default': 100,
      minimum: 10,
      maximum: 5000
    },

    compressorThreshold: {
      type: 'number',
      description: 'The decibel value above which the compression will start taking effect.',
      order: 32,
      'default': -24,
      minimum: -100,
      maximum: 0
    },
    compressorRatio: {
      type: 'number',
      description: 'The amount of change, in dB, needed in the input for a 1 dB change in the output.',
      order: 33,
      'default': 12,
      minimum: 1,
      maximum: 20
    },
    compressorKnee: {
      type: 'number',
      description: 'The decibel value representing the range above the threshold where the curve smoothly transitions to the compressed portion.',
      order: 34,
      'default': 30,
      minimum: 0,
      maximum: 40
    },
    //attack and release

    vibratoFrequency: {
      type: 'integer',
      description: 'Vibrato frequency(hz).',
      order: 35,
      'default': '20'
    },
    vibratoGain: {
      type: 'number',
      description: 'Vibrato gain.',
      order: 36,
      'default': '0'
    },
    vibratoType: {
      type: 'string',
      description: 'Vibrato wave type.',
      order: 37,
      'default': 'sine',
      enum: [
        {value: 'sine', description: 'sine wave'},
        {value: 'square', description: 'square wave'},
        {value: 'sawtooth', description: 'sawtooth wave'},
        {value: 'triangle', description: 'triangle wave'}
      ]
    },

    tremoloFrequency: {
      type: 'integer',
      description: 'Tremolo frequency(hz).',
      order: 38,
      'default': '20'
    },
    tremoloGain: {
      type: 'number',
      description: 'Tremolo gain.',
      order: 39,
      'default': '0'
    },
    tremoloType: {
      type: 'string',
      description: 'Tremolo wave type.',
      order: 40,
      'default': 'sine',
      enum: [
        {value: 'sine', description: 'sine wave'},
        {value: 'square', description: 'square wave'},
        {value: 'sawtooth', description: 'sawtooth wave'},
        {value: 'triangle', description: 'triangle wave'}
      ]
    },

    waveShaperAmount: {
      type: 'number',
      description: 'Wave shaper amount',
      order: 41,
      'default': 0,
      minimum: 0,
      maxmum: 1000
    },
    waveShaperOversample: {
      type: 'string',
      description: 'Wave shaper oversample.',
      order: 42,
      'default': 'none',
      enum: [
        {value: 'none', description: 'none'},
        {value: '2x', description: '2x'},
        {value: '4x', description: '4x'}
      ]
    },

    pannerDistanceModel: {
      type: 'string',
      description: 'An enumerated value determining which algorithm to use to reduce the volume of the audio source as it moves away from the listener.',
      order: 43,
      'default': 'linear',
      enum: [
        {value: 'linear', description: 'linear'},
        {value: 'inverse', description: 'inverse'},
        {value: 'exponential', description: 'exponential'}
      ]
    },
    pannerPanningModel: {
      type: 'string',
      description: 'An enumerated value determining which spatialisation algorithm to use to position the audio in 3D space.',
      order: 44,
      'default': 'equalpower',
      enum: [
        {value: 'equalpower', description: 'equalpower'},
        {value: 'HRTF', description: 'HRTF'}
      ]
    },
    pannerConeInnerAngle: {
      type: 'number',
      description: 'A double value describing the angle, in degrees, of a cone inside of which there will be no volume reduction.',
      order: 45,
      'default': 30,
      minimum: 0,
      maximum: 360
    },
    pannerConeOuterAngle: {
      type: 'number',
      description: 'A double value describing the angle, in degrees, of a cone outside of which the volume will be reduced by a constant value, defined by the coneOuterGain.',
      order: 46,
      'default': 60,
      minimum: 0,
      maximum: 360
    },
    pannerConeOuterGain: {
      type: 'number',
      description: 'A double value describing the amount of volume reduction outside the cone defined by the coneOuterAngle. Its default value is 0, meaning that no sound can be heard.',
      order: 47,
      'default': 1,
      minimum: 0
    },
    pannerMaxDistance: {
      type: 'number',
      description: 'A double value representing the maximum distance between the audio source and the listener, after which the volume is not reduced any further.',
      order: 48,
      'default': 10000,
      minimum: 0
    },
    pannerRefDistance: {
      type: 'number',
      description: 'A double value representing the reference distance for reducing volume as the audio source moves further from the listener.',
      order: 49,
      'default': 1
    },
    pannerRolloffFactor: {
      type: 'number',
      description: 'A double value describing how quickly the volume is reduced as the source moves away from the listener.',
      order: 50,
      'default': 1
    },

    pannerPositionX: {
      type: 'number',
      description: "Represents the horizontal position of the audio in a y-up right-hand cartesian coordinate system.",
      order: 51,
      'default': 0,
      minimum: -10000,
      maximum: 10000
    },
    pannerPositionY: {
      type: 'number',
      description: "Represents the vertical position of the audio in a y-up right-hand cartesian coordinate system.",
      order: 52,
      'default': 0,
      minimum: -10000,
      maximum: 10000
    },
    pannerPositionZ: {
      type: 'number',
      description: "Represents the longitudinal (back and forth) position of the audio in a y-up right-hand cartesian coordinate system.",
      order: 53,
      'default': -1,
      minimum: -10000,
      maximum: 10000
    },
    pannerOrientationX: {
      type: 'number',
      description: "Represents the horizontal position of the audio source's vector in a y-up right-hand cartesian coordinate system.",
      order: 54,
      'default': 0,
      minimum: -10000,
      maximum: 10000
    },
    pannerOrientationY: {
      type: 'number',
      description: "Represents the vertical position of the audio source's vector in a y-up right-hand cartesian coordinate system.",
      order: 55,
      'default': 0,
      minimum: -10000,
      maximum: 10000
    },
    pannerOrientationZ: {
      type: 'number',
      description: "Represents the longitudinal (back and forth) position of the audio source's vector in a y-up right-hand cartesian coordinate system.",
      order: 56,
      'default': 1,
      minimum: -10000,
      maximum: 10000
    },

    panMoverFrequency: {
      type: 'integer',
      description: 'PanMover frequency(hz).',
      order: 57,
      'default': '20'
    },
    panMoverGain: {
      type: 'number',
      description: 'PanMover gain.',
      order: 58,
      'default': '0'
    },
    panMoverType: {
      type: 'string',
      description: 'PanMover wave type.',
      order: 59,
      'default': 'sine',
      enum: [
        {value: 'sine', description: 'sine wave'},
        {value: 'square', description: 'square wave'},
        {value: 'sawtooth', description: 'sawtooth wave'},
        {value: 'triangle', description: 'triangle wave'}
      ]
    },
    panMoverTargetX: {
      type: 'boolean',
      descriptin: 'If this value set to true, Pan in the horizontal direction.',
      order: 60,
      'default': true
    },
    panMoverTargetY: {
      type: 'boolean',
      descriptin: 'If this value set to true, Pan in the vertical direction.',
      order: 61,
      'default': false
    },
    panMoverTargetZ: {
      type: 'boolean',
      descriptin: 'If this value set to true, Pan in the longitudinal direction.',
      order: 62,
      'default': false
    },

    japaneseKeybord: {
      type: 'boolean',
      description: 'If you use japanese keybord, set this',
      order: 63,
      default: 'false'
    }
  },

  initialize() {
    this.kName = 'pseudo-synthesizer';
    this.path = this.path = getActivatePackage(this.kName).path;

    this.toggled = false;   //toggle かどうか
    this.eventListeners = [];
    this.subscriptions = null;

    this.activeConfigs = {};  //configから取得した値を入れる
    this.audioContext = new AudioContext();

    this.sourceFiles = [];  //音源
    this.keyBinds = []; //キーと音源の対応
    this.irs = [];  //ImpulseResponse

    this.analyserPaneItem = null;
    this.analyserTimerIds = [];
    this.analyserPane = null;

    //FIXME
    this.activeConfigs.impluseResponseIndex = 0;

    this.filters = [];

    this.autoPlayIds = [];
  },

  activate() {
    this.initialize();
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pseudo-synthesizer:toggle': () => this.toggle(),
      'pseudo-synthesizer:analyser': () => this.toggleAnalyser(),
      'pseudo-synthesizer:startAutoPlay': () => this.startAutoPlay(),
      'pseudo-synthesizer:stopAutoPlay': () => this.stopAutoPlay(),
      'pseudo-synthesizer:settings': () => this.settings()
    }));

    this.createNodes();
    this.getConfigs();
    this.connectNodes([this.convolver, this.gainNode, this.waveShaper, this.delayNode, this.panner, this.compressor]);
    //this.setFilters();
    this.createAnalyserBuffer();

    this.initPeriodicWave();

    readKeyBind(this.activeConfigs.keyBindConfigFilePath)
      .then(this.setKeyBinds())
      .catch(this.failed()
    );

    isFileExist(path.join(this.path, '/data/ir'))
      .then((state) => {
        if(state === false) {
          readZip(path.join(this.path, '/data/ir.zip'), path.join(this.path, '/data/'))
            .then(getReadIR(this.activeConfigs.impulseResponseConfigFilePath, path.join(this.path, '/data/ir')))
            .then(this.decode(this, 'irs'))
            .then(this.setDecodedData(this, 'irs'))
            .catch(this.failed());
        } else {
          readIR(this.activeConfigs.impulseResponseConfigFilePath, path.join(this.path, '/data/ir'))
            .then(this.decode(this, 'irs'))
            .then(this.setDecodedData(this, 'irs'))
            .catch(this.failed());
        }
      });

    isFileExist(path.join(this.path, '/data/source'))
      .then((state) => {
        if(state === false) {
          readZip(path.join(this.path, '/data/source.zip'), path.join(this.path, '/data/'))
            .then(getReadSource(this.activeConfigs.sourceConfigFilePath, path.join(this.path, '/data/source')))
            .then(this.decode(this, 'sourceFiles'))
            .then(this.setDecodedData(this, 'sourceFiles'))
            .then(this.setKeyData())
            .catch(this.failed())
        } else {
          readSource(this.activeConfigs.sourceConfigFilePath, path.join(this.path, '/data/source'))
            .then(this.decode(this, 'sourceFiles'))
            .then(this.setDecodedData(this, 'sourceFiles'))
            .then(this.setKeyData())
            .catch(this.failed());
        }
      });

    atom.workspace.addOpener(
      (uri) => {
        if(uri === this.kName + '://Analyser') {
          let view = new KeyBindView();
          return view;
        }
        return null;
      }
    );
  },

  /*
  configs
  */

  getConfigs() {
    this.activeConfigs.japaneseKeybord = getConfigAndSetOnDidChange(
      this.kName + '.japaneseKeybord', this.subscriptions, this.changeJpaneseKeybord());

    this.getPathConfigs();
    this.convolver.normalize = getConfigAndSetOnDidChange(
      this.kName + '.impluseResponseNormalize', this.subscriptions, setChangedConfig(this.convolver, 'normalize'));

    this.activeConfigs.useSourceFile = getConfigAndSetOnDidChange(
      this.kName + '.useSourceFile', this.subscriptions, setChangedConfig(this.activeConfigs, 'useSourceFile'));

    this.activeConfigs.autoPlayInterval = getConfigAndSetOnDidChange(
      this.kName + '.autoPlayInterval', this.subscriptions, setChangedConfig(this.activeConfigs, 'autoPlayInterval'));

    this.activeConfigs.detune = getConfigAndSetOnDidChange(
      this.kName + '.detune', this.subscriptions, setChangedConfig(this.activeConfigs, 'detune'));
    this.activeConfigs.playbackRate = getConfigAndSetOnDidChange(
      this.kName + '.playbackRate', this.subscriptions, setChangedConfig(this.activeConfigs, 'playbackRate'));
    this.activeConfigs.impluseResponseIndex = getConfigAndSetOnDidChange(
      this.kName + '.impluseResponseIndex', this.subscriptions, setChangedConfig(this.activeConfigs, 'impluseResponseIndex')); //FIXME

    this.getSourceOscillatorConfigs();
    this.getEnvelope();
    this.gainNode.gain.value = getConfigAndSetOnDidChange(
      this.kName + '.gain', this.subscriptions, setChangedConfig(this.gainNode.gain, 'value'));
    this.getVibratorConfigs();
    this.getTremolorConfigs();
    this.getAnalyserConfigs();
    this.delayNode.delayTime.value = getConfigAndSetOnDidChange(
      this.kName + '.delayTime', this.subscriptions, setChangedConfig(this.delayNode.delayTime, 'value'));
    this.getCompressorConfigs();
    this.getWaveSharperConfigs();
    this.getPannerConfigs();
    this.getPanMoverConfigs();
  },
  getPathConfigs() {
    this.activeConfigs.keyBindConfigFilePath = getConfigAndSetOnDidChange(
      this.kName + '.keyBindConfigFilePath', this.subscriptions, this.changeKeyBindConfigFilePath());
    this.setDefaultKeyBindConfigFilePath();
    this.activeConfigs.sourceConfigFilePath = getConfigAndSetOnDidChange(
      this.kName + '.sourceConfigFilePath', this.subscriptions, this.changeSourceConfigFilePath());
    this.activeConfigs.sourceConfigFilePath = returnValueIfEmpty(this.activeConfigs.sourceConfigFilePath, path.join(this.path, '/data/sources.cson'));

    this.activeConfigs.impulseResponseConfigFilePath = getConfigAndSetOnDidChange(
      this.kName + '.impulseResponseConfigFilePath', this.subscriptions, this.changeImpluseResponseConfigFilePath());
    this.activeConfigs.impulseResponseConfigFilePath = returnValueIfEmpty(this.activeConfigs.impulseResponseConfigFilePath, path.join(this.path, '/data/impulse-response.cson'));
  },
  getSourceOscillatorConfigs() {
    this.activeConfigs.sourceOscillatorWaveType = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorWaveType', this.subscriptions, setChangedConfig(this.activeConfigs, 'sourceOscillatorWaveType'));
    this.activeConfigs.sourceOscillatorBaseFrequency = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorBaseFrequency', this.subscriptions, setChangedConfig(this.activeConfigs, 'sourceOscillatorBaseFrequency'));
    this.activeConfigs.sourceOscillatorLength = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorLength', this.subscriptions, setChangedConfig(this.activeConfigs, 'sourceOscillatorLength'));
    this.activeConfigs.sourceOscillatorOvertoneNumber = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorOvertoneNumber', this.subscriptions, setChangedConfig(this.activeConfigs, 'sourceOscillatorOvertoneNumber'));
    this.activeConfigs.sourceOscillatorCustomWaveFilePath = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorCustomWaveFilePath', this.subscriptions, this.changeCustomWaveFilePath());
    this.activeConfigs.sourceOscillatorCustomWaveNormalize = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorCustomWaveNormalize', this.subscriptions, this.changeCustomWaveNormalize());
  },
  getVibratorConfigs() {
    this.vibrator.gain.value = getConfigAndSetOnDidChange(
      this.kName + '.vibratoGain', this.subscriptions, setChangedConfig(this.vibrator.gain, 'value'));
    this.vibrator.oscillator.frequency.value = getConfigAndSetOnDidChange(
      this.kName + '.vibratoFrequency', this.subscriptions, setChangedConfig(this.vibrator.oscillator.frequency, 'value'));
    this.vibrator.oscillator.type = getConfigAndSetOnDidChange(
      this.kName + '.vibratoType', this.subscriptions, setChangedConfig(this.vibrator.oscillator, 'type'));
  },
  getTremolorConfigs() {
    this.tremolor.gain.value = getConfigAndSetOnDidChange(
      this.kName + '.tremoloGain', this.subscriptions, setChangedConfig(this.tremolor.gain, 'value'));
    this.tremolor.oscillator.frequency.value = getConfigAndSetOnDidChange(
      this.kName + '.tremoloFrequency', this.subscriptions, setChangedConfig(this.tremolor.oscillator.frequency, 'value'));
    this.tremolor.oscillator.type = getConfigAndSetOnDidChange(
      this.kName + '.tremoloType', this.subscriptions, setChangedConfig(this.tremolor.oscillator, 'type'));
  },
  getAnalyserConfigs() {
    this.analyser.fftSize = getConfigAndSetOnDidChange(
      this.kName + '.analyserSize', this.subscriptions, this.setAnalyser('fftSize'));
    this.analyser.minDecibels = getConfigAndSetOnDidChange(
      this.kName + '.analyserMinDecibels', this.subscriptions, this.setAnalyser('minDecibels'));
    this.analyser.maxDecibels = getConfigAndSetOnDidChange(
      this.kName + '.analyserMaxDecibels', this.subscriptions, this.setAnalyser('maxDecibels'));
    this.analyser.smoothingTimeConstant = getConfigAndSetOnDidChange(
      this.kName + '.analyserSmoothingTimeConstant', this.subscriptions, this.setAnalyser('smoothingTimeConstant'));
    this.activeConfigs.analyserInterval = getConfigAndSetOnDidChange(
      this.kName + '.analyserInterval', this.subscriptions, this.changeAnalyserInterval());
  },
  getCompressorConfigs() {
    this.compressor.threshold.value = getConfigAndSetOnDidChange(
      this.kName + '.compressorThreshold', this.subscriptions, setChangedConfig(this.compressor.threshold, 'value'));
    this.compressor.ratio.value = getConfigAndSetOnDidChange(
      this.kName + '.compressorRatio', this.subscriptions, setChangedConfig(this.compressor.ratio, 'value'));
    this.compressor.knee.value = getConfigAndSetOnDidChange(
      this.kName + '.compressorKnee', this.subscriptions, setChangedConfig(this.compressor.knee, 'value'));
  },
  getWaveSharperConfigs() {
    this.activeConfigs.waveShaperAmount = getConfigAndSetOnDidChange(
      this.kName + '.waveShaperAmount', this.subscriptions, this.changeWaveShaperAmount());
    this.waveShaper.curve = this.makeDistortionCurve(this.activeConfigs.waveShaperAmount);
    this.waveShaper.oversample = getConfigAndSetOnDidChange(
      this.kName + '.waveShaperOversample', this.subscriptions, setChangedConfig(this.waveShaper, 'oversample'));
  },
  getPannerConfigs() {
    this.panner.distanceModel = getConfigAndSetOnDidChange(
      this.kName + '.pannerDistanceModel', this.subscriptions, setChangedConfig(this.panner, 'distanceModel'));
    this.panner.panningModel = getConfigAndSetOnDidChange(
      this.kName + '.pannerPanningModel', this.subscriptions, setChangedConfig(this.panner, 'panningModel'));
    this.panner.maxDistance = getConfigAndSetOnDidChange(
      this.kName + '.pannerMaxDistance', this.subscriptions, setChangedConfig(this.panner, 'maxDistance'));
    this.panner.refDistance = getConfigAndSetOnDidChange(
      this.kName + '.pannerRefDistance', this.subscriptions, setChangedConfig(this.panner, 'refDistance'));
    this.panner.rolloffFactor = getConfigAndSetOnDidChange(
      this.kName + '.pannerRolloffFactor', this.subscriptions, setChangedConfig(this.panner, 'rolloffFactor'));
    this.panner.coneInnerAngle = getConfigAndSetOnDidChange(
      this.kName + '.pannerConeInnerAngle', this.subscriptions, setChangedConfig(this.panner, 'coneInnerAngle'));
    this.panner.coneOuterAngle = getConfigAndSetOnDidChange(
      this.kName + '.pannerConeOuterAngle', this.subscriptions, setChangedConfig(this.panner, 'coneOuterAngle'));
    this.panner.coneOuterGain = getConfigAndSetOnDidChange(
      this.kName + '.pannerConeOuterGain', this.subscriptions, setChangedConfig(this.panner, 'coneOuterGain'));
    this.panner.positionX.value = getConfigAndSetOnDidChange(
      this.kName + '.pannerPositionX', this.subscriptions, setChangedConfig(this.panner.positionX, 'value'));
    this.panner.positionY.value = getConfigAndSetOnDidChange(
      this.kName + '.pannerPositionY', this.subscriptions, setChangedConfig(this.panner.positionY, 'value'));
    this.panner.positionZ.value = getConfigAndSetOnDidChange(
      this.kName + '.pannerPositionZ', this.subscriptions, setChangedConfig(this.panner.positionZ, 'value'));
    this.panner.orientationX.value = getConfigAndSetOnDidChange(
      this.kName + '.pannerOrientationX', this.subscriptions, setChangedConfig(this.panner.orientationX, 'value'));
    this.panner.orientationY.value = getConfigAndSetOnDidChange(
      this.kName + '.pannerOrientationY', this.subscriptions, setChangedConfig(this.panner.orientationY, 'value'));
    this.panner.orientationZ.value = getConfigAndSetOnDidChange(
      this.kName + '.pannerOrientationZ', this.subscriptions, setChangedConfig(this.panner.orientationZ, 'value'));
  },
  getPanMoverConfigs() {
    this.panMover.gain.value = getConfigAndSetOnDidChange(
    this.kName + '.panMoverGain', this.subscriptions, setChangedConfig(this.panMover.gain, 'value'));
    this.panMover.oscillator.frequency.value = getConfigAndSetOnDidChange(
    this.kName + '.panMoverFrequency', this.subscriptions, setChangedConfig(this.panMover.oscillator.frequency, 'value'));
    this.panMover.oscillator.type = getConfigAndSetOnDidChange(
    this.kName + '.panMoverType', this.subscriptions, setChangedConfig(this.panMover.oscillator, 'type'));
    this.activeConfigs.panMoverTargetX = getConfigAndSetOnDidChange(
    this.kName + '.panMoverTargetX', this.subscriptions, this.changePanMoverTareget('X'));
    this.activeConfigs.panMoverTargetY = getConfigAndSetOnDidChange(
    this.kName + '.panMoverTargetY', this.subscriptions, this.changePanMoverTareget('Y'));
    this.activeConfigs.panMoverTargetZ = getConfigAndSetOnDidChange(
    this.kName + '.panMoverTargetZ', this.subscriptions, this.changePanMoverTareget('Z'));
    this.connectPanMover();
  },
  getEnvelope() {
    this.activeConfigs.sourceOscillatorEnvelopeAttackTime = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorEnvelopeAttackTime', this.subscriptions, setChangedConfig(this.activeConfigs, 'sourceOscillatorEnvelopeAttackTime'));
    this.activeConfigs.sourceOscillatorEnvelopeAttackAmplitude = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorEnvelopeAttackAmplitude', this.subscriptions, setChangedConfig(this.activeConfigs, 'sourceOscillatorEnvelopeAttackAmplitude'));

    this.activeConfigs.sourceOscillatorEnvelopeDecayTime = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorEnvelopeDecayTime', this.subscriptions, setChangedConfig(this.activeConfigs, 'sourceOscillatorEnvelopeDecayTime'));
    this.activeConfigs.sourceOscillatorEnvelopeDecayAmplitude = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorEnvelopeDecayAmplitude', this.subscriptions, setChangedConfig(this.activeConfigs, 'sourceOscillatorEnvelopeDecayAmplitude'));

    this.activeConfigs.sourceOscillatorEnvelopeSustainTime = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorEnvelopeSustainTime', this.subscriptions, setChangedConfig(this.activeConfigs, 'sourceOscillatorEnvelopeSustainTime'));
    this.activeConfigs.sourceOscillatorEnvelopeSustainAmplitude = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorEnvelopeSustainAmplitude', this.subscriptions, setChangedConfig(this.activeConfigs, 'sourceOscillatorEnvelopeSustainAmplitude'));

    this.activeConfigs.sourceOscillatorEnvelopeReleaseTime = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorEnvelopeReleaseTime', this.subscriptions, setChangedConfig(this.activeConfigs, 'sourceOscillatorEnvelopeReleaseTime'));
    this.activeConfigs.sourceOscillatorEnvelopeReleaseAmplitude = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorEnvelopeReleaseAmplitude', this.subscriptions, setChangedConfig(this.activeConfigs, 'sourceOscillatorEnvelopeReleaseAmplitude'));
    this.activeConfigs.sourceOscillatorEnvelopeRampType = getConfigAndSetOnDidChange(
      this.kName + '.sourceOscillatorEnvelopeRampType', this.subscriptions, setChangedConfig(this.activeConfigs, 'sourceOscillatorEnvelopeRampType'));
  },

  setDefaultKeyBindConfigFilePath() {
    if (this.activeConfigs.japaneseKeybord === true) {
      this.activeConfigs.keyBindConfigFilePath = returnValueIfEmpty(this.activeConfigs.keyBindConfigFilePath, path.join(this.path, '/data/keybind-japanese01.cson'));
    } else {
      this.activeConfigs.keyBindConfigFilePath = returnValueIfEmpty(this.activeConfigs.keyBindConfigFilePath, path.join(this.path, '/data/keybind01.cson'));
    }
  },
  changeJpaneseKeybord() {
    return (evt) => {
      this.activeConfigs.japaneseKeybord = evt.newValue;
      let currentPath = atom.config.get(this.kName + '.keyBindConfigFilePath');
      if(currentPath !== '') {
        return;
      }
      this.activeConfigs.keyBindConfigFilePath = '';
      this.setDefaultKeyBindConfigFilePath();
      readKeyBind(this.activeConfigs.keyBindConfigFilePath)
        .then(this.setKeyBinds())
        .then(this.setKeyData())
        .catch(this.failed());
    }
  },
  changeKeyBindConfigFilePath() {
    return (evt) => {
      this.activeConfigs.keyBindConfigFilePath = evt.newValue;
      this.setDefaultKeyBindConfigFilePath();
      readKeyBind(this.activeConfigs.keyBindConfigFilePath)
        .then(this.setKeyBinds())
        .then(this.setKeyData())
        .catch(this.failed());
    }
  },
  changeImpluseResponseConfigFilePath() {
    return (evt) => {
      this.activeConfigs.impulseResponseConfigFilePath = evt.newValue;
      this.activeConfigs.impulseResponseConfigFilePath = returnValueIfEmpty(this.activeConfigs.impulseResponseConfigFilePath, path.join(this.path, '/data/impulse-response.cson'));
      readIR(this.activeConfigs.impulseResponseConfigFilePath, path.join(this.path, '/data/ir/'))
        .then(this.decode(this, 'irs')).then(this.setDecodedData(this, 'irs')).catch(this.failed());
    }
  },
  changeSourceConfigFilePath() {
    return (evt) => {
      this.activeConfigs.sourceConfigFilePath = evt.newValue;
      this.activeConfigs.sourceConfigFilePath = returnValueIfEmpty(this.activeConfigs.sourceConfigFilePath, path.join(this.path, '/data/sources.cson'));
      readSource(this.activeConfigs.sourceConfigFilePath, path.join(this.path, '/data/source/'))
        .then(this.decode(this, 'sourceFiles')).then(this.setDecodedData(this, 'sourceFiles')).catch(this.failed()).then(this.setKeyData());
    }
  },

  changeWaveShaperAmount() {
    return (evt) => {
      this.activeConfigs.waveShaperAmount = evt.newValue;
      this.waveShaper.curve = this.makeDistortionCurve(this.activeConfigs.waveShaperAmount);
    }
  },
  changeAnalyserInterval() {
    return (evt) => {
      this.activeConfigs.analyserInterval = evt.newValue;
      if(this.analyserPane !== null) {
        this.stopAnalyserAnimation();
        this.startAnalyserAnimation();
      }
    };
  },
  initPeriodicWave() {
    if(this.activeConfigs.sourceOscillatorCustomWaveFilePath !== '') {
      readPeriodicWave(this.activeConfigs.sourceOscillatorCustomWaveFilePath)
      .then(this.getMakePeriodicWave())
      .catch(this.failed());
    } else {
      this.activeConfigs.periodicWaveData = null;
      this.periodicWave = this.makePeriodicWave();
    }
  },
  changeCustomWaveFilePath() {
    return (evt) => {
      this.activeConfigs.sourceOscillatorCustomWaveFilePath = evt.newValue;
      this.initPeriodicWave();
    };
  },
  changeCustomWaveNormalize() {
    return (evt) => {
      this.activeConfigs.sourceOscillatorCustomWaveNormalize = evt.newValue;
      this.periodicWave = this.makePeriodicWave();
    };
  },
  getMakePeriodicWave() {
    return (data) => {
      this.activeConfigs.periodicWaveData = data;
      this.periodicWave = this.makePeriodicWave();
    }
  },

  createNodes() {
    this.convolver = this.audioContext.createConvolver();
    this.gainNode = this.audioContext.createGain();
    this.delayNode = this.audioContext.createDelay(10.0);
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.analyser = this.audioContext.createAnalyser();
    this.vibrator = this.createEffector(0, 20, 'sine');
    this.tremolor = this.createEffector(0, 20, 'sine');
    this.panMover = this.createEffector(0, 20, 'sine');
    this.waveShaper = this.audioContext.createWaveShaper();
    this.panner = this.audioContext.createPanner();
  },

  connectNodes(nodes) {
    for(let i = 0; i < nodes.length - 1; ++i) {
      nodes[i].connect(nodes[i + 1]);
    }
    nodes[nodes.length -1].connect(this.audioContext.destination);
    nodes[nodes.length -1].connect(this.analyser);
    this.tremolor.connect(this.gainNode.gain);

  },
  changePanMoverTareget(direction) {
    return (evt) => {
      switch (direction) {
        case 'X':
          this.activeConfigs.panMoverTargetX = evt.newValue;
          break;
        case 'Y':
          this.activeConfigs.panMoverTargetY = evt.newValue;
          break;
        case 'Z':
          this.activeConfigs.panMoverTargetZ = evt.newValue;
          break;
        default:
          this.activeConfigs.panMoverTargetX = false;
          this.activeConfigs.panMoverTargetY = false;
          this.activeConfigs.panMoverTargetZ = false;
      }
      this.connectPanMover();
    }
  },
  connectPanMover() {
    this.panMover.disconnect();
    if(this.activeConfigs.panMoverTargetX === true) {
      this.panMover.connect(this.panner.positionX);
    }
    if(this.activeConfigs.panMoverTargetY === true) {
      this.panMover.connect(this.panner.positionY);
    }
    if(this.activeConfigs.panMoverTargetZ === true) {
      this.panMover.connect(this.panner.positionZ);
    }
  },

  deactivate() {
    this.subscriptions.dispose();
    this.audioContext.close();
  },

  /*
  commands
  */
  toggle() {
    if(this.toggled === false) {
      this.toggled = true;
      this.setEventListeners();
    } else {
      this.toggled = false;
      disposeEventListeners(this.eventListeners);
      this.eventListeners = [];
    }
  },

  /*
  analyser
  */
  setAnalysePaneItem() {
    return (data) => {
      this.analyserPaneItem = data;
      this.analyserPaneItem.setCanvus(this.analyser.fftSize);
      this.startAnalyserAnimation();
      this.analyserPane = atom.workspace.paneForURI(this.kName + '://Analyser');
      this.analyserPane.onDidDestroy(this.destroyAnalyser());

      //フォーカスを移す
      this.pane.activate();
      if(this.pane.activeItem instanceof TextEditor) {
        this.pane.activeItem.scrollToCursorPosition();
      }
    };
  },
  startAnalyserAnimation() {
    this.analyserTimerIds = [];
    this.analyserTimerIds.push(
      setInterval(this.getAnalysedData(), this.activeConfigs.analyserInterval));
    this.analyserTimerIds.push(
      setInterval(this.analyserPaneItem.draw(this.domainByteDatas, 'domain'), this.activeConfigs.analyserInterval));
    this.analyserTimerIds.push(
      setInterval(this.analyserPaneItem.draw(this.frequencyByteDatas, 'frequency'), this.activeConfigs.analyserInterval));
  },
  stopAnalyserAnimation() {
    for(let id of this.analyserTimerIds) {
      clearInterval(id);
    }
    this.analyserTimerIds = [];
  },
  destroyAnalyser() {
    return () => {
      this.stopAnalyserAnimation();
      this.analyserPane = null;
      this.analyserPaneItem = null;
    };
  },
  toggleAnalyser() {
    if(this.analyserPane === null) {
      this.pane = atom.workspace.getActivePane();
      this.openAnalyser();
    } else {
      this.closeAnalyser();
    }
  },
  openAnalyser() {
    atom.workspace.open(this.kName + '://Analyser', {split: 'down'}).then(this.setAnalysePaneItem());
  },
  closeAnalyser() {
    this.analyserPane.destroyItem(this.analyserPaneItem);
    this.analyserPane = null;
    this.analyserPaneItem = null;
  },

  makeOscillatorGain(type, frequency, detune, gain) {
    let oscillator = this.audioContext.createOscillator();
    let gainNode = this.audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.detune.value = detune;
    gainNode.gain.value = gain;
    oscillator.connect(gainNode);
    gainNode.oscillator = oscillator;
    return gainNode;
  },

  //activate
  settings() {
    atom.workspace.open('atom://config/packages/' + this.kName);
  },

  decode(target, property) {
    return (objs)=> {
      target[property] = objs;
      let promises = [];
      for(let obj of objs) {
        promises.push(this.audioContext.decodeAudioData(obj.fileData));
      }
      return Promise.all(promises);
    }
  },

  setDecodedData(target, property) {
    return (audioDatas) => {
      if(target[property].length !== audioDatas.length) {
        atom.notifications.addError('Decode error.',
        {detail: `${property}.length: ${target[property].length}, audioDatas.length: ${audioDatas.length}`,
        dismissable: true});
        return;
      }

      for(let i = 0; i < target[property].length; ++i) {
        target[property][i].fileData = audioDatas[i];
      }
      atom.notifications.addInfo('Decode done.',
        {detail: `audioDatas.length: ${audioDatas.length}`, dismissable: false});
    }
  },

  playAudioData(audioData, time) {
    if(audioData === null) {
      return;
    }

    let source = this.audioContext.createBufferSource();
    //source.connect(this.filters[0]);
    this.connectConvolverOrGain(source, this.activeConfigs.impluseResponseIndex, true);

    source.buffer = audioData;
    source.detune.value = this.activeConfigs.detune;
    source.playbackRate.value = this.activeConfigs.playbackRate;
    this.vibrator.connect(source.detune);
    source.onended = ()=> {
      source.disconnect();
      this.vibrator.disconnect(source.detune);  //FIXME 演奏中にuseSourceFileを切り替えると例外が発生する?
    }
    source.start(time);
  },

  play(keyBind, time) {
    if(keyBind === null) {
      return;
    }
    if(this.activeConfigs.useSourceFile === true && keyBind.fileData !== null) {
      this.playAudioData(keyBind.fileData, time);
    } else {
      this.makeSound(keyBind.name, time);
    }
  },

  getKeyCode() {
    return (evt)=> {
      //let keyStroke = atom.keymaps.keystrokeForKeyboardEvent(evt);

      //複数の音を同時に鳴らすことも考えての処理
      //単純な線形探索の方がましかもしれない
      let ret = binarySearch(this.keyBinds, evt, KeyBind.compare);
      if(ret === -1) {
        return;
      }
      let time = this.audioContext.currentTime + 0.05; //処理の時間を考慮して加算しているがもっと最適化したい
      console.log(this.keyBinds[ret]);
      this.play(this.keyBinds[ret], time);

      for(let i = ret - 1; i > 0; --i) {
        if(KeyBind.compare(evt, this.keyBinds[i]) !== 0) {
          break;
        }
        this.play(this.keyBinds[i], time);
      }
      for(let i = ret + 1; i < this.keyBinds.length; ++i) {
        if(KeyBind.compare(evt, this.keyBinds[i]) !== 0) {
          break;
        }
        this.play(this.keyBinds[i], time);
      }
    }
  },

  /*
  stop() {
    return (evt)=> {
      let keyStroke = atom.keymaps.keystrokeForKeyboardEvent(evt);
      keyStroke = keyStroke.substring(1);
      for(let keyBind of this.keyBinds) {
        if(keyStroke === keyBind.key) {
          keyBind.fileData.stop(0);
        }
      }
    }
  },*/

  setEventListeners() {
    let element = atom.views.getView(atom.workspace.getActivePane()); //FIXME activePane?
    this.eventListeners.push(setEventListener(element, 'keydown', this.getKeyCode(), false));
  },

  failed() {
    return (err) => {
      atom.notifications.addError('Error in promise.', {detail: err, dismissable: true});
    };
  },

  writeSuccess(filePath) {
    atom.notifications.addSuccess('Write to file was successful', {detail: filePath, dismissable: false});
  },

  makeSound(name, time) {
    const scales = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const scaleCents = [-900, -800, -700, -600, -500, -400, -300, -200, -100, 0, 100, 200];
    //const octaves = ['-1', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    //const octaveCents = [-6000, -4800, -3600, -2400, -1200, 0, 1200, 2400, 3600, 4800, 6000];
    const reg = /([A-G]#?)(-?\d+)/;

    let result = reg.exec(name);
    if(result === null) {
      return;
    }
    let cent = 0;
    for(let i = 0; i < scales.length; ++i) {
      if(result[1] === scales[i]) {
        cent = scaleCents[i];
        break;
      }
    }

    let waveType = this.activeConfigs.sourceOscillatorWaveType;
    if(waveType === 'custom'){
      waveType = 'sine'
    }

    cent += (parseInt(result[2], 10) - 4) * 1200;
    let oscGains = [];
    let gainNode = this.audioContext.createGain();
    for(let i = 0; i < this.activeConfigs.sourceOscillatorOvertoneNumber; ++i ) {
      let oscGain = this.makeOscillatorGain(
        waveType,
        this.activeConfigs.sourceOscillatorBaseFrequency,
        cent + 1200*Math.log2(i + 1) + this.activeConfigs.detune,
        1 / this.activeConfigs.sourceOscillatorOvertoneNumber
        //1 - (i * 1 / this.activeConfigs.sourceOscillatorOvertoneNumber)
      );
      if(this.activeConfigs.sourceOscillatorWaveType === 'custom' && this.periodicWave !== null) {
        oscGain.oscillator.setPeriodicWave(this.periodicWave);
      }
      oscGain.connect(gainNode);
      oscGains.push(oscGain);
    }

    gainNode.gain.value = 1;
    //let time = this.audioContext.currentTime;
    this.connectConvolverOrGain(gainNode, this.activeConfigs.impluseResponseIndex, true);
    for(let oscGain of oscGains ) {
      this.vibrator.connect(oscGain.oscillator.detune);
      oscGain.oscillator.start(time);
      oscGain.oscillator.stop(time + this.activeConfigs.sourceOscillatorLength);
      oscGain.oscillator.onended = ()=> {
        oscGain.disconnect();
        gainNode.disconnect();  //原理的には全ての音が同時に止まるはずなのでここで良い
        this.vibrator.disconnect(oscGain.oscillator.detune); //FIXME 演奏中にuseSourceFileを切り替えると例外が発生する?
      }
    }
    this.envelope(gainNode, time);
  },

  envelope(gainNode, startTime) {
    let ramp = null;
    if(this.activeConfigs.sourceOscillatorEnvelopeRampType === 'linear') {
      ramp = (value, endTime) => {
        gainNode.gain.exponentialRampToValueAtTime(value, endTime);
      };
    } else {
      ramp = (value, endTime) => {
        gainNode.gain.linearRampToValueAtTime(value, endTime);
      };
    }

    let time = 0;
    gainNode.gain.setValueAtTime(1.0e-30, startTime);//0, 1.40130e-45 だと動かない
    time += this.activeConfigs.sourceOscillatorLength * this.activeConfigs.sourceOscillatorEnvelopeAttackTime;
    ramp(
      this.activeConfigs.sourceOscillatorEnvelopeAttackAmplitude,
      startTime + time);
    time += this.activeConfigs.sourceOscillatorLength * this.activeConfigs.sourceOscillatorEnvelopeDecayTime;
    ramp(
      this.activeConfigs.sourceOscillatorEnvelopeDecayAmplitude,
      startTime + time);
    time += this.activeConfigs.sourceOscillatorLength * this.activeConfigs.sourceOscillatorEnvelopeSustainTime;
    ramp(
      this.activeConfigs.sourceOscillatorEnvelopeSustainAmplitude,
      startTime + time);
    time += this.activeConfigs.sourceOscillatorLength * this.activeConfigs.sourceOscillatorEnvelopeReleaseTime;
    ramp(
      this.activeConfigs.sourceOscillatorEnvelopeReleaseAmplitude,
      startTime + time);
  },

  makePeriodicWave() {
    if(this.activeConfigs.periodicWaveData !== null) {
      return this.audioContext.createPeriodicWave(
        this.activeConfigs.periodicWaveData[0],
        this.activeConfigs.periodicWaveData[1],
        {disableNormalization: this.activeConfigs.sourceOscillatorCustomWaveNormalize});
    }

    let overtone = 8;
    let real = new Float32Array(overtone);
    let imag = new Float32Array(overtone);
    real[0] = 0;
    imag[0] = 0;
    for(let i = 1; i < overtone; ++i) {
      if(i % 2 === 0) {
        real[i] = 1 * (i / overtone);
        imag[i] = 0;
      } else {
        real[i] = 0;
        imag[i] = 1 * (1 - i / 32);
      }
    }
    return this.audioContext.createPeriodicWave(real, imag,
      {disableNormalization: this.activeConfigs.sourceOscillatorCustomWaveNormalize});
  },

  /*
  filters
  */
  setFilters() {
    if(this.filters.length > 0) {
      let i;
      for(i = 0; i < this.filters.length -1; ++i) {
        this.filters[i].connect(this.filters[i + 1]);
      }
      this.filters[i].connect(this.gainNode);
    }
    this.filters.push(this.gainNode);
  },

  connectConvolverOrGain(source, index) {
    if(index < 0 || index > this.irs.length -1 ) {
      source.connect(this.gainNode);
      return;
    }
    source.connect(this.convolver);
    this.convolver.buffer = this.irs[index].fileData;
  },

  //for vibrator and tremolor
  createEffector(gain, frequency, type) {
    let oscillator = this.audioContext.createOscillator();
    let gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    oscillator.frequency = frequency;
    oscillator.type = type;
    gainNode.gain.value = gain;
    gainNode.oscillator = oscillator;
    oscillator.start();
    return gainNode;
  },

  createAnalyserBuffer() {
    this.frequencyByteDatas = new Uint8Array(this.analyser.frequencyBinCount);
    this.domainByteDatas = new Uint8Array(this.analyser.fftSize);
    //this.frequencyFloatDatas = new Float32Array(this.analyser.frequencyBinCount);
    //this.domainFloatDatas = new Float32Array(this.analyser.fftSize);
  },

  //MinDecibels and MaxDecibels
  setAnalyser(property) {
    return (evt) => {
      this.analyser[property] = evt.newValue;
      if(property === 'fftSize') {
        this.createAnalyserBuffer();
        if(this.analyserPane !== null) {
          this.closeAnalyser();
          this.openAnalyser();
        }
      }
    }
  },

  getAnalysedData() {
    return ()=> {
      this.analyser.getByteFrequencyData(this.frequencyByteDatas);
      this.analyser.getByteTimeDomainData(this.domainByteDatas);
      //this.analyser.getFloatFrequencyData(this.frequencyFloatDatas);
      //this.analyser.getFloatTimeDomainData(this.domainFloatDatas);
    }
  },

  setKeyBinds() {
    return (datas) => {
      this.keyBinds = [];
      for(let data of datas) {
        if(data.keyCode !== -1) {
          this.keyBinds.push(data);
        }
      }
    }
  },

  setKeyData() {
    return () => {
      for(let keyBind of this.keyBinds) {
        for(let sourceFile of this.sourceFiles) {
          if(keyBind.name === sourceFile.name) {
            keyBind.fileData = sourceFile.fileData;
          }
        }
      }
      this.sortKeyBind();
      atom.notifications.addInfo('Key bind done.',
        {detail: `keyBinds.length: ${this.keyBinds.length}, sourceFiles.length: ${this.sourceFiles.length}`,
        dismissable: false});
    }
  },

  getPlay(keyBinds){
    return () => {
      for(let keyBind of keyBinds) {
        this.play(keyBind, this.audioContext.currentTime);
      }
    }
  },

  startAutoPlay() {
    let editor = atom.workspace.getActiveTextEditor();
    if(!editor) {
      return;
    }
    this.stopAutoPlay();
    let text = editor.getText();
    let score = this.getScore(text);
    let i = 0;

    for(let data of score) {
      for(let chars of data) {
        let keyBinds = [];
        for(let char of chars) {
          let keyBind = this.getKeyBindFromChar(char);
          if(keyBind !== null) {
            keyBinds.push(keyBind);
          }
        }
        this.autoPlayIds.push(setTimeout(this.getPlay(keyBinds), this.activeConfigs.autoPlayInterval * i++));
      }
    }
/*
    let i = 0;
    for(let char of text) {
      let keyBind = this.getKeyBindFromChar(char);
      if(keyBind !== null) {
        this.autoPlayIds.push(setTimeout(this.getPlay([keyBind]), this.activeConfigs.autoPlayInterval * i++));
      }
    }
*/
    atom.notifications.addInfo(
      `Number of playable characters : ${i}.\nPlay times(sec) : ` + (this.activeConfigs.autoPlayInterval * i / 1000).toString(10),
      {dismissable: true});
  },
  stopAutoPlay() {
    for(let id of this.autoPlayIds) {
      clearTimeout(id);
    }
    this.autoPlayIds = [];
  },
  getScore(text) {
    let lines = text.replace(/\r\n/g, '\n').split('\n');
    let score = [[[]]];
    let pos = 0;
    for(let line of lines) {
      if(line.length === 0) {
        score.push([[]]);
        ++pos;
        continue;
      }
      let j = 0;
      for(let i = 0; i < line.length; ++i) {
        if(score[pos].length < line.length) {
          score[pos].length = line.length;
        }
        if(Object.prototype.toString.call(score[pos][j]) !== '[object Array]') {
          score[pos][j] = [];
        }
        if(line[i] !== ' ') {
          score[pos][j].push(line[i]);
        }
        j++;
      }
    }
    return score;
  },

  getKeyBindFromChar(char) {
    const kKeyCodesJP = {
      a: [65, false], b: [66, false], c: [67, false], d: [68, false], e: [69, false],
      f: [70, false], g: [71, false], h: [72, false], i: [73, false], j: [74, false],
      k: [75, false], l: [76, false], m: [77, false], n: [78, false], o: [79, false],
      p: [80, false], q: [81, false], r: [82, false], s: [83, false], t: [84, false],
      u: [85, false], v: [86, false], w: [87, false], x: [88, false], y: [89, false],
      z: [90, false],
      A: [65, true], B: [66, true], C: [67, true], D: [68, true], E: [69, true],
      F: [70, true], G: [71, true], H: [72, true], I: [73, true], J: [74, true],
      K: [75, true], L: [76, true], M: [77, true], N: [78, true], O: [79, true],
      P: [80, true], Q: [81, true], R: [82, true], S: [83, true], T: [84, true],
      U: [85, true], V: [86, true], W: [87, true], X: [88, true], Y: [89, true],
      Z: [90, true],
      '0': [48, false], '1': [49, false], '2': [50, false], '3': [51, false], '4': [52, false],
      '5': [53, false], '6': [54, false], '7': [55, false], '8': [56, false], '9': [57, false],
      /*'': [48, true],*/ '!': [49, true], '"': [50, true], '#': [51, true], '$': [52, true],
      '%': [53, true], '&': [54, true], '\'': [55, true], '(': [56, true], ')': [57, true],
      //
      ':': [186, false], ';': [187, false], ',': [188, false], '-': [189, false], '.': [190, false],
      '/': [191, false], '@': [192, false], '[': [219, false], '\\': [220, false], ']': [221, false],
      '^': [222, false], /*'\\': [226, false],*/
      '*': [186, true], '+': [187, true], '<': [188, true], '=': [189, true], '>': [190, true],
      '?': [191, true], '`': [192, true], '{': [219, true], '|': [220, true], '}': [221, true],
      '~': [222, true], '_': [226, true]
    }
    const kKeyCodes = {
      a: [65, false], b: [66, false], c: [67, false], d: [68, false], e: [69, false],
      f: [70, false], g: [71, false], h: [72, false], i: [73, false], j: [74, false],
      k: [75, false], l: [76, false], m: [77, false], n: [78, false], o: [79, false],
      p: [80, false], q: [81, false], r: [82, false], s: [83, false], t: [84, false],
      u: [85, false], v: [86, false], w: [87, false], x: [88, false], y: [89, false],
      z: [90, false],
      A: [65, true], B: [66, true], C: [67, true], D: [68, true], E: [69, true],
      F: [70, true], G: [71, true], H: [72, true], I: [73, true], J: [74, true],
      K: [75, true], L: [76, true], M: [77, true], N: [78, true], O: [79, true],
      P: [80, true], Q: [81, true], R: [82, true], S: [83, true], T: [84, true],
      U: [85, true], V: [86, true], W: [87, true], X: [88, true], Y: [89, true],
      Z: [90, true],
      '0': [48, false], '1': [49, false], '2': [50, false], '3': [51, false], '4': [52, false],
      '5': [53, false], '6': [54, false], '7': [55, false], '8': [56, false], '9': [57, false],
      ')': [48, true], '!': [49, true], '@': [50, true], '#': [51, true], '$': [52, true],
      '%': [53, true], '^': [54, true], '&': [55, true], '*': [56, true], '(': [57, true],
      //`~
      '`': [192, false], '~': [192, true],
      //-=[];'\,./
      '-': [189, false], '=': [187, false], '[': [219, false], ']': [221, false], ';': [186, false],
      '\'': [222, false], '\\': [220, false], ',': [188, false], '.': [190, false], '/': [191, false],
      //_+{}:"|<>?
      '_': [189, true], '+': [187, true], '{': [219, true], '}': [221, true], ':': [186, true],
      '"': [222, true], '|': [220, true], '<': [188, true], '>': [190, true], '?': [191, true]
    }
    let code = null;
    if(this.activeConfigs.japaneseKeybord === true) {
      code = kKeyCodesJP[char];
    } else {
      code = kKeyCodes[char];
    }

    if(isNotEmpty(code) === false) {
      return null;
    }
    for(let keyBind of this.keyBinds) {
      if(keyBind.keyCode === code[0] && keyBind.shiftKey === code[1]) {
        return keyBind;
      }
    }
    return null;
  },

  //sample を参考にしたが、これがどのような効果なのか理解できていない
  makeDistortionCurve(amount) {
    let samples = 44100,
      curve = new Float32Array(samples),
      deg = Math.PI / 180,
      x = 0;
    for (let i = 0 ; i < samples; ++i ) {
      x = i * 2 / samples - 1;
      curve[i] = ( 3 + amount ) * x * 20 * deg / ( Math.PI + amount * Math.abs(x) );
    }
    return curve;
  },

  sortKeyBind() {
    this.keyBinds.sort(KeyBind.compare);
  }

  /*zxcvb
    setLowpassFilter(frequency, Q) {
      this.lowpassFilter = this.audioContext.createBiquadFilter();
      this.lowpassFilter.type = "lowpass";
      this.lowpassFilter.frequency.value = frequency;
      this.lowpassFilter.Q.value = Q;
      this.filters.push(this.lowpassFilter);
    },

    setHighpassFilter(frequency, Q) {
      this.highpassFilter = this.audioContext.createBiquadFilter();
      this.highpassFilter.type = "highpass";
      this.highpassFilter.frequency.value = frequency;
      this.highpassFilter.Q.value = Q;
      this.filters.push(this.highpassFilter);
    },

    setBandpassFilter(frequency, Q) {
      this.bandpassFilter = this.audioContext.createBiquadFilter();
      this.bandpassFilter.type = "bandpass";
      this.bandpassFilter.frequency.value = frequency;
      this.bandpassFilter.Q.value = Q;
      this.filters.push(this.bandpassFilter);a
    },

    setLowshelfFilter(frequency, gain) {
      this.lowshelfFilter = this.audioContext.createBiquadFilter();
      this.lowshelfFilter.type = "lowshelf";
      this.lowshelfFilter.frequency.value = frequency;
      this.lowshelfFilter.gain.value = gain;
      this.filters.push(this.lowshelfFilter);
    },

    setHighshelfFilter(frequency, gain) {
      this.highshelfFilter = this.audioContext.createBiquadFilter();
      this.highshelfFilter.type = "highshelf";
      this.highshelfFilter.frequency.value = frequency;
      this.highshelfFilter.gain.value = gain;
      this.filters.push(this.highshelfFilter);
    },

    setPeakingFilter(frequency, Q, gain) {
      this.peakingFilter = this.audioContext.createBiquadFilter();
      this.peakingFilter.type = "peaking";
      this.peakingFilter.frequency.value = frequency;
      this.peakingFilter.Q.value = Q;
      this.peakingFilter.gain.value = gain;
      this.filters.push(this.peakingFilter);
    },

    setNotchFilter(frequency, Q) {
      this.notchFilter = this.audioContext.createBiquadFilter();
      this.notchFilter.type = "notch";
      this.notchFilter.frequency.value = frequency;
      this.notchFilter.Q.value = Q;
      this.filters.push(this.notchFilter);
    },

    setAllpassFilter(frequency, Q) {
      this.allpassFilter = this.audioContext.createBiquadFilter();
      this.allpassFilter.type = "allpass";
      this.allpassFilter.frequency.value = frequency;
      this.allpassFilter.Q.value = Q;
      this.filters.push(this.allpassFilter);
    },
  */
  /*
    makeDefaultConfig() {
      const extension = ".wav";
      const scales = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const octaves = ['-1', '1', '2', '3', '4', '5', '6', '7', '8'];
      let obj = {};
      obj.path = "";
      obj.patterns = [];
      for(let octave of octaves) {
        for(let scale of scales) {
          let keyBind = new KeyBind();
          delete keyBind.fileData;
          keyBind.filePath = scale + octave + extension;
          obj.patterns.push(keyBind);
        }
      }
      let path = "C:/Users/BlueSilverCat/github/pseudo-synthesizer/test.cson"
      writeToCson(path, obj, this.writeSuccess, this.failed() );
      return obj;
    },
  */
};
