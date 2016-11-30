# pseudo-synthesizer package

This package play music if you press key.  
On initial activate, this package extract zipped files to package folder (.../.atom/packages/pseudo-synthesizer/data).  

# Commands
* `pseudo-synthesizer:toggle`  
  Activate/Deactivate this package.  
* `pseudo-synthesizer:analyser`  
  Open analyser.  
* `pseudo-synthesizer:startAutoPlay`  
  Start auto play.  
* `pseudo-synthesizer:stopAutoPlay`  
  Stop auto play.  
* `pseudo-synthesizer:settings`  
  Open this package settings.  

# About keybind config file
Keybind config file is CSON file.  
It contain array of Objects that named keyBinds.  
Properties of Object are name, keyCode, alt, ctrl and shift.  
* name : Name of the sound to be played.  
* keyCode : When the key specified by keyCode is pressed, play the sound specified by Name.
* altKey : optional. if use alt key, set this to true.
* ctrlKey : optional. if use ctrl key, set this to true.
* shiftKey : optional. if use shift key, set this to true.

e.g.  
```.js
keyBinds: [
  {
    name: "C1"
    keyCode: 192
    altKey: false
    ctrlKey: false
    shiftKey: false
  }
  {
    name: "C5"
    keyCode: 192
    altKey: false
    ctrlKey: false
    shiftKey: true
  }
]
```

# About source config file
Source config file is CSON file.  
It contain String that named commonPath and array of Objects that named sourceFiles.  
* commonPath : Specify the directory containing the sound source file. If commonPath is empty String (""), set this to default ( ".../.atom/packages/pseudo-synthesizer/data/source").  

Properties of Object are name, fileName.  
* name : Define Name of sound to be played. This name is used to resolve keybind.
* fineName : Specify the file name you want to play. Supported file formats are WAV, MP3, AAC, OGG and others.  

e.g.  
```.js
commonPath: ""
sourceFiles: [
  {
    name: "C1"
    fileName: "C1.ogg"
  }
  {
    name: "C4"
    fileName: "C4.ogg"
  }
]
```

## About source Oscillator
If set UseSourceFile to false, this package create sound from oscillator.  
Musical note to be created are C, C#, D, D#, E, F, F#, G, G#, A, A# and B.  
Octaves are no limit. (But audible range is about -2 to 10.)  
For the above reasons, Name to resolve keybind are ..., 'C-1', ..., 'C4', 'C#4', ... 'B9', ... .  

# About impluse response config file
Impluse response config file is CSON file.  
It contain String that named commonPath and array of Objects that named sourceFiles.  
* commonPath : Specify the directory containing the impulse response file. If commonPath is empty String (""), set this to default ( ".../.atom/packages/pseudo-synthesizer/data/ir").  

Properties of Object are description, fileName.  
* description : Description about this impluse response.
* fineName : Specify the file name you want to use. Supported file formats are WAV, MP3, AAC, OGG and others.

e.g.
```.js
commonPath: ""
impulseResponses: [
  {
    description: "Empty Apartment Bedroom"
    fileName: "empty_apartment_bedroom_06.ogg"
  }
  #
  {
    description: "St. George's Episcopal Church far"
    fileName: "st_georges_far.ogg"
  }
]
```

# About auto play
Playable charcters are alphanumeric characters and symbols.  
This package converts characters to keycode, then play sound corresponding to keycode.  

---
# Appendix
## Key codes
| key | code(english104) | code(japanese109) |
| :--- | :--- | :--- |
| 0    | 48 | 48
| 1    | 49 | 49
| 2    | 50 | 50
| 3    | 51 | 51
| 4    | 52 | 52
| 5    | 53 | 53
| 6    | 54 | 54
| 7    | 55 | 55
| 8    | 56 | 56
| 9    | 57 | 57
| a   | 65 | 65
| b   | 66 | 66
| c   | 67 | 67
| d   | 68 | 68
| e   | 69 | 69
| f   | 70 | 70
| g   | 71 | 71
| h   | 72 | 72
| i   | 73 | 73
| j   | 74 | 74
| k   | 75 | 75
| l   | 76 | 76
| m   | 77 | 77
| n   | 78 | 78
| o   | 79 | 79
| p   | 80 | 80
| q   | 81 | 81
| r   | 82 | 82
| s   | 83 | 83
| t   | 84 | 84
| u   | 85 | 85
| v   | 86 | 86
| w   | 87 | 87
| x   | 88 | 88
| y   | 89 | 89
| z   | 90 | 90
| A   | 65 + shift | 65 + shift
| B   | 66 + shift | 66 + shift
| C   | 67 + shift | 67 + shift
| D   | 68 + shift | 68 + shift
| E   | 69 + shift | 69 + shift
| F   | 70 + shift | 70 + shift
| G   | 71 + shift | 71 + shift
| H   | 72 + shift | 72 + shift
| I   | 73 + shift | 73 + shift
| J   | 74 + shift | 74 + shift
| K   | 75 + shift | 75 + shift
| L   | 76 + shift | 76 + shift
| M   | 77 + shift | 77 + shift
| N   | 78 + shift | 78 + shift
| O   | 79 + shift | 79 + shift
| P   | 80 + shift | 80 + shift
| Q   | 81 + shift | 81 + shift
| R   | 82 + shift | 82 + shift
| S   | 83 + shift | 83 + shift
| T   | 84 + shift | 84 + shift
| U   | 85 + shift | 85 + shift
| V   | 86 + shift | 86 + shift
| W   | 87 + shift | 87 + shift
| X   | 88 + shift | 88 + shift
| Y   | 89 + shift | 89 + shift
| Z   | 90 + shift | 90 + shift
| ` | 192 | 192 + shift
| ~ | 192 + shift | 220 + shift
| ! | 49 + shift | 49 + shift
| @ | 50 + shift | 192
| # | 51 + shift | 51 + shift
| $ | 52 + shift | 52 + shift
| % | 53 + shift | 53 + shift
| ^ | 54 + shift | 222
| & | 55 + shift | 54 + shift
| * | 56 + shift | 186 + shift
| ( | 57 + shift | 56 + shift
| ) | 48 + shift | 57 + shift
| - | 189 | 189
| _ | 189 + shift | 226 + shift
| = | 187 | 189 + shift
| + | 187 + shift | 187 + shift
| [ | 219 | 219
| { | 219 + shift | 219 + shift
| ] | 221 | 221
| } | 221 + shift | 221 + shift
| \ | 220 | 220 or 226
| \| | 220 + shift | 220 + shift
| ; | 186 | 187
| : | 186 + shift | 186
| ' | 222 | 55 + shift
| " | 222 + shift | 50 + shift
| , | 188 | 188
| < | 188 + shift | 188 + shift
| . | 190 | 190
| > | 190 + shift | 190 + shift
| / | 191 | 191
| ? | 191 + shift | 191 + shift
| T0 | 96 | 96
| T1 | 97 | 97
| T2 | 98 | 98
| T3 | 99 | 99
| T4 | 100 | 100
| T5 | 101 | 101
| T6 | 102 | 102
| T7 | 103 | 103
| T8 | 104 | 104
| T9 | 105 | 105
| T* | 106 | 106
| T+ | 107 | 107
| T- | 109 | 109
| T. | 110 | 110
| T/ | 111 | 111
| T5(NumLock Off) | 12 | 12
| NumLock | 114 | 114
| F1 | 112 | 112
| F2 | 113 | 113
| F3 | 114 | 114
| F4 | 115 | 115
| F5 | 116 | 116
| F6 | 117 | 117
| F7 | 118 | 118
| F8 | 119 | 119
| F9 | 120 | 120
| F10 | 121 | 121
| F11 | 122 | 122
| F12 | 123 | 123
| Backspace | 8 | 8
| Tab | 9 | 9
| Enter | 13 | 13
| Shift | 16 | 16
| Ctrl | 17 | 17
| Pause/Break | 19 | 19
| CapsLock | 20 | 20
| Escape | 27 | 27
| Space | 32 | 32
| PageUp | 33 | 33
| PageDown | 34 | 34
| End | 35 | 35
| Home | 36 | 36
| Left | 37 | 37
| Up | 38 | 38
| Right | 39 | 39
| Down | 40 | 40
| Insert | 45 | 45
| Delete | 46 | 46
| Left Win(Cmd) | 91 | 91
| right Win(Cmd) | 92 | 92
| Apps | 93 | 93
| ScrollLock | 145 | 145
